import { prisma, DiscountType } from './src';

async function seedCupones() {
  console.log('🌱 Sembrando cupones de prueba en la base de datos...');

  const cupones = [
    {
      code: 'CUMPLE10',
      description: 'Campaña de fidelización por cumpleaños - 10% de descuento',
      discountType: 'PERCENTAGE' as const,
      discountValue: 10,
      minSpend: 50,
      maxDiscount: 100,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 días
      usageLimit: 100,
      timesUsed: 4,
      isActive: true,
      createdBy: 'marketing@agenciadeviajes.com',
    },
    {
      code: 'HUMANTAY20',
      description: 'Venta Cruzada Humantay para clientes de Machu Picchu - $20 USD de descuento',
      discountType: 'FIXED' as const,
      discountValue: 20,
      minSpend: 80,
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      usageLimit: 50,
      timesUsed: 2,
      isActive: true,
      createdBy: 'marketing@agenciadeviajes.com',
    },
    {
      code: 'BIENVENIDO15',
      description: 'Cupón general de bienvenida ecommerce - 15% de descuento',
      discountType: 'PERCENTAGE' as const,
      discountValue: 15,
      minSpend: 100,
      maxDiscount: 150,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      usageLimit: 200,
      timesUsed: 8,
      isActive: true,
      createdBy: 'admin@agenciadeviajes.com',
    },
    {
      code: 'VIPCUSCO50',
      description: 'Descuento especial para clientes frecuentes de alta gama - $50 USD fijos',
      discountType: 'FIXED' as const,
      discountValue: 50,
      minSpend: 250,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 20,
      timesUsed: 1,
      isActive: true,
      createdBy: 'admin@agenciadeviajes.com',
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

  console.log('✅ Cupones sembrados con éxito.');
}

seedCupones()
  .catch((e) => {
    console.error('Error al sembrar cupones:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
