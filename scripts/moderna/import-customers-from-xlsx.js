const { Client } = require('pg')
const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '..', '.env')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  content.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([^#\s=]+)\s*=\s*(.*)\s*$/)
    if (!m) return
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    process.env[m[1]] = val
  })
}

function getExcelDate(v) {
  if (typeof v === 'number') {
    const epoch = new Date(Math.round((v - 25569) * 86400 * 1000))
    return isNaN(epoch.getTime()) ? null : epoch
  }
  if (!v) return null
  const s = String(v).trim()
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split('/')
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s)
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function normalizeDigits(v) {
  return String(v || '').replace(/\D/g, '')
}

function parseCurrencyToCents(v) {
  return v * 100;
}

function mapRelationship(s) {
  const t = String(s || '').trim().toUpperCase()
  if (t === 'DEPENDENTE - CONJUGE' || t === 'DEPENDENTE - CÔNJUGE' || t === 'DEPENDENTE - CONJUGUE') return 'SPOUSE'
  if (t === 'DEPENDENTE - FILHO(A)' || t === 'DEPENDENTE - FILHO(A' || t === 'DEPENDENTE - FILHO' || t === 'DEPENDENTE - FILHA') return 'CHILD'
  return null
}

function mapPlanId(planRaw) {
  const t = String(planRaw || '').trim().toUpperCase()
  if (t === 'ANA ROSA - GRUPO ANA ROSA') return 'p-plan-black-annual'
  if (t === 'ABAP - ASSOC. BENEF. DOS APOSENT. PETROQUIMICA') return 'p-plan-premium-monthly'
  if (t === 'PREMIUM') return 'p-plan-premium-annual'
  if (t === 'BLACK') return 'p-plan-black-annual'
  return null
}


