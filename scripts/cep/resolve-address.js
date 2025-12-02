

const XLSX = require('xlsx');
const axios = require('axios');

function sanitizeCEP(raw) {
  const digits = String(raw || '').replace(/\D+/g, '');
  return digits.length === 8 ? digits : null;
}

async function ResolveAddress(cep, opts = {}) {
  const {
    timeoutMs = 15000,
    retries = 2,
    backoffBaseMs = 500,
    backoffJitterMs = 200,
    providers = ['viacep', 'opencep', 'brasilapi'],
  } = opts;
  const clean = sanitizeCEP(cep);
  if (!clean) {
    return {
      CEPFormatado: null,
      Rua: null,
      Bairro: null,
      Cidade: null,
      Estado: null,
      Erro: 'CEP inválido'
    };
  }

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const queryProvider = async (providerName) => {
    if (providerName === 'viacep') {
      const url = `https://viacep.com.br/ws/${clean}/json/`;
      const { data } = await axios.get(url, { timeout: timeoutMs });
      if (data && data.erro) return { notFound: true };
      return {
        CEPFormatado: clean,
        Rua: data.logradouro || null,
        Bairro: data.bairro || null,
        Cidade: data.localidade || null,
        Estado: data.uf || null,
        Erro: null
      };
    }
    if (providerName === 'opencep') {
      const url = `https://opencep.com/v1/${clean}.json`;
      try {
        const { data } = await axios.get(url, { timeout: timeoutMs });
        if (data && (data.erro || data.error)) return { notFound: true };
        return {
          CEPFormatado: clean,
          Rua: data.logradouro || null,
          Bairro: data.bairro || null,
          Cidade: data.localidade || null,
          Estado: data.uf || null,
          Erro: null
        };
      } catch (err) {
        if (err?.response?.status === 404) return { notFound: true };
        throw err;
      }
    }
    if (providerName === 'brasilapi') {
      const url = `https://brasilapi.com.br/api/cep/v1/${clean}`;
      try {
        const { data } = await axios.get(url, { timeout: timeoutMs });
        return {
          CEPFormatado: clean,
          Rua: data.street || null,
          Bairro: data.neighborhood || null,
          Cidade: data.city || null,
          Estado: data.state || null,
          Erro: null
        };
      } catch (err) {
        if (err?.response?.status === 404) return { notFound: true };
        throw err;
      }
    }
    throw new Error(`Provider desconhecido: ${providerName}`);
  };

  let anyNotFound = false;
  for (const provider of providers) {
    for (let attempt = 1; attempt <= (retries + 1); attempt++) {
      try {
        const res = await queryProvider(provider);
        if (res && res.notFound) { anyNotFound = true; break; }
        return res;
      } catch (err) {
        const status = err?.response?.status;
        const transient = status === 429 || (status >= 500 && status <= 599) || !status;
        if (attempt <= retries && transient) {
          const backoff = backoffBaseMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * backoffJitterMs);
          console.log(`   -> ${provider} tentativa ${attempt} falhou (status=${status ?? 'N/A'}). Aguardando ${backoff}ms antes de re-tentar...`);
          await sleep(backoff);
          continue;
        }
        // Sai para próximo provider
        break;
      }
    }
  }

  return {
    CEPFormatado: clean,
    Rua: null,
    Bairro: null,
    Cidade: null,
    Estado: null,
    Erro: anyNotFound ? 'CEP não encontrado' : 'Falha na consulta'
  };
}

