/*
Este projeto inclui um script para importar usuários em massa para o Cognito,
 lendo um Excel e confirmando o cadastro sem necessidade de e-mail.

dependencies:
- @aws-sdk/client-cognito-identity-provider
- xlsx
- dotenv

bash:
node scripts/import-cognito-users.js \
  --file ./users.xlsx \
  --sheet "Página1" \
  --password "Ana@1234" \
  --confirm \
  --env .env.production
*/



import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand
} from '@aws-sdk/client-cognito-identity-provider';

function printUsage() {
  console.log(`\nUso: node scripts/import-cognito-users.js --file <arquivo.xlsx> [--sheet <nome>] [--password <senha>] [--confirm] [--env <.env>]

Requer:
- AWS credenciais configuradas (ex.: AWS_PROFILE ou AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)
- Variáveis: COGNITO_USER_POOL_ID e AWS_REGION (ou VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_REGION)

Opções:
- --file        Caminho do Excel (.xlsx ou .csv)
- --sheet       Nome da aba (default: primeira aba)
- --password    Senha a ser definida para o usuário (default: Anaros@2024!)
- --confirm     Confirma o usuário (define senha permanente e suprime e-mail)
- --env         Caminho do arquivo .env (ex.: .env.production)
- --dry         Modo dry-run: não chama a AWS, apenas imprime o que faria\n`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') args.file = argv[++i];
    else if (a === '--sheet') args.sheet = argv[++i];
    else if (a === '--password') args.password = argv[++i];
    else if (a === '--confirm') args.confirm = true;
    else if (a === '--env') args.env = argv[++i];
    else if (a === '--dry') args.dry = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function toDigits(str) {
  return String(str ?? '').replace(/\D+/g, '');
}

function formatBrazilPhone(phone) {
  const digits = toDigits(phone);
  if (!digits) return undefined;
  // Formato E.164: +55 + DDD + número
  return `+55${digits}`;
}

function normalizeEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  return e || undefined;
}

function loadEnv(envPath) {
  if (envPath) {
    const resolved = path.resolve(envPath);
    if (fs.existsSync(resolved)) {
      dotenv.config({ path: resolved });
      console.log(`[env] carregado: ${resolved}`);
    } else {
      console.warn(`[env] arquivo não encontrado: ${resolved}`);
    }
  }
}

async function createOrUpdateUser(client, userPoolId, row, opts) {
  const email = normalizeEmail(row.EMAIL || row.email);
  const tempPassword = opts.password || 'Ana@1234';

  if (!email) {
    console.warn(`[skip] linha sem e-mail válido: ${JSON.stringify(row)}`);
    return { status: 'skipped', reason: 'missing_email' };
  }

  const attributes = [
    { Name: 'email', Value: email },
    { Name: 'email_verified', Value: 'true' }
  ];

  const createCmd = new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: email,
    TemporaryPassword: tempPassword,
    MessageAction: 'SUPPRESS',
    UserAttributes: attributes
  });

  try {
    if (opts.dry) {
      console.log(`[dry] create ${email} attrs=${JSON.stringify(attributes)}`);
    } else {
      await client.send(createCmd);
      console.log(`[create] ${email}`);
    }
  } catch (err) {
    const code = err?.name || err?.Code || err?.code;
    if (code === 'UsernameExistsException') {
      console.log(`[exists] ${email}`);
      // Atualiza atributos básicos
      const updateCmd = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: attributes
      });
      if (!opts.dry) {
        try { await client.send(updateCmd); } catch (e) { console.warn(`[warn] update attrs ${email}: ${e}`); }
      } else {
        console.log(`[dry] update attrs ${email} attrs=${JSON.stringify(attributes)}`);
      }
    } else {
      console.error(`[error] create ${email}:`, err);
      return { status: 'error', error: err };
    }
  }

  if (opts.confirm) {
    const setPwdCmd = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: tempPassword,
      Permanent: true
    });
    if (opts.dry) {
      console.log(`[dry] set permanent password ${email}`);
    } else {
      await client.send(setPwdCmd);
      console.log(`[confirm] ${email}`);
    }
  }

  return { status: 'ok' };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.file) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  loadEnv(args.env);

  const region = process.env.AWS_REGION || process.env.VITE_COGNITO_REGION || 'us-east-1';
  const userPoolId = process.env.COGNITO_USER_POOL_ID || process.env.VITE_COGNITO_USER_POOL_ID;
  if (!userPoolId) {
    console.error('[ERROR] Defina COGNITO_USER_POOL_ID ou VITE_COGNITO_USER_POOL_ID');
    process.exit(1);
  }

  const client = new CognitoIdentityProviderClient({ region });

  const filePath = path.resolve(args.file);
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const workbook = xlsx.readFile(filePath);
  const sheetName = args.sheet || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.error(`[ERROR] Aba não encontrada: ${sheetName}`);
    process.exit(1);
  }

  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`[info] Lidas ${rows.length} linhas da aba '${sheetName}'`);

  let ok = 0, skipped = 0, errors = 0;
  for (const row of rows) {
    const res = await createOrUpdateUser(client, userPoolId, row, {
      password: args.password,
      confirm: !!args.confirm,
      dry: !!args.dry
    });
    if (res.status === 'ok') ok++; else if (res.status === 'skipped') skipped++; else errors++;
  }

  console.log(`[done] ok=${ok} skipped=${skipped} errors=${errors}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});