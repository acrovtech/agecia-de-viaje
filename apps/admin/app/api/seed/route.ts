import { NextResponse } from 'next/server';
import { prisma, Role } from '@repo/db';
import bcrypt from 'bcryptjs';
import { requireMasterRole } from '@/lib/auth-check';

export async function GET() {
  try {
    await requireMasterRole();

    // 1. Hash passwords
    const masterPasswordHash = await bcrypt.hash('MasterSecure2026*!', 10);
    const operatorPasswordHash = await bcrypt.hash('OperatorSecure2026*!', 10);
    const contentPasswordHash = await bcrypt.hash('Gestion2026*', 10);

    // 2. Insert MASTER user if not exists
    let masterUser = await prisma.user.findUnique({ where: { email: 'admin@agenciadeviajes.com' } });
    if (!masterUser) {
      masterUser = await prisma.user.create({
        data: {
          name: 'Master Admin',
          email: 'admin@agenciadeviajes.com',
          password: masterPasswordHash,
          role: Role.MASTER,
          isActive: true,
        }
      });
    }

    // 3. Insert OPERATOR user if not exists
    let operatorUser = await prisma.user.findUnique({ where: { email: 'operaciones@agenciadeviajes.com' } });
    if (!operatorUser) {
      operatorUser = await prisma.user.create({
        data: {
          name: 'Operaciones Agencia',
          email: 'operaciones@agenciadeviajes.com',
          password: operatorPasswordHash,
          role: Role.OPERATOR,
          isActive: true,
        }
      });
    }

    // 4. Insert CONTENT_CREATOR user if not exists
    let contentUser = await prisma.user.findUnique({ where: { email: 'gestion@agenciadeviajes.com' } });
    if (!contentUser) {
      contentUser = await prisma.user.create({
        data: {
          name: 'Gestión de Contenidos',
          email: 'gestion@agenciadeviajes.com',
          password: contentPasswordHash,
          role: Role.CONTENT_CREATOR,
          isActive: true,
        }
      });
    }

    // 5. Insert MARKETING user if not exists
    let marketingUser = await prisma.user.findUnique({ where: { email: 'marketing@agenciadeviajes.com' } });
    if (!marketingUser) {
      marketingUser = await prisma.user.create({
        data: {
          name: 'Equipo de Marketing',
          email: 'marketing@agenciadeviajes.com',
          password: await bcrypt.hash('Marketing2026*!', 10),
          role: Role.MARKETING,
          isActive: true,
        }
      });
    }

    return NextResponse.json({
      message: 'Usuarios y roles administrativos inicializados exitosamente.',
      users: [
        { email: masterUser.email, role: masterUser.role },
        { email: operatorUser.email, role: operatorUser.role },
        { email: contentUser.email, role: contentUser.role },
        { email: marketingUser.email, role: marketingUser.role }
      ]
    });
  } catch (error: any) {
    const isUnauthorized = error?.message?.includes('No autorizado');
    const isForbidden = error?.message?.includes('Permisos insuficientes');
    const statusCode = isUnauthorized ? 401 : isForbidden ? 403 : 500;

    if (!isUnauthorized && !isForbidden) {
      console.error('Error seeding users:', error);
    }

    return NextResponse.json(
      { error: error.message || 'Ocurrió un error al crear los usuarios' },
      { status: statusCode }
    );
  }
}
