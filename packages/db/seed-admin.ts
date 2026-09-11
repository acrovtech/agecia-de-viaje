import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Iniciando creación y sincronización de roles y usuarios administrativos...');

  // 1. Rol SUPERADMIN (Root / Propietario de Plataforma - Acceso Total + Visor de Logs de Auditoría)
  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@agenciadeviajes.com').trim().toLowerCase();
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'SuperAdminSecure2026*!';
  const superAdminName = process.env.SUPERADMIN_NAME || process.env.ADMIN_NAME || 'Super Administrador';
  const superAdminPasswordHash = await bcrypt.hash(superAdminPassword, 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      name: superAdminName,
      password: superAdminPasswordHash,
      role: Role.SUPERADMIN,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      name: superAdminName,
      email: superAdminEmail,
      password: superAdminPasswordHash,
      role: Role.SUPERADMIN,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    }
  });

  // 2. Rol MASTER (Administrador de la Agencia - Gestión General, Usuarios, Finanzas y Transporte)
  const masterEmail = (process.env.MASTER_EMAIL || 'master@agenciadeviajes.com').trim().toLowerCase();
  const masterPassword = process.env.MASTER_PASSWORD || 'MasterSecure2026*!';
  const masterName = process.env.MASTER_NAME || 'Master Admin';
  const masterPasswordHash = await bcrypt.hash(masterPassword, 10);

  const masterUser = await prisma.user.upsert({
    where: { email: masterEmail },
    update: {
      name: masterName,
      password: masterPasswordHash,
      role: Role.MASTER,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      name: masterName,
      email: masterEmail,
      password: masterPasswordHash,
      role: Role.MASTER,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    }
  });

  // 3. Rol OPERATOR (Gestión de Reservas, Pasajeros, Asignación de Vehículos y Estados de Pago)
  const operatorEmail = (process.env.OPERATOR_EMAIL || 'operaciones@agenciadeviajes.com').trim().toLowerCase();
  const operatorPassword = process.env.OPERATOR_PASSWORD || 'OperatorSecure2026*!';
  const operatorName = process.env.OPERATOR_NAME || 'Operador Reservas';
  const operatorPasswordHash = await bcrypt.hash(operatorPassword, 10);

  const operatorUser = await prisma.user.upsert({
    where: { email: operatorEmail },
    update: {
      name: operatorName,
      password: operatorPasswordHash,
      role: Role.OPERATOR,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      name: operatorName,
      email: operatorEmail,
      password: operatorPasswordHash,
      role: Role.OPERATOR,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    }
  });

  // 4. Rol CONTENT_CREATOR (Edición de Tours, Itinerarios, Precios, Blogs y Megamenús)
  const contentEmail = (process.env.CLIENT_EMAIL || 'gestion@agenciadeviajes.com').trim().toLowerCase();
  const contentPassword = process.env.CLIENT_PASSWORD || 'Gestion2026*';
  const contentPasswordHash = await bcrypt.hash(contentPassword, 10);

  const contentUser = await prisma.user.upsert({
    where: { email: contentEmail },
    update: {
      name: 'Gestión de Contenidos',
      password: contentPasswordHash,
      role: Role.CONTENT_CREATOR,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      name: 'Gestión de Contenidos',
      email: contentEmail,
      password: contentPasswordHash,
      role: Role.CONTENT_CREATOR,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    }
  });

  // 5. Rol MARKETING (Campañas, Base de Contactos, Email Marketing y Fidelización)
  const marketingEmail = (process.env.MARKETING_EMAIL || 'marketing@agenciadeviajes.com').trim().toLowerCase();
  const marketingPassword = process.env.MARKETING_PASSWORD || 'Marketing2026*!';
  const marketingPasswordHash = await bcrypt.hash(marketingPassword, 10);

  const marketingUser = await prisma.user.upsert({
    where: { email: marketingEmail },
    update: {
      name: 'Equipo de Marketing',
      password: marketingPasswordHash,
      role: Role.MARKETING,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      name: 'Equipo de Marketing',
      email: marketingEmail,
      password: marketingPasswordHash,
      role: Role.MARKETING,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    }
  });

  console.log('===============================================================');
  console.log('✅ ROLES Y USUARIOS ADMINISTRATIVOS LISTOS EN EL SISTEMA:');
  console.log('===============================================================');
  console.log('1. [SUPERADMIN] - Control Total + Visor de Logs de Auditoría (Nuestro Usuario)');
  console.log(`   👤 Nombre:     ${superAdminUser.name}`);
  console.log(`   📧 Correo:     ${superAdminUser.email}`);
  console.log(`   🔑 Contraseña: ${superAdminPassword}`);
  console.log(`   🛡️  Rol:        ${superAdminUser.role}\n`);
  console.log('2. [MASTER] - Administrador General de Agencia');
  console.log(`   👤 Nombre:     ${masterUser.name}`);
  console.log(`   📧 Correo:     ${masterUser.email}`);
  console.log(`   🔑 Contraseña: ${masterPassword}`);
  console.log(`   🛡️  Rol:        ${masterUser.role}\n`);
  console.log('3. [OPERATOR] - Reservas, Pagos, Hoteles y Manifiesto de Pasajeros');
  console.log(`   👤 Nombre:     ${operatorUser.name}`);
  console.log(`   📧 Correo:     ${operatorUser.email}`);
  console.log(`   🔑 Contraseña: ${operatorPassword}`);
  console.log(`   🛡️  Rol:        ${operatorUser.role}\n`);
  console.log('4. [CONTENT_CREATOR] - Edición de Tours, Precios, Blogs y Megamenú');
  console.log(`   👤 Nombre:     ${contentUser.name}`);
  console.log(`   📧 Correo:     ${contentUser.email}`);
  console.log(`   🔑 Contraseña: ${contentPassword}`);
  console.log(`   🛡️  Rol:        ${contentUser.role}\n`);
  console.log('5. [MARKETING] - Email Marketing, Base de Contactos y Fidelización');
  console.log(`   👤 Nombre:     ${marketingUser.name}`);
  console.log(`   📧 Correo:     ${marketingUser.email}`);
  console.log(`   🔑 Contraseña: ${marketingPassword}`);
  console.log(`   🛡️  Rol:        ${marketingUser.role}`);
  console.log('===============================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error creando usuarios:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
