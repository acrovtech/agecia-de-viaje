import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Iniciando creación/actualización de usuarios...');

  // 1. Usuario MASTER (Acceso total)
  const masterEmail = (process.env.ADMIN_EMAIL || 'admin@incabound.com').trim().toLowerCase();
  const masterPassword = process.env.ADMIN_PASSWORD || 'Admin2026*';
  const masterPasswordHash = await bcrypt.hash(masterPassword, 10);

  const masterUser = await prisma.user.upsert({
    where: { email: masterEmail },
    update: {
      password: masterPasswordHash,
      role: 'MASTER'
    },
    create: {
      email: masterEmail,
      password: masterPasswordHash,
      role: 'MASTER'
    }
  });

  // 2. Usuario CLIENT (Gestión para el cliente)
  const clientEmail = (process.env.CLIENT_EMAIL || 'gestion@incabound.com').trim().toLowerCase();
  const clientPassword = process.env.CLIENT_PASSWORD || 'Gestion2026*';
  const clientPasswordHash = await bcrypt.hash(clientPassword, 10);

  const clientUser = await prisma.user.upsert({
    where: { email: clientEmail },
    update: {
      password: clientPasswordHash,
      role: 'CLIENT'
    },
    create: {
      email: clientEmail,
      password: clientPasswordHash,
      role: 'CLIENT'
    }
  });

  console.log('==============================================');
  console.log('✅ USUARIOS CREADOS / ACTUALIZADOS CON ÉXITO:');
  console.log('==============================================');
  console.log('1. Usuario MASTER (Administrador Principal):');
  console.log(`   📧 Correo:     ${masterUser.email}`);
  console.log(`   🔑 Contraseña: ${masterPassword}`);
  console.log(`   🛡️  Rol:        ${masterUser.role}\n`);
  console.log('2. Usuario CLIENT (Gestión de Cliente):');
  console.log(`   📧 Correo:     ${clientUser.email}`);
  console.log(`   🔑 Contraseña: ${clientPassword}`);
  console.log(`   🛡️  Rol:        ${clientUser.role}`);
  console.log('==============================================');
}

main()
  .catch((e) => {
    console.error('❌ Error creando usuarios:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
