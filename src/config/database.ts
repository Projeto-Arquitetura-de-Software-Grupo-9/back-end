import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { TiDBHttpConfig } from './tidbHttpAdapter';

dotenv.config();

function parseTiDBConfig(): TiDBHttpConfig | null {
  let host = process.env.DB_HOST || '';
  let user = process.env.DB_USER || '';
  let password = process.env.DB_PASSWORD || '';
  let database = process.env.DB_NAME || '';

  const rawUrl = process.env.DATABASE_URL || '';
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (!host) host = parsed.hostname;
      if (!user) user = decodeURIComponent(parsed.username);
      if (!password) password = decodeURIComponent(parsed.password);
      if (!database) database = parsed.pathname.replace(/^\//, '');
    } catch {
      // Fallback to DB_* env vars
    }
  }

  if (host.includes('tidbcloud.com') && user && password) {
    return {
      host,
      user,
      password,
      database: database || 'sgp_catolica',
    };
  }

  return null;
}

function buildDatabaseUrl(): string {
  const host = process.env.DB_HOST || '';
  const port = process.env.DB_PORT || '4000';
  const user = process.env.DB_USER || '';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'sgp_catolica';

  let url =
    process.env.DATABASE_URL ||
    (host && user
      ? `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}`
      : '');

  if (!url) {
    return '';
  }

  const isTiDB = url.includes('tidbcloud.com') || host.includes('tidbcloud.com');
  if (isTiDB) {
    const certPath = path.resolve(process.cwd(), 'isrgrootx1.pem');
    const certExists = fs.existsSync(certPath);

    // On Vercel / serverless or if local .pem cert is absent, do NOT supply sslcert parameter.
    // Modern Linux runtime environments (like AWS Lambda on Vercel) already include
    // the ISRG Root X1 Let's Encrypt certificate in their trusted system root CA store.
    if (process.env.VERCEL || !certExists) {
      url = url.replace(/([?&])sslcert=[^&]*(&|$)/, '$1').replace(/[?&]$/, '');
      if (!url.includes('sslaccept=')) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}sslaccept=strict`;
      }
    } else if (!url.includes('sslaccept=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}sslcert=./isrgrootx1.pem&sslaccept=strict`;
    }

    if (!url.includes('connect_timeout=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}connect_timeout=20`;
    }
  }

  return url;
}

export const databaseUrl = buildDatabaseUrl();
export const tidbConfig = parseTiDBConfig();
const logLevels: ('warn' | 'error')[] =
  process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ||
  new PrismaClient({
    ...(databaseUrl
      ? {
          datasources: {
            db: {
              url: databaseUrl,
            },
          },
        }
      : {}),
    log: logLevels,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    const host = process.env.DB_HOST || 'configured-database';
    const db = process.env.DB_NAME || 'sgp_catolica';
    console.log(`✅ Connected to database: ${db} (${host})`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to connect to MySQL database:', err.message);
    return false;
  }
}
