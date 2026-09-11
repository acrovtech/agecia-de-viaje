import { prisma, DiscountType, MarketingChannel } from './src';

async function seedCupones() {
  console.log('🌱 Sembrando campañas y cupones de marketing con inteligencia de atribución...');

  const cupones = [
    {
      code: 'FDAY20',
      name: 'Campaña Día del Padre 2026',
      channel: MarketingChannel.META_ADS,
      description: 'Pauta principal en Facebook e Instagram para temporada alta de junio',
      discountType: 'PERCENTAGE' as const,
      discountValue: 20,
      minSpend: 100,
      maxDiscount: 200,
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-06-15T23:59:59.000Z'),
      budget: 1500,
      expiresAt: new Date('2026-06-20T23:59:59.000Z'),
      usageLimit: 100,
      timesUsed: 85,
      isActive: true,
      createdBy: 'marketing@incabound.com',
    },
    {
      code: 'LOVE26',
      name: 'Cyber San Valentín',
      channel: MarketingChannel.TIKTOK_ADS,
      description: 'Videos en TikTok para parejas durante temporada baja de febrero',
      discountType: 'PERCENTAGE' as const,
      discountValue: 15,
      minSpend: 80,
      maxDiscount: 100,
      startDate: new Date('2026-02-05T00:00:00.000Z'),
      endDate: new Date('2026-02-14T23:59:59.000Z'),
      budget: 800,
      expiresAt: new Date('2026-02-15T23:59:59.000Z'),
      usageLimit: 50,
      timesUsed: 12,
      isActive: false, // Campaña concluida
      createdBy: 'marketing@incabound.com',
    },
    {
      code: 'INTI26',
      name: 'Inti Raymi Cusco VIP',
      channel: MarketingChannel.GOOGLE_ADS,
      description: 'Campaña Search en Google para turistas buscando entradas y tours a Cusco en junio',
      discountType: 'FIXED' as const,
      discountValue: 50,
      minSpend: 300,
      startDate: new Date('2026-06-10T00:00:00.000Z'),
      endDate: new Date('2026-06-30T23:59:59.000Z'),
      budget: 2000,
      expiresAt: new Date('2026-06-30T23:59:59.000Z'),
      usageLimit: 80,
      timesUsed: 42,
      isActive: true,
      createdBy: 'admin@incabound.com',
    },
    {
      code: 'REEL20',
      name: 'Viral TikTok Laguna Humantay',
      channel: MarketingChannel.ORGANIC_VIDEO,
      description: 'Cupón exclusivo en bio y comentarios de video viral sin pauta pagada',
      discountType: 'FIXED' as const,
      discountValue: 20,
      minSpend: 90,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.000Z'),
      budget: 0,
      expiresAt: new Date('2026-12-31T23:59:59.000Z'),
      usageLimit: 200,
      timesUsed: 38,
      isActive: true,
      createdBy: 'marketing@incabound.com',
    },
    {
      code: 'CUMPLE10',
      name: 'Fidelización por Cumpleaños',
      channel: MarketingChannel.EMAIL_MARKETING,
      description: 'Disparado por Resend API en base de datos de exclientes cada semana',
      discountType: 'PERCENTAGE' as const,
      discountValue: 10,
      minSpend: 50,
      maxDiscount: 100,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.000Z'),
      budget: 50,
      expiresAt: new Date('2026-12-31T23:59:59.000Z'),
      usageLimit: 500,
      timesUsed: 24,
      isActive: true,
      createdBy: 'marketing@incabound.com',
    },
  ];

  for (const c of cupones) {
    const existing = await (prisma as any).coupon.findUnique({
      where: { code: c.code },
    });

    if (existing) {
      await (prisma as any).coupon.update({
        where: { code: c.code },
        data: c,
      });
      console.log(`  ✓ Cupón actualizado: ${c.code} (${c.discountValue}${c.discountType === 'PERCENTAGE' ? '%' : ' USD'})`);
    } else {
      await (prisma as any).coupon.create({
        data: c,
      });
      console.log(`  + Cupón creado: ${c.code} (${c.discountValue}${c.discountType === 'PERCENTAGE' ? '%' : ' USD'})`);
    }
  }

  // Vincular reservas de demostración para métricas financieras reales
  const fdayCoupon = await (prisma as any).coupon.findUnique({ where: { code: 'FDAY20' } });
  if (fdayCoupon) {
    const existingReservations = await (prisma as any).reservation.count({ where: { couponId: fdayCoupon.id } });
    if (existingReservations === 0) {
      await (prisma as any).reservation.createMany({
        data: [
          {
            customerFirstName: 'Carlos',
            customerLastName: 'Mendoza',
            customerEmail: 'cmendoza@example.com',
            customerPhone: '+51984123456',
            date: new Date('2026-06-08T10:00:00.000Z'),
            pax: 4,
            totalPrice: 4200,
            originalPrice: 5250,
            discountAmount: 1050,
            status: 'PAID',
            source: 'ECOMMERCE',
            couponId: fdayCoupon.id,
            marketingCode: 'FDAY20',
          },
          {
            customerFirstName: 'Lucía',
            customerLastName: 'Fernández',
            customerEmail: 'lfernandez@example.com',
            customerPhone: '+51984654321',
            date: new Date('2026-06-11T10:00:00.000Z'),
            pax: 3,
            totalPrice: 3800,
            originalPrice: 4750,
            discountAmount: 950,
            status: 'PAID',
            source: 'ECOMMERCE',
            couponId: fdayCoupon.id,
            marketingCode: 'FDAY20',
          },
          {
            customerFirstName: 'Diego',
            customerLastName: 'Alarcón',
            customerEmail: 'dalarcon@example.com',
            customerPhone: '+51987112233',
            date: new Date('2026-06-14T10:00:00.000Z'),
            pax: 4,
            totalPrice: 4500,
            originalPrice: 5625,
            discountAmount: 1125,
            status: 'PAID',
            source: 'OPERATOR_MANUAL',
            couponId: fdayCoupon.id,
            marketingCode: 'FDAY20',
          },
        ],
      });
      console.log('  ✓ 3 reservas pagadas vinculadas a FDAY20 ($12,500 USD facturados)');
    }
  }

  const intiCoupon = await (prisma as any).coupon.findUnique({ where: { code: 'INTI26' } });
  if (intiCoupon) {
    const existingReservations = await (prisma as any).reservation.count({ where: { couponId: intiCoupon.id } });
    if (existingReservations === 0) {
      await (prisma as any).reservation.createMany({
        data: [
          {
            customerFirstName: 'Michael',
            customerLastName: 'Brown',
            customerEmail: 'mbrown@usatour.com',
            customerPhone: '+14155552671',
            date: new Date('2026-06-22T09:00:00.000Z'),
            pax: 2,
            totalPrice: 3500,
            originalPrice: 3550,
            discountAmount: 50,
            status: 'PAID',
            source: 'ECOMMERCE',
            couponId: intiCoupon.id,
            marketingCode: 'INTI26',
          },
          {
            customerFirstName: 'Sarah',
            customerLastName: 'Jenkins',
            customerEmail: 'sjenkins@gmail.com',
            customerPhone: '+14155559812',
            date: new Date('2026-06-24T09:00:00.000Z'),
            pax: 2,
            totalPrice: 3000,
            originalPrice: 3050,
            discountAmount: 50,
            status: 'PAID',
            source: 'ECOMMERCE',
            couponId: intiCoupon.id,
            marketingCode: 'INTI26',
          },
        ],
      });
      console.log('  ✓ 2 reservas pagadas vinculadas a INTI26 ($6,500 USD facturados)');
    }
  }

  console.log('✅ Cupones y atribución sembrados con éxito.');
}

seedCupones()
  .catch((e) => {
    console.error('Error al sembrar cupones:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
