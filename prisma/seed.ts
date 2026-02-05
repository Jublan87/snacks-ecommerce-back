import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // ============================================
  // 1. USUARIO ADMIN
  // ============================================
  console.log('👤 Creando usuario admin...');

  const adminPassword = await bcrypt.hash('Admin-123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@snacks.com' },
    update: {},
    create: {
      email: 'admin@snacks.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'admin',
    },
  });

  console.log(`✅ Usuario admin creado: ${admin.email}`);

  // ============================================
  // 2. CATEGORÍAS
  // ============================================
  console.log('📂 Creando categorías...');

  // Categoría padre: Snacks Salados
  const catSalados = await prisma.category.upsert({
    where: { slug: 'snacks-salados' },
    update: {},
    create: {
      name: 'Snacks Salados',
      slug: 'snacks-salados',
      description: 'Papas fritas, nachos y más',
      order: 1,
      isActive: true,
    },
  });

  // Subcategorías de Snacks Salados
  const catPapasFritas = await prisma.category.upsert({
    where: { slug: 'papas-fritas' },
    update: {},
    create: {
      name: 'Papas Fritas',
      slug: 'papas-fritas',
      parentId: catSalados.id,
      order: 1,
      isActive: true,
    },
  });

  const catNachos = await prisma.category.upsert({
    where: { slug: 'nachos' },
    update: {},
    create: {
      name: 'Nachos',
      slug: 'nachos',
      parentId: catSalados.id,
      order: 2,
      isActive: true,
    },
  });

  // Categoría padre: Golosinas
  const catGolosinas = await prisma.category.upsert({
    where: { slug: 'golosinas' },
    update: {},
    create: {
      name: 'Golosinas',
      slug: 'golosinas',
      description: 'Chocolates, caramelos y más',
      order: 2,
      isActive: true,
    },
  });

  // Subcategoría de Golosinas
  const catChocolates = await prisma.category.upsert({
    where: { slug: 'chocolates' },
    update: {},
    create: {
      name: 'Chocolates',
      slug: 'chocolates',
      parentId: catGolosinas.id,
      order: 1,
      isActive: true,
    },
  });

  // Categoría padre: Bebidas
  const catBebidas = await prisma.category.upsert({
    where: { slug: 'bebidas' },
    update: {},
    create: {
      name: 'Bebidas',
      slug: 'bebidas',
      description: 'Gaseosas, aguas y más',
      order: 3,
      isActive: true,
    },
  });

  console.log(`✅ ${6} categorías creadas`);

  // ============================================
  // 3. PRODUCTOS DE EJEMPLO
  // ============================================
  console.log('🛍️  Creando productos de ejemplo...');

  // Producto 1: Doritos Nacho Cheese
  await prisma.product.upsert({
    where: { sku: 'DOR-NAC-150' },
    update: {},
    create: {
      name: 'Doritos Nacho Cheese 150g',
      slug: 'doritos-nacho-cheese-150g',
      description:
        'Los clásicos Doritos sabor queso nacho. Triángulos de maíz horneados con un sabor intenso y auténtico. Perfectos para compartir o disfrutar solo.',
      shortDescription: 'Sabor intenso a queso nacho',
      sku: 'DOR-NAC-150',
      price: 1250.0,
      discountPrice: 999.0,
      discountPercentage: 20,
      stock: 45,
      categoryId: catNachos.id,
      isActive: true,
      isFeatured: true,
      tags: ['oferta', 'popular', 'vegano'],
      weight: 150,
      dimensions: {
        width: 18,
        height: 25,
        depth: 5,
      },
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/FF6B35/FFFFFF/png?text=Doritos',
            alt: 'Doritos Nacho Cheese 150g vista frontal',
            isPrimary: true,
            order: 1,
          },
          {
            url: 'https://placehold.co/600x600/FF6B35/FFFFFF/png?text=Doritos+Back',
            alt: 'Doritos Nacho Cheese 150g vista trasera',
            isPrimary: false,
            order: 2,
          },
        ],
      },
    },
  });

  // Producto 2: Lays Classic
  await prisma.product.upsert({
    where: { sku: 'LAY-CLA-180' },
    update: {},
    create: {
      name: 'Lays Classic 180g',
      slug: 'lays-classic-180g',
      description:
        'Las papas fritas Lays Classic. Cortadas finas y fritas a la perfección con sal. Sabor tradicional que todos aman.',
      shortDescription: 'El sabor clásico de siempre',
      sku: 'LAY-CLA-180',
      price: 1150.0,
      stock: 60,
      categoryId: catPapasFritas.id,
      isActive: true,
      isFeatured: true,
      tags: ['popular', 'clasico'],
      weight: 180,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/FFD93D/000000/png?text=Lays',
            alt: 'Lays Classic 180g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 3: Oreo Original (sin stock para testing)
  await prisma.product.upsert({
    where: { sku: 'ORE-ORI-118' },
    update: {},
    create: {
      name: 'Oreo Original 118g',
      slug: 'oreo-original-118g',
      description:
        'Las famosas galletas Oreo. Dos galletas de chocolate con un delicioso relleno de crema. Un clásico que nunca pasa de moda.',
      shortDescription: 'Galletas con relleno de crema',
      sku: 'ORE-ORI-118',
      price: 850.0,
      discountPrice: 680.0,
      discountPercentage: 20,
      stock: 0,
      categoryId: catChocolates.id,
      isActive: true,
      isFeatured: false,
      tags: ['oferta', 'sin-stock'],
      weight: 118,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/003366/FFFFFF/png?text=Oreo',
            alt: 'Oreo Original 118g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 4: Coca Cola
  await prisma.product.upsert({
    where: { sku: 'COC-COL-500' },
    update: {},
    create: {
      name: 'Coca Cola 500ml',
      slug: 'coca-cola-500ml',
      description:
        'Coca-Cola refrescante en botella de 500ml. El sabor original que refresca tu día.',
      shortDescription: 'Refresco sabor original',
      sku: 'COC-COL-500',
      price: 650.0,
      stock: 120,
      categoryId: catBebidas.id,
      isActive: true,
      isFeatured: true,
      tags: ['bebida', 'popular'],
      weight: 500,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/E61610/FFFFFF/png?text=Coca-Cola',
            alt: 'Coca Cola 500ml',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 5: Pringles Original
  await prisma.product.upsert({
    where: { sku: 'PRI-ORI-124' },
    update: {},
    create: {
      name: 'Pringles Original 124g',
      slug: 'pringles-original-124g',
      description:
        'Pringles sabor original en su icónico tubo. Papas perfectamente apiladas con un sabor único.',
      shortDescription: 'Papas en tubo sabor original',
      sku: 'PRI-ORI-124',
      price: 1450.0,
      stock: 35,
      categoryId: catPapasFritas.id,
      isActive: true,
      isFeatured: false,
      tags: ['premium'],
      weight: 124,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/C50022/FFFFFF/png?text=Pringles',
            alt: 'Pringles Original 124g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 6: Ruffles Queso
  await prisma.product.upsert({
    where: { sku: 'RUF-QUE-150' },
    update: {},
    create: {
      name: 'Ruffles Queso 150g',
      slug: 'ruffles-queso-150g',
      description:
        'Papas Ruffles con sabor a queso. Onduladas y crujientes, perfectas para compartir.',
      shortDescription: 'Papas onduladas sabor queso',
      sku: 'RUF-QUE-150',
      price: 1200.0,
      stock: 50,
      categoryId: catPapasFritas.id,
      isActive: true,
      isFeatured: false,
      tags: ['popular'],
      weight: 150,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/FFA500/000000/png?text=Ruffles',
            alt: 'Ruffles Queso 150g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 7: Cheetos Puffs
  await prisma.product.upsert({
    where: { sku: 'CHE-PUF-85' },
    update: {},
    create: {
      name: 'Cheetos Puffs 85g',
      slug: 'cheetos-puffs-85g',
      description:
        'Cheetos Puffs inflados con sabor a queso. Ligeros y crujientes, ideales para picar.',
      shortDescription: 'Snack inflado sabor queso',
      sku: 'CHE-PUF-85',
      price: 950.0,
      discountPrice: 750.0,
      discountPercentage: 21,
      stock: 40,
      categoryId: catNachos.id,
      isActive: true,
      isFeatured: false,
      tags: ['oferta'],
      weight: 85,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/FF6B00/FFFFFF/png?text=Cheetos',
            alt: 'Cheetos Puffs 85g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  console.log(`✅ ${7} productos de ejemplo creados`);

  console.log('');
  console.log('🎉 Seed completado exitosamente!');
  console.log('');
  console.log('📊 Resumen:');
  console.log(`   - 1 usuario admin: ${admin.email}`);
  console.log(`   - 6 categorías (3 padres + 3 hijas)`);
  console.log(`   - 7 productos con imágenes`);
  console.log('');
  console.log('🔐 Credenciales del admin:');
  console.log(`   Email: admin@snacks.com`);
  console.log(`   Password: Admin-123`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error al ejecutar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
