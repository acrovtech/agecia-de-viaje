import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // 1. Hash passwords
    const masterPasswordHash = await bcrypt.hash('IncaBound2026!', 10);
    const clientPasswordHash = await bcrypt.hash('IncaBoundClient!', 10);

    // 2. Insert MASTER user if not exists
    let masterUser = await prisma.user.findUnique({ where: { email: 'admin@incabound.com' } });
    if (!masterUser) {
      masterUser = await prisma.user.create({
        data: {
          email: 'admin@incabound.com',
          password: masterPasswordHash,
          role: 'MASTER'
        }
      });
    }

    // 3. Insert CLIENT user if not exists
    let clientUser = await prisma.user.findUnique({ where: { email: 'gestion@incabound.com' } });
    if (!clientUser) {
      clientUser = await prisma.user.create({
        data: {
          email: 'gestion@incabound.com',
          password: clientPasswordHash,
          role: 'CLIENT'
        }
      });
    }

    return NextResponse.json({
      message: 'Usuarios iniciales creados exitosamente.',
      users: [
        { email: masterUser.email, role: masterUser.role },
        { email: clientUser.email, role: clientUser.role }
      ]
    });
  } catch (error: any) {
    console.error('Error seeding users:', error);
    return NextResponse.json({ error: error.message || 'Ocurrió un error al crear los usuarios' }, { status: 500 });
  }
}
