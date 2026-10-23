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

export function validatePostgresTestTarget(testUrl, prodUrl) {
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
  const effectiveProdUrl = prodUrl !== undefined
    ? prodUrl
    : (process.env.PROD_DATABASE_URL || (process.env.DATABASE_URL !== testUrl ? process.env.DATABASE_URL : undefined));

  if (effectiveProdUrl && typeof effectiveProdUrl === 'string' && effectiveProdUrl.trim() !== '') {
    const prodTarget = parsePostgresTarget(effectiveProdUrl);
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

export function isSafeTestDatabaseUrl(testUrl, prodUrl) {
  const result = validatePostgresTestTarget(testUrl, prodUrl);
  return result.ok;
}

export function isAllowedDatabaseName(dbName) {
  if (!dbName || typeof dbName !== 'string') return false;
  const lower = dbName.toLowerCase();
  // Explicitly forbidden production/system databases
  if (
    lower === 'dbtravel' ||
    lower === 'production' ||
    lower === 'prod' ||
    lower === 'postgres' ||
    lower === 'template1'
  ) {
    return false;
  }
  // Authorized test database conventions (*_test, *_ci, *_integration, *_integration_test, test_*)
  return (
    lower.endsWith('_test') ||
    lower.endsWith('_ci') ||
    lower.endsWith('_integration') ||
    lower.endsWith('_integration_test') ||
    lower.startsWith('test_') ||
    lower.includes('integration_test') ||
    lower.includes('_test_')
  );
}

export function validatePostgresIntegrationGuard(options = {}) {
  const allowOptIn = 'allowOptIn' in options
    ? options.allowOptIn
    : process.env.ALLOW_POSTGRES_INTEGRATION_TESTS;
  const testDatabaseUrl = 'testDatabaseUrl' in options
    ? options.testDatabaseUrl
    : process.env.TEST_DATABASE_URL;
  const prodDatabaseUrl = 'prodDatabaseUrl' in options
    ? options.prodDatabaseUrl
    : (process.env.PROD_DATABASE_URL || (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL ? process.env.DATABASE_URL : undefined));

  // 1. Mandatory opt-in
  if (allowOptIn !== 'true') {
    return {
      ok: false,
      skipped: true,
      reason:
        'ALLOW_POSTGRES_INTEGRATION_TESTS must be explicitly "true" to execute mutating PostgreSQL integration tests.',
    };
  }

  // 2. Mandatory TEST_DATABASE_URL
  if (!testDatabaseUrl || typeof testDatabaseUrl !== 'string' || testDatabaseUrl.trim() === '') {
    return {
      ok: false,
      skipped: true,
      reason:
        'Missing TEST_DATABASE_URL environment variable. Mutating tests will NEVER fall back to DATABASE_URL.',
    };
  }

  // 3. Reject invalid or unsafe database name
  const target = parsePostgresTarget(testDatabaseUrl);
  if (!target || !target.database) {
    return {
      ok: false,
      skipped: false,
      reason: 'TEST_DATABASE_URL is not a valid PostgreSQL connection URL.',
    };
  }

  if (!isAllowedDatabaseName(target.database)) {
    return {
      ok: false,
      skipped: false,
      reason: `UNSAFE_DATABASE_TARGET: Target database "${target.database}" is not an authorized test database (*_test, *_ci, *_integration, *_integration_test). Refusing execution.`,
    };
  }

  // 4. Refuse targeting same production database
  if (prodDatabaseUrl && typeof prodDatabaseUrl === 'string' && prodDatabaseUrl.trim() !== '') {
    const prodTarget = parsePostgresTarget(prodDatabaseUrl);
    if (prodTarget) {
      const isSameHost = target.hostname === prodTarget.hostname;
      const isSamePort = target.port === prodTarget.port;
      const isSameDb = target.database === prodTarget.database;
      const isSameSchema = target.schema === prodTarget.schema;
      if (isSameHost && isSamePort && isSameDb && isSameSchema) {
        return {
          ok: false,
          skipped: false,
          reason: `TEST_DATABASE_URL points to the exact same database and schema as DATABASE_URL ("${target.database}"). Execution refused for safety.`,
        };
      }
    }
  }

  return {
    ok: true,
    skipped: false,
    databaseName: target.database,
    target,
    testDatabaseUrl,
  };
}
