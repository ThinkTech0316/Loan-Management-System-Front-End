import fs from 'node:fs';
import path from 'node:path';

const loadEnvFromPath = (envPath) => {
  if (!fs.existsSync(envPath)) return false;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    if (!process.env[key]) {
      process.env[key] = valueParts.join('=').replace(/^['"]|['"]$/g, '');
    }
  }
  return true;
};

const loadEnvFile = () => {
  // Resolve relative to this file's directory (server/src/) -> server/.env
  const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
  const serverEnvPath = path.resolve(__dirname, '..', '.env');
  if (loadEnvFromPath(serverEnvPath)) return;

  // Fallback: try process.cwd()/.env (project root)
  const cwdEnvPath = path.resolve(process.cwd(), '.env');
  loadEnvFromPath(cwdEnvPath);
};

loadEnvFile();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:user@localhost:5432/loan',
  textlkApiToken: process.env.TEXTLK_API_TOKEN ?? '',
  textlkSenderId: process.env.TEXTLK_SENDER_ID ?? 'TextLKDemo',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
};