async function processExcel(inputPath, { sheetIndex = 0, outputPath, delayMs = 1000, timeoutMs = 15000, retries = 2, providers } = {}) {
  const wb = XLSX.readFile(inputPath);
  const sheetNames = wb.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('Workbook sem planilhas.');
  }
  const chosen = sheetNames[sheetIndex] || sheetNames[0];
  const ws = wb.Sheets[chosen];

  const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Planilha vazia ou sem cabeçalho.');
  }

  console.log(`Iniciando processamento da planilha "${chosen}" com ${rows.length} linhas...`);

  // Detecta CEP pelo cabeçalho
  const guessCEPKey = (row) => {
    const keys = Object.keys(row);
    const exact = keys.find(k => k === 'CEP');
    if (exact) return exact;
    const normalized = keys.find(k => k.toLowerCase().replace(/\s+/g, '') === 'cep');
    return normalized || 'CEP';
  };

  const cepKey = guessCEPKey(rows[0]);

  // Mapeia possíveis colunas já existentes para endereço
  const headerKeys = Object.keys(rows[0]);
  const normalize = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
  const findKey = (candidates) => {
    // primeiro exato
    for (const c of candidates) {
      const k = headerKeys.find(h => h === c);
      if (k) return k;
    }
    // depois por normalização
    for (const c of candidates) {
      const norm = normalize(c);
      const k = headerKeys.find(h => normalize(h) === norm);
      if (k) return k;
    }
    return null;
  };

  const ruaSrcKey = findKey(['Rua', 'Logradouro', 'Endereço', 'Endereco']);
  const bairroSrcKey = findKey(['Bairro']);
  const cidadeSrcKey = findKey(['Cidade', 'Municipio', 'Município']);
  const estadoSrcKey = findKey(['Estado', 'UF']);

  // Prepara colunas de saída no cabeçalho (append no final)
  const headerAoA = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
  const existingHeaders = Array.isArray(headerAoA) && headerAoA.length > 0 ? headerAoA[0] : Object.keys(rows[0]);
  const outCols = ['CEPFormatado', 'Rua', 'Bairro', 'Cidade', 'Estado', 'Erro'];
  let startCol = existingHeaders.length; // índice de coluna para iniciar os novos campos
  const headerRowIndex = 0;

  // Adiciona cabeçalhos novos no ws
  outCols.forEach((colName, idx) => {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRowIndex, c: startCol + idx });
    ws[cellAddr] = { t: 's', v: colName };
  });

  // Ajusta o range da planilha para incluir novas colunas
  const range = XLSX.utils.decode_range(ws['!ref']);
  const newRange = {
    s: { r: 0, c: 0 },
    e: { r: Math.max(range.e.r, rows.length + 1), c: Math.max(range.e.c, startCol + outCols.length - 1) }
  };
  ws['!ref'] = XLSX.utils.encode_range(newRange);

  const out = outputPath || inputPath.replace(/\.xlsx$/i, '.resolved.xlsx');

  // Processamento linha a linha com gravação incremental
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const sheetRowIndex = i + 1 + 0; // +1 por causa do cabeçalho na primeira linha
    const cepValue = row[cepKey];
    const ruaPreenchida = ruaSrcKey ? String(row[ruaSrcKey] || '').trim() : '';
    let resolved;
    if (ruaPreenchida) {
      // pula chamada à API, aproveita dados existentes
      console.log(`[${i + 1}/${rows.length}] Pulando consulta: rua já preenchida (CEP=${cepValue ?? 'N/A'})`);
      resolved = {
        CEPFormatado: sanitizeCEP(cepValue),
        Rua: row[ruaSrcKey] || null,
        Bairro: bairroSrcKey ? (row[bairroSrcKey] || null) : null,
        Cidade: cidadeSrcKey ? (row[cidadeSrcKey] || null) : null,
        Estado: estadoSrcKey ? (row[estadoSrcKey] || null) : null,
        Erro: null
      };
    } else {
      console.log(`[${i + 1}/${rows.length}] Consultando CEP: ${cepValue ?? 'N/A'}`);
      resolved = await ResolveAddress(cepValue, { timeoutMs, retries, providers });
    }
    if (resolved.Erro) {
      console.log(`   -> Erro: ${resolved.Erro} (CEPFormatado=${resolved.CEPFormatado ?? 'N/A'})`);
    } else {
      console.log(`   -> OK: ${resolved.Rua ?? ''}, ${resolved.Bairro ?? ''}, ${resolved.Cidade ?? ''}/${resolved.Estado ?? ''}`);
    }

    const values = [
      resolved.CEPFormatado,
      resolved.Rua,
      resolved.Bairro,
      resolved.Cidade,
      resolved.Estado,
      resolved.Erro
    ];

    values.forEach((val, idx) => {
      const cellAddr = XLSX.utils.encode_cell({ r: sheetRowIndex, c: startCol + idx });
      const type = typeof val === 'number' ? 'n' : 's';
      ws[cellAddr] = val == null ? { t: 's', v: '' } : { t: type, v: val };
    });

    // Persistir progresso imediatamente
    XLSX.writeFile(wb, out);
    console.log(`   -> Progresso salvo em: ${out}`);

    if (!ruaPreenchida) {
      // Evita sobrecarregar provedores (throttling com jitter)
      const jitter = Math.floor(Math.random() * Math.max(100, Math.floor(delayMs * 0.2)));
      await new Promise(r => setTimeout(r, delayMs + jitter));
    }
  }

  return { outputPath: out, sheetName: chosen, total: rows.length };
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const getArg = (flag, fallback) => {
    const idx = args.indexOf(flag);
    if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
    return fallback;
  };

  const file = getArg('--file', null);
  const sheetIndex = Number.parseInt(getArg('--sheet-index', '0'), 10);
  const output = getArg('--out', null);
  const delayMs = Number.parseInt(getArg('--delay-ms', '1000'), 10);
  const timeoutMs = Number.parseInt(getArg('--timeout-ms', '15000'), 10);
  const retries = Number.parseInt(getArg('--retries', '2'), 10);
  const providersArg = getArg('--providers', null);
  const providers = providersArg ? providersArg.split(',').map(p => p.trim().toLowerCase()).filter(Boolean) : undefined;

  if (!file) {
    console.error('Uso: node scripts/cep/resolve-address.js --file <caminho.xlsx> [--sheet-index 0] [--out <saida.xlsx>] [--delay-ms 1000] [--timeout-ms 15000] [--retries 2] [--providers viacep,opencep,brasilapi]');
    process.exit(1);
  }

  processExcel(file, { sheetIndex, outputPath: output, delayMs, timeoutMs, retries, providers })
    .then(res => {
      console.log(`Processado: ${res.total} linhas na planilha "${res.sheetName}".`);
      console.log(`Arquivo gerado: ${res.outputPath}`);
    })
    .catch(err => {
      console.error('Falha ao processar Excel:', err.message || err);
      process.exit(1);
    });
}

module.exports = { ResolveAddress, processExcel };