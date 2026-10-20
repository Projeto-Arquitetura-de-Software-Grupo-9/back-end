import https from 'https';

const ColumnTypeEnum = {
  Int32: 0,
  Int64: 1,
  Float: 2,
  Double: 3,
  Numeric: 4,
  Boolean: 5,
  Character: 6,
  Text: 7,
  Date: 8,
  Time: 9,
  DateTime: 10,
  Json: 11,
  Enum: 12,
  Bytes: 13,
  Set: 14,
  Uuid: 15,
} as const;

interface SqlQuery {
  sql: string;
  args: Array<unknown>;
  argTypes?: Array<{ scalarType?: string; arity?: string } | string>;
}

interface TiDBColumnType {
  name: string;
  type: string;
  nullable: boolean;
}

interface TiDBHttpResponse {
  types?: TiDBColumnType[];
  rows?: Array<Array<string | null>>;
  rowsAffected?: number;
  lastInsertId?: number | string | null;
  code?: number;
  message?: string;
}

export interface TiDBHttpConfig {
  host: string;
  user: string;
  password: string;
  database: string;
}

const httpsAgent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: false,
});

function escapeSqlString(val: string): string {
  let out = "'";
  for (let i = 0; i < val.length; i++) {
    const ch = val[i];
    switch (ch) {
      case '\0':
        out += '\\0';
        break;
      case '\b':
        out += '\\b';
        break;
      case '\t':
        out += '\\t';
        break;
      case '\n':
        out += '\\n';
        break;
      case '\r':
        out += '\\r';
        break;
      case '\x1a':
        out += '\\Z';
        break;
      case "'":
        out += "\\'";
        break;
      case '"':
        out += '\\"';
        break;
      case '\\':
        out += '\\\\';
        break;
      default:
        out += ch;
    }
  }
  out += "'";
  return out;
}

function formatSqlValue(val: unknown, argType?: { scalarType?: string } | string): string {
  if (val === null || val === undefined) {
    return 'NULL';
  }
  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : 'NULL';
  }
  if (typeof val === 'bigint') {
    return val.toString();
  }
  if (val instanceof Date) {
    return escapeSqlString(val.toISOString().slice(0, 23).replace('T', ' '));
  }
  if (Buffer.isBuffer(val)) {
    return `X'${val.toString('hex')}'`;
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (obj.prisma__type === 'date' && typeof obj.prisma__value === 'string') {
      return escapeSqlString(obj.prisma__value.slice(0, 23).replace('T', ' '));
    }
    if (obj.prisma__type === 'bigint' || obj.prisma__type === 'decimal') {
      return String(obj.prisma__value);
    }
    if (obj.prisma__type === 'bytes' && typeof obj.prisma__value === 'string') {
      return `X'${Buffer.from(obj.prisma__value, 'base64').toString('hex')}'`;
    }
    return escapeSqlString(JSON.stringify(val));
  }
  if (typeof val === 'string') {
    const scalar = typeof argType === 'string' ? argType : argType?.scalarType;
    if (
      (scalar === 'datetime' || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(val)) &&
      !Number.isNaN(Date.parse(val))
    ) {
      const iso = new Date(val).toISOString();
      return escapeSqlString(iso.slice(0, 23).replace('T', ' '));
    }
    return escapeSqlString(val);
  }
  return escapeSqlString(String(val));
}

function interpolateSql(query: SqlQuery): string {
  const { sql, args, argTypes } = query;
  if (!args || args.length === 0) {
    return sql;
  }

  let result = '';
  let argIdx = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === '\\' && (inSingle || inDouble)) {
      result += ch + (sql[i + 1] || '');
      i++;
      continue;
    }
    if (ch === "'" && !inDouble && !inBacktick) {
      inSingle = !inSingle;
      result += ch;
      continue;
    }
    if (ch === '"' && !inSingle && !inBacktick) {
      inDouble = !inDouble;
      result += ch;
      continue;
    }
    if (ch === '`' && !inSingle && !inDouble) {
      inBacktick = !inBacktick;
      result += ch;
      continue;
    }
    if (ch === '?' && !inSingle && !inDouble && !inBacktick && argIdx < args.length) {
      result += formatSqlValue(args[argIdx], argTypes?.[argIdx]);
      argIdx++;
    } else {
      result += ch;
    }
  }

  return result;
}

function mapTiDBColumnType(tidbType: string): number {
  const t = tidbType.toUpperCase();
  if (t.includes('TINYINT') || t.includes('SMALLINT') || t.includes('MEDIUMINT') || t === 'INT' || t === 'INTEGER' || t.startsWith('INT(')) {
    return ColumnTypeEnum.Int32;
  }
  if (t.includes('BIGINT')) {
    return ColumnTypeEnum.Int64;
  }
  if (t.includes('FLOAT')) {
    return ColumnTypeEnum.Float;
  }
  if (t.includes('DOUBLE') || t.includes('REAL')) {
    return ColumnTypeEnum.Double;
  }
  if (t.includes('DECIMAL') || t.includes('NUMERIC')) {
    return ColumnTypeEnum.Numeric;
  }
  if (t === 'BIT' || t === 'BOOL' || t === 'BOOLEAN') {
    return ColumnTypeEnum.Boolean;
  }
  if (t === 'CHAR') {
    return ColumnTypeEnum.Character;
  }
  if (t === 'DATE' || t === 'NEWDATE') {
    return ColumnTypeEnum.Date;
  }
  if (t === 'TIME') {
    return ColumnTypeEnum.Time;
  }
  if (t === 'DATETIME' || t === 'TIMESTAMP') {
    return ColumnTypeEnum.DateTime;
  }
  if (t === 'JSON') {
    return ColumnTypeEnum.Json;
  }
  if (t === 'ENUM') {
    return ColumnTypeEnum.Enum;
  }
  if (t === 'SET') {
    return ColumnTypeEnum.Set;
  }
  if (t.includes('BLOB') || t.includes('BINARY')) {
    return ColumnTypeEnum.Bytes;
  }
  return ColumnTypeEnum.Text;
}

