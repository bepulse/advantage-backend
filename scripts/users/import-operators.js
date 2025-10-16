#!/usr/bin/env node
/**
 * Importa usuários (role=OPERATOR) a partir de um Excel e faz upsert no Postgres.
 *
 * Uso:
 *  - Com DATABASE_URL no ambiente:
 *      node scripts/users/import-operators.js --file scripts/users/users.xlsx [--schema advantage]
 *  - Ou passando DSN via flag:
 *      node scripts/users/import-operators.js --file scripts/users/users.xlsx --dsn "postgresql://user:pass@host:5432/db" [--schema advantage]
 *
 * Notas:
 *  - Não usa Prisma.
 *  - Faz INSERT ... ON CONFLICT (email) DO UPDATE para garantir idempotência.
 *  - Define updatedAt=NOW() e isActive=TRUE em ambos cenários.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { file: null, dsn: process.env.DATABASE_URL || null, schema: 'advantage', dryRun: false, ssl: undefined };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--file' && args[i + 1]) out.file = args[++i];
    else if (a === '--dsn' && args[i + 1]) out.dsn = args[++i];
    else if (a === '--schema' && args[i + 1]) out.schema = args[++i];
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--ssl') out.ssl = true;
    else if (a === '--no-ssl') out.ssl = false;
  }
  return out;
}

function normalizeFilePath(p) {
  if (!p) return null;
  if (path.isAbsolute(p)) return p;
  return path.join(process.cwd(), p);
}

function extractEmailsFromWorkbook(workbook) {
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error('Excel sem planilhas.');
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  const emails = [];
  for (const row of rows) {
    // tenta encontrar coluna por chaves comuns
    const candidates = ['email', 'Email', 'E-mail', 'e-mail', 'EMAIL'];
    let email = null;
    for (const key of candidates) {
      if (row[key]) { email = String(row[key]).trim(); break; }
    }
    // se não achou, tenta primeira coluna
    if (!email) {
      const keys = Object.keys(row);
      if (keys.length > 0 && row[keys[0]]) email = String(row[keys[0]]).trim();
    }
    if (email) emails.push(email);
  }
  // deduplica e filtra valores inválidos
  const seen = new Set();
  return emails
    .map(e => e.toLowerCase())
    .filter(e => {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
      if (!ok) return false;
      if (seen.has(e)) return false;
      seen.add(e);
      return true;
    });
}

async function main() {
  const { file, dsn, schema, dryRun, ssl } = parseArgs();

  if (!file) {
    console.error('Erro: informe --file <caminho-do-excel>.');
    process.exit(1);
  }
  if (!dsn) {
    console.error('Erro: informe --dsn <postgres-dsn> ou defina DATABASE_URL no ambiente.');
    process.exit(1);
  }

  const excelPath = normalizeFilePath(file);
  if (!fs.existsSync(excelPath)) {
    console.error(`Arquivo Excel não encontrado: ${excelPath}`);
    process.exit(1);
  }

  console.log(`Lendo Excel: ${excelPath}`);
  const workbook = XLSX.readFile(excelPath);
  const emails = extractEmailsFromWorkbook(workbook);
  if (emails.length === 0) {
    console.error('Nenhum email válido encontrado no Excel.');
    process.exit(1);
  }
  console.log(`Total de emails válidos: ${emails.length}`);

  if (dryRun) {
    console.log('DRY-RUN: usuários que seriam importados como OPERATOR:');
    for (const e of emails) console.log(` - ${e}`);
    process.exit(0);
  }

  // Habilita SSL por padrão para endpoints RDS, a menos que --no-ssl seja informado
  const useSSL = typeof ssl === 'boolean' ? ssl : /rds\.amazonaws\.com/.test(dsn);
  const pool = new Pool({ connectionString: dsn, ssl: useSSL ? { rejectUnauthorized: false } : undefined });
  const client = await pool.connect();
  try {
    // Garante o schema; evita depender de search_path global
    const table = `"${schema}"."User"`;
    const enumType = `"${schema}"."UserRole"`;

    const query = `
      INSERT INTO ${table} ("id", "email", "role", "isActive", "updatedAt")
      VALUES ($1, $2, $3::${enumType}, TRUE, NOW())
      ON CONFLICT ("email") DO UPDATE SET
        "role" = EXCLUDED."role",
        "isActive" = TRUE,
        "updatedAt" = NOW();
    `;

    let inserted = 0;
    let updated = 0;

    await client.query('BEGIN');
    for (const email of emails) {
      const id = uuidv4();
      const role = 'OPERATOR';
      try {
        const res = await client.query(query, [id, email, role]);
        // pg não diferencia insert/update no resultado; fazemos uma checagem extra:
        // Consulta rápida para saber se já existia
        const check = await client.query(`SELECT 1 FROM ${table} WHERE "email" = $1`, [email]);
        if (check.rowCount === 1) {
          // Não há maneira confiável de saber se foi insert ou update sem mais lógica; assumimos:
          // Se o id gerado agora está presente, foi insert; se não, foi update.
          const idCheck = await client.query(`SELECT "id" FROM ${table} WHERE "email" = $1`, [email]);
          if (idCheck.rows[0]?.id === id) inserted++; else updated++;
        }
        console.log(`OK: ${email}`);
      } catch (err) {
        console.error(`Erro em ${email}:`, err.message);
        throw err;
      }
    }
    await client.query('COMMIT');
    console.log(`Concluído. Inseridos: ${inserted}, Atualizados: ${updated}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Falha ao importar usuários:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Erro não tratado:', err);
  process.exit(1);
});