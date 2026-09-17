import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDefaultAgency() {
  console.log('🏢 [Multi-Tenant] Inicializando agencia predeterminada y perfiles legales...');

  // 1. Crear o sincronizar Agencia Maestra
  const agency = await prisma.agency.upsert({
    where: { slug: 'incabound' },
    update: {
      name: 'Inca Bound Expeditions',
      subdomain: 'incabound',
      phone: '+51 984 000 000',
      email: 'info@incabound.com',
      address: 'Portal de Panes 123, Plaza de Armas, Cusco, Perú',
      isActive: true,
    },
    create: {
      name: 'Inca Bound Expeditions',
      slug: 'incabound',
      subdomain: 'incabound',
      phone: '+51 984 000 000',
      email: 'info@incabound.com',
      address: 'Portal de Panes 123, Plaza de Armas, Cusco, Perú',
      isActive: true,
    },
  });

  console.log(`✅ Agencia configurada: ${agency.name} (ID: ${agency.id})`);

  // 2. Crear o sincronizar CompanySettings de la Agencia
  const existingSettings = await prisma.companySettings.findUnique({
    where: { agencyId: agency.id },
  });

  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        agencyId: agency.id,
        igvEnabled: false,
        igvBps: 1800,
        cardFeeEnabled: false,
        cardFeeBps: 0,
        partialPaymentEnabled: false,
        initialPaymentBps: 5000,
        availabilityEnabled: false,
      },
    });
    console.log('✅ CompanySettings de la agencia inicializadas.');
  }

  // 3. Crear o sincronizar LegalProfile de la Agencia
  const existingLegal = await prisma.legalProfile.findUnique({
    where: { agencyId: agency.id },
  });

  if (!existingLegal) {
    await prisma.legalProfile.create({
      data: {
        agencyId: agency.id,
        data: {
          razonSocial: 'INCA BOUND TRAVEL & EXPEDITIONS S.A.C.',
          ruc: '20601234567',
          nombreComercial: 'Inca Bound',
          domicilioFiscal: 'Portal de Panes 123, Plaza de Armas, Cusco, Cusco, Perú',
          representanteLegal: 'Gerencia General',
          emailNotificaciones: 'legal@incabound.com',
          telefonoAtencion: '+51 984 000 000',
          sitioWeb: 'https://incabound.com',
        },
      },
    });
    console.log('✅ LegalProfile (RUC, Razón Social) de la agencia inicializado.');
  }

  // 4. Asociar registros huérfanos a la agencia predeterminada
  const [toursUpdated, transfersUpdated, usersUpdated, couponsUpdated] = await Promise.all([
    prisma.tour.updateMany({
      where: { agencyId: null },
      data: { agencyId: agency.id },
    }),
    prisma.transfer.updateMany({
      where: { agencyId: null },
      data: { agencyId: agency.id },
    }),
    prisma.user.updateMany({
      where: { agencyId: null, role: { not: 'SUPERADMIN' } },
      data: { agencyId: agency.id },
    }),
    prisma.coupon.updateMany({
      where: { agencyId: null },
      data: { agencyId: agency.id },
    }),
  ]);

  console.log(`🔗 Migración de registros huérfanos a la agencia:`);
  console.log(`   - Tours asociados: ${toursUpdated.count}`);
  console.log(`   - Traslados asociados: ${transfersUpdated.count}`);
  console.log(`   - Usuarios asociados: ${usersUpdated.count}`);
  console.log(`   - Cupones asociados: ${couponsUpdated.count}`);

  return agency;
}

if (require.main === module) {
  seedDefaultAgency()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error('❌ Error inicializando agencia:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