function coerceCellValue(val: string | null, colType: number): unknown {
  if (val === null || val === undefined) {
    return null;
  }
  switch (colType) {
    case ColumnTypeEnum.Int32:
    case ColumnTypeEnum.Int64:
      return Number(val);
    case ColumnTypeEnum.Float:
    case ColumnTypeEnum.Double:
      return Number(val);
    case ColumnTypeEnum.Boolean:
      return val === '1' || val === 'true';
    default:
      return val;
  }
}

function executeHttpSql(
  config: TiDBHttpConfig,
  sql: string,
  session?: string
): Promise<{ data: TiDBHttpResponse; session?: string }> {
  const httpHost = config.host.startsWith('http-') ? config.host : `http-${config.host}`;
  const auth = Buffer.from(`${config.user}:${config.password}`).toString('base64');
  const body = JSON.stringify({ query: sql });

  const headers: Record<string, string | number> = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    Authorization: `Basic ${auth}`,
    'TiDB-Database': config.database,
  };

  if (session) {
    headers['TiDB-Session'] = session;
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: httpHost,
        port: 443,
        path: '/v1beta/sql',
        method: 'POST',
        headers,
        agent: httpsAgent,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let parsed: TiDBHttpResponse;
          try {
            parsed = raw ? JSON.parse(raw) : {};
          } catch {
            return reject(new Error(`Invalid JSON from TiDB HTTP gateway (HTTP ${res.statusCode}): ${raw}`));
          }

          if (res.statusCode && res.statusCode >= 400) {
            return reject(
              new Error(parsed.message || `TiDB HTTP error ${res.statusCode}: ${raw}`)
            );
          }

          const newSession = res.headers['tidb-session'];
          resolve({
            data: parsed,
            session: Array.isArray(newSession) ? newSession[0] : newSession,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}

class TiDBHttpQueryable {
  public readonly provider = 'mysql' as const;
  public readonly adapterName = '@tidbcloud/prisma-adapter';

  constructor(
    protected readonly config: TiDBHttpConfig,
    protected session?: string
  ) {}

  async queryRaw(query: SqlQuery) {
    const formattedSql = interpolateSql(query);
    const { data, session } = await executeHttpSql(this.config, formattedSql, this.session);
    if (this.session && session) {
      this.session = session;
    }

    const types = data.types || [];
    const columnNames = types.map((t) => t.name);
    const columnTypes = types.map((t) => mapTiDBColumnType(t.type));
    const rawRows = data.rows || [];
    const rows = rawRows.map((row) =>
      row.map((cell, idx) => coerceCellValue(cell, columnTypes[idx]))
    );

    return {
      columnNames,
      columnTypes,
      rows,
      lastInsertId: data.lastInsertId != null ? String(data.lastInsertId) : undefined,
    };
  }

  async executeRaw(query: SqlQuery): Promise<number> {
    const formattedSql = interpolateSql(query);
    const { data, session } = await executeHttpSql(this.config, formattedSql, this.session);
    if (this.session && session) {
      this.session = session;
    }
    return data.rowsAffected ?? 0;
  }
}

class TiDBHttpTransaction extends TiDBHttpQueryable {
  readonly options = { usePhantomQuery: true };

  constructor(config: TiDBHttpConfig, session?: string) {
    super(config, session);
  }

  async commit(): Promise<void> {
    if (this.session) {
      await executeHttpSql(this.config, 'COMMIT', this.session);
      this.session = undefined;
    }
  }

  async rollback(): Promise<void> {
    if (this.session) {
      await executeHttpSql(this.config, 'ROLLBACK', this.session);
      this.session = undefined;
    }
  }
}

class TiDBHttpAdapter extends TiDBHttpQueryable {
  async executeScript(script: string): Promise<void> {
    const statements = script
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await executeHttpSql(this.config, stmt);
    }
  }

  async startTransaction(): Promise<TiDBHttpTransaction> {
    const { session } = await executeHttpSql(this.config, 'BEGIN');
    return new TiDBHttpTransaction(this.config, session);
  }

  async dispose(): Promise<void> {
    // Stateless HTTPS connections require no explicit teardown
  }
}

export class PrismaTiDBHttpAdapterFactory {
  public readonly provider = 'mysql' as const;
  public readonly adapterName = '@tidbcloud/prisma-adapter';

  constructor(private readonly config: TiDBHttpConfig) {}

  async connect(): Promise<TiDBHttpAdapter> {
    return new TiDBHttpAdapter(this.config);
  }
}
