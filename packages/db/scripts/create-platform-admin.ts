import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const email = (getArgValue(args, '--email') || process.env.PLATFORM_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = getArgValue(args, '--password') || process.env.PLATFORM_ADMIN_PASSWORD || '';
  const displayName = getArgValue(args, '--name') || process.env.PLATFORM_ADMIN_NAME || 'Platform Administrator';
  const role = getArgValue(args, '--role') || 'SUPERADMIN';

  if (!email || !password) {
    console.error('❌ Error: Se requieren correo y contraseña para crear el administrador de plataforma.');
    console.error('Uso:');
    console.error('  pnpm platform-admin:create --email admin@example.com --password "TuClaveSegura" [--name "Nombre"]');
    console.error('O defina las variables de entorno:');
    console.error('  PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_PASSWORD, PLATFORM_ADMIN_NAME');
    process.exit(1);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    console.error('❌ Error: El correo electrónico proporcionado no es válido.');
    process.exit(1);
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    console.error('❌ Error: La contraseña supera el límite máximo de 72 bytes.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  const existing = await prisma.platformAdmin.findUnique({
    where: { email },
  });

  if (existing) {
    console.error(`⚠️ Ya existe un PlatformAdmin registrado con el correo: ${email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.platformAdmin.create({
    data: {
      email,
      password: passwordHash,
      displayName,
      role,
      isActive: true,
      failedLoginAttempts: 0,
      tokenVersion: 1,
    },
  });

  // Asegurar singleton de configuración de plataforma
  await prisma.platformSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      productName: 'Acrov SaaS',
      brandingRewardEnabled: true,
      brandingRewardCredits: 10,
    },
  });

  console.log(`✅ PlatformAdmin creado exitosamente:`);
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Nombre: ${admin.displayName}`);
  console.log(`   Rol: ${admin.role}`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el bootstrap de PlatformAdmin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
