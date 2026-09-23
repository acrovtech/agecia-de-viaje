import { parseArgs } from 'node:util';
import { PrismaClient, AgencyMemberRole } from '@prisma/client';

// Operator-only provisioning. No automatic inference from legacy global roles.
const { values } = parseArgs({ options: {
  email: { type: 'string' }, agency: { type: 'string' }, role: { type: 'string' },
} });
if (!values.email || !values.agency || !Object.values(AgencyMemberRole).includes(values.role)) {
  console.error('Uso: pnpm --filter @repo/db membership:grant --email usuario@example.com --agency slug --role VIEWER');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('Defina DATABASE_URL explícitamente para la base de destino.');
  process.exit(1);
}
const prisma = new PrismaClient();
try {
  const user = await prisma.user.findUnique({ where: { email: values.email.trim().toLowerCase() }, select: { id: true, isActive: true } });
  const agency = await prisma.agency.findUnique({ where: { slug: values.agency }, select: { id: true, isActive: true } });
  if (!user?.isActive || !agency?.isActive) throw new Error('missing_or_inactive');
  const membership = await prisma.$transaction(async (tx) => {
    const assigned = await tx.agencyMembership.upsert({
    where: { agencyId_userId: { agencyId: agency.id, userId: user.id } },
    create: { agencyId: agency.id, userId: user.id, role: values.role },
    update: { role: values.role, isActive: true },
    select: { id: true, agencyId: true, role: true },
    });
    await tx.apiSession.updateMany({
      where: { membershipId: assigned.id, revokedAt: null }, data: { revokedAt: new Date() },
    });
    return assigned;
  });
  console.log(JSON.stringify(membership));
} catch {
  console.error('No se pudo asignar la membresía. Verifique usuario/agencia activos, migraciones y conexión.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
