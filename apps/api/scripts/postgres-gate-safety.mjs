// Utility for safe PostgreSQL test target parsing and validation.
// Ensures target isolation and prevents accidental execution against production databases.

export function sanitizeDatabaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '[invalid-url]';
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.username) parsed.username = '***';
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    return '[invalid-url]';
  }
}

export function parsePostgresTarget(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
      return null;
    }
    const hostname = parsed.hostname.toLowerCase();
    const port = parsed.port ? parseInt(parsed.port, 10) : 5432;
    // Normalize database name: strip leading/trailing slashes
    const database = parsed.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    const schema = (parsed.searchParams.get('schema') || 'public').toLowerCase();

    return {
      hostname,
      port,
      database,
      schema,
    };
  } catch {
    return null;
  }
}

export function formatTargetSummary(target) {
  if (!target) return '[unknown target]';
  return `${target.hostname}:${target.port}/${target.database} (schema: ${target.schema})`;
}

export function validatePostgresTestTarget(testUrl, prodUrl = process.env.DATABASE_URL) {
  // 1. Mandatory test database URL
  if (!testUrl || typeof testUrl !== 'string' || testUrl.trim() === '') {
    return {
      ok: false,
      reason: 'Missing API_TEST_DATABASE_URL environment variable. A dedicated disposable PostgreSQL test database or schema is required. Never fall back to production DATABASE_URL.',
    };
  }

  const testTarget = parsePostgresTarget(testUrl);
  if (!testTarget) {
    return {
      ok: false,
      reason: 'API_TEST_DATABASE_URL must be a valid PostgreSQL connection URL with protocol postgresql: or postgres:.',
    };
  }

  if (!testTarget.database) {
    return {
      ok: false,
      reason: `API_TEST_DATABASE_URL "${sanitizeDatabaseUrl(testUrl)}" must specify a database name.`,
    };
  }

  // 2. Test Marker Validation:
  // Target MUST have an explicit 'test' marker in either the database name OR the schema parameter.
  // Note: Having "test" only in hostname is NOT sufficient.
  const hasDbTestMarker = testTarget.database.includes('test');
  const hasSchemaTestMarker = testTarget.schema.includes('test');

  if (!hasDbTestMarker && !hasSchemaTestMarker) {
    return {
      ok: false,
      reason: `Target database "${testTarget.database}" and schema "${testTarget.schema}" do not contain an explicit "test" marker. Refusing non-test target.`,
    };
  }

  // 3. Refuse the same production target:
  // If production DATABASE_URL is set, verify test URL does not point to the exact same host + port + db + schema
  if (prodUrl && typeof prodUrl === 'string' && prodUrl.trim() !== '') {
    const prodTarget = parsePostgresTarget(prodUrl);
    if (prodTarget) {
      const isSameHost = testTarget.hostname === prodTarget.hostname;
      const isSamePort = testTarget.port === prodTarget.port;
      const isSameDb = testTarget.database === prodTarget.database;
      const isSameSchema = testTarget.schema === prodTarget.schema;

      if (isSameHost && isSamePort && isSameDb && isSameSchema) {
        return {
          ok: false,
          reason: `API_TEST_DATABASE_URL points to the exact same database and schema as DATABASE_URL (${formatTargetSummary(testTarget)}). Refusing execution for production safety.`,
        };
      }
    }
  }

  return {
    ok: true,
    target: testTarget,
    sanitizedUrl: sanitizeDatabaseUrl(testUrl),
    summary: formatTargetSummary(testTarget),
  };
}

export function isSafeTestDatabaseUrl(testUrl, prodUrl = process.env.DATABASE_URL) {
  const result = validatePostgresTestTarget(testUrl, prodUrl);
  return result.ok;
}