function normalizePart(v) {
  return String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function buildEmailFromName(fullName) {
  const t = String(fullName || '').trim()
  if (!t) return null
  const parts = t.split(/\s+/)
  const first = normalizePart(parts[0])
  const last = normalizePart(parts[parts.length - 1] || parts[0])
  if (!first || !last) return null
  return `${first}.${last}@cartaobeneficios.com`
}


async function run() {
  loadEnv()
  const file = process.argv[2]
  if (!file) {
    process.stderr.write('XLSX path required\n')
    process.exit(1)
  }
  console.log('[import] start', { cwd: process.cwd(), file })
  const fileExists = fs.existsSync(file)
  console.log('[import] file exists:', fileExists)
  if (!fileExists) {
    process.stderr.write(`File not found: ${file}\n`)
    process.exit(1)
  }

  const advConfig = {
    host: process.env.DB_HOST_LOCAL || process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: (() => {
      const v = String(process.env.DB_SSL || '').trim().toLowerCase()
      if (v === 'false' || v === '0' || v === 'disable' || v === 'disabled') return undefined
      const reject = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || '').trim().toLowerCase()
      const rej = (reject === 'true' || reject === '1' || reject === 'yes')
      return { rejectUnauthorized: rej }
    })(),
  }
  if (!advConfig.host || !advConfig.user || !advConfig.database) {
    process.stderr.write('ADVANTAGE DATABASE configuration missing\n')
    process.exit(1)
  }
  console.log('[import] advantage db config:', {
    host: advConfig.host,
    port: advConfig.port,
    user: advConfig.user,
    database: advConfig.database,
    ssl: !!advConfig.ssl,
  })

  console.log('[import] usando um único banco; schemas: advantage, checkout')

  console.log('[import] reading xlsx')
  const wb = XLSX.readFile(file)
  const sheetName = wb.SheetNames[0]
  console.log('[import] sheet:', sheetName)
  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
  if (!rows || rows.length < 2) {
    process.stdout.write('No rows found\n')
    process.exit(0)
  }

  const headers = rows[0].map(h => String(h || '').trim())
  console.log('[import] headers:', headers)
  const idx = (label) => headers.findIndex(h => h === label)

  const iNome = idx('Pessoa Física')
  const iCpf = idx('CPF')
  const iBirth = idx('Dt. Nasc')
  const iEmail = idx('E-mail')
  const iPhone = idx('Telefone')
  const iParentesco = idx('Parentesco')
  const iRegistro = idx('Registro')
  const iPlano = idx('Plano')
  const iMetodoPagto = idx('METODO_PAGTO')
  const iFimVigencia = idx('Dt Fim Vigência')
  const iValorTotal = idx('VALOR_TOTAL')
  const iCep = idx('CEPFormatado') !== -1 ? idx('CEPFormatado') : idx('CEP')
  const iNumero = idx('Numero')
  const iRua = idx('Rua')
  const iBairro = idx('Bairro')
  const iCidade = idx('Cidade')
  const iEstado = idx('Estado')
  const iComplemento = idx('Complemento')
  // console.log('[import] indices:', { iNome, iCpf, iBirth, iEmail, iPhone, iCep, iNumero, iRua, iBairro, iCidade, iEstado, iComplemento })

  const skipRows = new Set()
  const promotedTitular = new Map()
  if (iRegistro !== -1 && iParentesco !== -1) {
    const regMap = new Map()
    for (let r = 1; r < rows.length; r++) {
      const regValRaw = rows[r][iRegistro]
      const regVal = String(regValRaw || '').trim()
      if (!regVal) continue
      const parRaw = rows[r][iParentesco]
      const par = String(parRaw || '').trim().toUpperCase()
      if (!regMap.has(regVal)) regMap.set(regVal, { titularIdxs: [], spouseIdx: null, oldestChildIdx: null, oldestChildBirth: null, cpfs: new Map() })
      const entry = regMap.get(regVal)
      if (par === 'TITULAR') entry.titularIdxs.push(r)
      if (par === 'DEPENDENTE - CONJUGE' || par === 'DEPENDENTE - CÔNJUGE' || par === 'DEPENDENTE - CONJUGUE') {
        if (entry.spouseIdx == null) entry.spouseIdx = r
      }
      if (par === 'DEPENDENTE - FILHO(A)' || par === 'DEPENDENTE - FILHO(A' || par === 'DEPENDENTE - FILHO' || par === 'DEPENDENTE - FILHA') {
        const bd = iBirth !== -1 ? getExcelDate(rows[r][iBirth]) : null
        if (entry.oldestChildIdx == null) {
          entry.oldestChildIdx = r
          entry.oldestChildBirth = bd
        } else {
          if (bd && entry.oldestChildBirth) {
            if (bd < entry.oldestChildBirth) {
              entry.oldestChildIdx = r
              entry.oldestChildBirth = bd
            }
          }
        }
      }
      const cpf = iCpf !== -1 ? normalizeDigits(rows[r][iCpf]) : null
      if (cpf) {
        if (!entry.cpfs.has(cpf)) entry.cpfs.set(cpf, { t: [], d: [] })
        const bucket = entry.cpfs.get(cpf)
        if (par === 'TITULAR') bucket.t.push(r)
        else bucket.d.push(r)
      }
    }
    regMap.forEach(({ cpfs }) => {
      cpfs.forEach(({ t, d }) => {
        if (t.length > 0 && d.length > 0) {
          t.forEach(idxRow => {
            rows[idxRow][iParentesco] = 'DEPENDENTE - FILHO(A)'
          })
        }
      })
    })
    regMap.forEach(({ titularIdxs }) => {
      if (titularIdxs.length > 1) {
        const [firstIdx, ...rest] = titularIdxs
        const firstCpf = iCpf !== -1 ? normalizeDigits(rows[firstIdx][iCpf]) : null
        rest.forEach(idxRow => {
          const cpfDup = iCpf !== -1 ? normalizeDigits(rows[idxRow][iCpf]) : null
          if (firstCpf && cpfDup && firstCpf === cpfDup) {
            skipRows.add(idxRow)
          } else {
            rows[idxRow][iParentesco] = 'DEPENDENTE - FILHO(A)'
          }
        })
      }
    })
    regMap.forEach(({ titularIdxs, spouseIdx, oldestChildIdx }) => {
      if (titularIdxs.length === 0) {
        if (spouseIdx != null) {
          rows[spouseIdx][iParentesco] = 'TITULAR'
          promotedTitular.set(spouseIdx, 'spouse')
        } else if (oldestChildIdx != null) {
          rows[oldestChildIdx][iParentesco] = 'TITULAR'
          promotedTitular.set(oldestChildIdx, 'oldest-child')
        }
      }
    })
  }

  const adv = new Client(advConfig)
  try {
    console.log('[import] connecting advantage db')
    await adv.connect()
    console.log('[import] advantage db connected')
  } catch (e) {
    process.stderr.write(`Failed to connect ADVANTAGE DB: ${e.message}\n`)
    process.exit(1)
  }
  // único banco; nenhuma conexão extra para checkout

  let count = 0
  const registryToCustomerId = {}
  const emailToCustomerId = {}
  const emailToRegistry = {}
  const emailUsed = new Set()
  const cpfToCustomerId = {}
  const failedRows = []
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (skipRows.has(r)) continue
    try {
    const name = row[iNome]
    const cpf = normalizeDigits(row[iCpf])
    const birthDate = getExcelDate(row[iBirth])
    let email = row[iEmail]
    const originalEmail = row[iEmail]
    const phoneDigits = normalizeDigits(row[iPhone])
    const phone = phoneDigits ? phoneDigits : '0'
    const parentesco = row[iParentesco]
    const registro = row[iRegistro]
    const planoRaw = row[iPlano]
    const metodoPagto = row[iMetodoPagto]
    let emailKey = String(email || '').trim().toLowerCase()
    const regKey = registro ? String(registro) : null
    const notes = []
    if (!phoneDigits) notes.push('phone=0')
    if (emailKey && regKey) {
      const prev = emailToRegistry[emailKey]
      if (prev && prev !== regKey) {
        const generated = buildEmailFromName(name)
        if (generated) {
          email = generated
          emailKey = generated.toLowerCase()
          notes.push('email-generated-from-name')
        }
      }
      if (!emailToRegistry[emailKey]) emailToRegistry[emailKey] = regKey
    }
    if (!emailKey) {
      const generated = buildEmailFromName(name)
      if (generated) {
        email = generated
        emailKey = generated.toLowerCase()
        notes.push('email-generated-from-name')
      }
    }
    if (emailKey) {
      let conflict = emailUsed.has(emailKey) || !!emailToCustomerId[emailKey]
      if (!conflict) {
        const chk = await adv.query('SELECT 1 FROM advantage."Customer" WHERE email = $1 LIMIT 1', [email])
        conflict = chk.rowCount > 0
      }
      if (conflict) {
        const base = buildEmailFromName(name) || email
        const at = base.indexOf('@')
        const local = at !== -1 ? base.slice(0, at) : base
        const domain = at !== -1 ? base.slice(at + 1) : 'cartaobeneficios.com'
        let i = 2
        while (true) {
          const candidate = `${local}${i}@${domain}`
          const key = candidate.toLowerCase()
          let exists = emailUsed.has(key) || !!emailToCustomerId[key]
          if (!exists) {
            const c2 = await adv.query('SELECT 1 FROM advantage."Customer" WHERE email = $1 LIMIT 1', [candidate])
            exists = c2.rowCount > 0
          }
          if (!exists) {
            email = candidate
            emailKey = key
            break
          }
          i++
        }
      }
      emailUsed.add(emailKey)
    }
    const nextChargeDate = getExcelDate(row[iFimVigencia])
    const valorTotalRaw = row[iValorTotal]
    const amountCents = parseCurrencyToCents(valorTotalRaw)
    const zipcode = normalizeDigits(row[iCep])
    const numberRaw = row[iNumero]
    const number = (numberRaw === null || numberRaw === undefined || String(numberRaw).trim() === '') ? '0' : String(numberRaw).trim()
    if (number === '0') notes.push('address-number=0')
    const street = row[iRua]
    const district = row[iBairro]
    const city = row[iCidade]
    const state = String(row[iEstado] || '').toUpperCase()
    const complement = iComplemento !== -1 ? row[iComplemento] || null : null

    await adv.query('BEGIN')
    const isTitular = String(parentesco || '').trim().toUpperCase() === 'TITULAR'
    if (isTitular) {
      const emailKey = String(email || '').trim().toLowerCase()
      let existingId = (cpf && cpfToCustomerId[cpf]) || (emailKey && emailToCustomerId[emailKey]) || null
      if (!existingId && (cpf || emailKey)) {
        const lookup = await adv.query('SELECT id FROM advantage."Customer" WHERE ($1::text IS NOT NULL AND cpf = $1) OR ($2::text IS NOT NULL AND email = $2) LIMIT 1', [cpf || null, email || null])
        if (lookup.rowCount > 0) existingId = lookup.rows[0].id
      }
      if (existingId) {
        if (registro) registryToCustomerId[String(registro)] = existingId
        await adv.query('ROLLBACK')
        continue
      }
      if (!name || !cpf || !email || !phone || !street || !number || !district || !city || !state || !zipcode) {
        await adv.query('ROLLBACK')
        const missing = []
        if (!name) missing.push('Pessoa Física')
        if (!cpf) missing.push('CPF')
        if (!email) missing.push('E-mail')
        if (!phone) missing.push('Telefone')
        if (!street) missing.push('Rua')
        if (!number) missing.push('Numero')
        if (!district) missing.push('Bairro')
        if (!city) missing.push('Cidade')
        if (!state) missing.push('Estado')
        if (!zipcode) missing.push('CEP')
        failedRows.push({ row, reason: `Campos obrigatórios faltando: ${missing.join(', ')}` })
        continue
      }
      if (promotedTitular.has(r)) {
        const reason = promotedTitular.get(r)
        if (reason === 'spouse') notes.push('promoted-titular=spouse')
        else if (reason === 'oldest-child') notes.push('promoted-titular=oldest-child')
      }
      if (originalEmail && String(originalEmail).trim().toLowerCase() !== String(email || '').trim().toLowerCase()) {
        notes.push('email-updated')
      }
      const comments = notes.join('; ')
      const newId = randomUUID()
      console.log('[adv] inserting customer', { id: newId, name, cpf, email, phone })
      const customerRes = await adv.query(
        'INSERT INTO advantage."Customer" (id, name, cpf, "birthDate", email, phone, comments, "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, now()) ON CONFLICT (cpf) DO UPDATE SET name = EXCLUDED.name, "birthDate" = EXCLUDED."birthDate", email = EXCLUDED.email, phone = EXCLUDED.phone, comments = EXCLUDED.comments, "updatedAt" = now() RETURNING id',
        [newId, name, cpf, birthDate, email, phone, comments]
      )
      const customerId = customerRes.rows[0].id
      if (registro) registryToCustomerId[String(registro)] = customerId
      if (emailKey) emailToCustomerId[emailKey] = customerId
      if (cpf) cpfToCustomerId[cpf] = customerId

      console.log('[adv] upserting address', { customerId, street, number, district, city, state, zipcode })
      await adv.query(
        'INSERT INTO advantage."Address" ("customerId", type, street, number, complement, district, city, state, zipcode, country, "isDefault", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now()) ON CONFLICT ("customerId") DO UPDATE SET type = EXCLUDED.type, street = EXCLUDED.street, number = EXCLUDED.number, complement = EXCLUDED.complement, district = EXCLUDED.district, city = EXCLUDED.city, state = EXCLUDED.state, zipcode = EXCLUDED.zipcode, country = EXCLUDED.country, "isDefault" = EXCLUDED."isDefault", "updatedAt" = now()',
        [customerId, 'HOME', street, number, complement, district, city, state, zipcode, 'BR', true]
      )

      {
        const existing = await adv.query('SELECT id FROM checkout."Customer" WHERE cpf = $1', [cpf])
        if (existing.rowCount === 0) {
          await adv.query('INSERT INTO checkout."Customer" (id, name, cpf, "updatedAt") VALUES ($1, $2, $3, now())', [customerId, name, cpf])
        } else {
          await adv.query('UPDATE checkout."Customer" SET id = $1, name = $2, "updatedAt" = now() WHERE cpf = $3', [customerId, name, cpf])
        }

        const planId = mapPlanId(planoRaw)
        if (planId) {
          const subId = randomUUID()
          await adv.query(
            'INSERT INTO checkout."Subscription" (id, "customerId", "planId", "startDate", status, "paymentMethod", "nextChargeDate", comments, "updatedAt") VALUES ($1, $2, $3, now(), $4, $5, $6, $7, now()) ON CONFLICT (id) DO NOTHING',
            [subId, customerId, planId, 'ACTIVE', 'MODERNA', nextChargeDate, metodoPagto || null]
          )
          const orderId = randomUUID()
          await adv.query(
            'INSERT INTO checkout."Order" (id, "subscriptionId", "customerId", sequence, amount, "dueDate", status, "paymentMethod", comments, "updatedAt") VALUES ($1, $2, $3, $4, $5, now(), $6, $7, $8, now())',
            [orderId, subId, customerId, 1, amountCents, 'PAID', 'MODERNA', metodoPagto || null]
          )
        }
      }

      const contractId = randomUUID()
      const envelopeId = randomUUID()
      console.log('[adv] upserting contract', { customerId })
      await adv.query(
        'INSERT INTO advantage."Contract" (id, "customerId", "envelopeId", status, "documentType", comments, "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, now()) ON CONFLICT ("customerId") DO UPDATE SET status = EXCLUDED.status, "documentType" = EXCLUDED."documentType", comments = EXCLUDED.comments, "updatedAt" = now()',
          [contractId, customerId, envelopeId, 'completed', 'contract-operator', 'MODERNA']
        )
    } else {
      const customerId = registro ? registryToCustomerId[String(registro)] : null
      if (!customerId || !name) {
        await adv.query('ROLLBACK')
        failedRows.push({ row, reason: 'Titular não encontrado pelo Registro ou nome ausente' })
        continue
      }
      const depIdInitial = randomUUID()
      let depId = depIdInitial
      const rel = mapRelationship(parentesco)
      if (!rel) {
        await adv.query('ROLLBACK')
        failedRows.push({ row, reason: 'Parentesco inválido' })
        continue
      }
      if (cpf) {
        console.log('[adv] inserting dependent with cpf', { customerId, name, cpf, relationship: rel })
        const depRes = await adv.query(
          'INSERT INTO advantage."Dependent" (id, "customerId", name, cpf, "birthDate", eligible, relationship, "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, now()) ON CONFLICT (cpf) DO UPDATE SET name = EXCLUDED.name, "birthDate" = EXCLUDED."birthDate", relationship = EXCLUDED.relationship, "updatedAt" = now() RETURNING id',
          [depIdInitial, customerId, name, cpf, birthDate, true, rel]
        )
        depId = depRes.rows[0].id
      } else {
        console.log('[adv] inserting dependent without cpf', { customerId, name, relationship: rel })
        const depRes = await adv.query(
          'INSERT INTO advantage."Dependent" (id, "customerId", name, "birthDate", eligible, relationship, "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, now()) RETURNING id',
          [depIdInitial, customerId, name, birthDate, true, rel]
        )
        depId = depRes.rows[0].id
      }
      const docId = randomUUID()
      const fileName = `cpf-${depId}.pdf`
      const filePath = `/uploads/${depId}.pdf`
      console.log('[adv] inserting dependent document', { dependentId: depId, fileName })
      await adv.query(
        'INSERT INTO advantage."Document" (id, kind, "fileName", "filePath", "mimeType", "sizeBytes", checksum, "isApproved", "uploadedAt", "updatedAt", "dependentId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now(), $9)',
        [docId, 'CPF', fileName, filePath, 'application/pdf', 1024, null, true, depId]
      )
    }

    await adv.query('COMMIT')
    count++
    } catch (e) {
      try { await adv.query('ROLLBACK') } catch {}
      const msg = e && e.message ? e.message : String(e)
      const dupCpf = /cpf/i.test(msg) && /(duplicate|unique|violat)/i.test(msg)
      failedRows.push({ row, reason: dupCpf ? `CPF duplicado: ${msg}` : `Erro: ${msg}` })
    }
  }

  await adv.end()
  if (failedRows.length > 0) {
    const outWb = XLSX.utils.book_new()
    const headersWithError = [...headers, 'ERROR']
    const rowsWithError = failedRows.map(fr => ([...fr.row, fr.reason]))
    const outWs = XLSX.utils.aoa_to_sheet([headersWithError, ...rowsWithError])
    XLSX.utils.book_append_sheet(outWb, outWs, sheetName)
    const outPath = path.join(path.dirname(file), `${path.basename(file, path.extname(file))}.failed${path.extname(file)}`)
    XLSX.writeFile(outWb, outPath)
    console.log('[import] failed log:', outPath)
  }
  process.stdout.write(`Imported: ${count}\n`)
}

run().catch((err) => {
  process.stderr.write(`${err.message}\n`)
  process.exitCode = 1
})
