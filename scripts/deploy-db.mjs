import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const migrations = new URL('../packages/db/prisma/migrations/', import.meta.url);
let hasMigrations = false;
try {
  hasMigrations = readdirSync(migrations, { withFileTypes: true }).some((entry) => entry.isDirectory());
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

if (!hasMigrations) {
  console.error('Despliegue de BD bloqueado: falta crear y verificar el baseline de migraciones. No se ejecutaron db push ni seeds. Consulte docs/PLAN-SAAS-Y-TECNOLOGIAS.md.');
  process.exitCode = 1;
} else {
  // Fixed command, no interpolation of credentials or user-supplied arguments.
  const result = spawnSync('pnpm --filter @repo/db exec prisma migrate deploy', {
    cwd: root,
    shell: true,
    stdio: 'inherit',
  });
  process.exitCode = result.status ?? 1;
}
