import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@incabound.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin2026*';

  console.log(`🔐 Creando/actualizando usuario administrador: ${email}`);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'MASTER'
    },
    create: {
      email,
      password: hashedPassword,
      role: 'MASTER'
    }
  });

  console.log('✅ Usuario Administrador listo:');
  console.log(`   📧 Correo:     ${user.email}`);
  console.log(`   🔑 Contraseña: ${password}`);
  console.log(`   🛡️  Rol:        ${user.role}`);
}

main()
  .catch((e) => {
    console.error('❌ Error creando admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
