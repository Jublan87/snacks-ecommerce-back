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
  // 3. PRODUCTOS (28 productos del catálogo)
  // ============================================
  console.log('🛍️  Creando productos del catálogo...');

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

  // Producto 8: Kit Kat 4 Fingers
  await prisma.product.upsert({
    where: { sku: 'KIT-4FI-45' },
    update: {},
    create: {
      name: 'Kit Kat 4 Fingers 45g',
      slug: 'kit-kat-4-fingers-45g',
      description:
        'Kit Kat clásico con 4 barritas de galleta cubiertas de chocolate. El descanso perfecto.',
      shortDescription: 'Barritas de galleta con chocolate',
      sku: 'KIT-4FI-45',
      price: 750.0,
      stock: 80,
      categoryId: catChocolates.id,
      isActive: true,
      isFeatured: false,
      tags: ['chocolate', 'popular'],
      weight: 45,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/8B0000/FFFFFF/png?text=Kit+Kat',
            alt: 'Kit Kat 4 Fingers 45g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 9: Snickers
  await prisma.product.upsert({
    where: { sku: 'SNI-50G' },
    update: {},
    create: {
      name: 'Snickers 50g',
      slug: 'snickers-50g',
      description: 'Snickers con maní, caramelo y chocolate. La barra que realmente te satisface.',
      shortDescription: 'Barra con maní y caramelo',
      sku: 'SNI-50G',
      price: 850.0,
      stock: 65,
      categoryId: catChocolates.id,
      isActive: true,
      isFeatured: true,
      tags: ['chocolate', 'maní', 'popular'],
      weight: 50,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/4A4A4A/FFFFFF/png?text=Snickers',
            alt: 'Snickers 50g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 10: Pepsi
  await prisma.product.upsert({
    where: { sku: 'PEP-500' },
    update: {},
    create: {
      name: 'Pepsi 500ml',
      slug: 'pepsi-500ml',
      description: 'Pepsi refrescante en botella de 500ml. El sabor único que refresca tu día.',
      shortDescription: 'Refresco sabor cola',
      sku: 'PEP-500',
      price: 600.0,
      stock: 100,
      categoryId: catBebidas.id,
      isActive: true,
      isFeatured: false,
      tags: ['bebida'],
      weight: 500,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/004B93/FFFFFF/png?text=Pepsi',
            alt: 'Pepsi 500ml',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 11: Fanta Naranja
  await prisma.product.upsert({
    where: { sku: 'FAN-NAR-500' },
    update: {},
    create: {
      name: 'Fanta Naranja 500ml',
      slug: 'fanta-naranja-500ml',
      description: 'Fanta sabor naranja en botella de 500ml. Refrescante y con burbujas.',
      shortDescription: 'Refresco sabor naranja',
      sku: 'FAN-NAR-500',
      price: 600.0,
      stock: 90,
      categoryId: catBebidas.id,
      isActive: true,
      isFeatured: false,
      tags: ['bebida', 'naranja'],
      weight: 500,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/FF6600/FFFFFF/png?text=Fanta',
            alt: 'Fanta Naranja 500ml',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 12: Twix
  await prisma.product.upsert({
    where: { sku: 'TWI-50G' },
    update: {},
    create: {
      name: 'Twix 50g',
      slug: 'twix-50g',
      description:
        'Twix con galleta crujiente, caramelo suave y chocolate. Dos barritas en un paquete.',
      shortDescription: 'Barritas de galleta con caramelo',
      sku: 'TWI-50G',
      price: 800.0,
      stock: 55,
      categoryId: catChocolates.id,
      isActive: true,
      isFeatured: false,
      tags: ['chocolate', 'caramelo'],
      weight: 50,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/FFA500/000000/png?text=Twix',
            alt: 'Twix 50g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 13: Lays Barbacoa
  await prisma.product.upsert({
    where: { sku: 'LAY-BAR-180' },
    update: {},
    create: {
      name: 'Lays Barbacoa 180g',
      slug: 'lays-barbacoa-180g',
      description: 'Papas Lays con sabor a barbacoa. El sabor ahumado que todos aman.',
      shortDescription: 'Papas sabor barbacoa',
      sku: 'LAY-BAR-180',
      price: 1150.0,
      stock: 45,
      categoryId: catPapasFritas.id,
      isActive: true,
      isFeatured: false,
      tags: ['barbacoa'],
      weight: 180,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/8B4513/FFFFFF/png?text=Lays+Barbacoa',
            alt: 'Lays Barbacoa 180g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 14: M&M's Chocolate
  await prisma.product.upsert({
    where: { sku: 'MMS-CHO-45' },
    update: {},
    create: {
      name: "M&M's Chocolate 45g",
      slug: 'mms-chocolate-45g',
      description:
        "M&M's con chocolate con leche recubierto de azúcar de colores. Derrite en tu boca, no en tu mano.",
      shortDescription: 'Chocolates de colores',
      sku: 'MMS-CHO-45',
      price: 900.0,
      discountPrice: 720.0,
      discountPercentage: 20,
      stock: 70,
      categoryId: catChocolates.id,
      isActive: true,
      isFeatured: true,
      tags: ['oferta', 'chocolate', 'popular'],
      weight: 45,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/FF0000/FFFFFF/png?text=M%26M',
            alt: "M&M's Chocolate 45g",
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 15: Doritos Cool Ranch
  await prisma.product.upsert({
    where: { sku: 'DOR-RAN-150' },
    update: {},
    create: {
      name: 'Doritos Cool Ranch 150g',
      slug: 'doritos-cool-ranch-150g',
      description:
        'Doritos sabor Cool Ranch. Triángulos de maíz con un sabor cremoso y especiado único.',
      shortDescription: 'Sabor cremoso y especiado',
      sku: 'DOR-RAN-150',
      price: 1250.0,
      stock: 38,
      categoryId: catNachos.id,
      isActive: true,
      isFeatured: false,
      tags: ['ranch'],
      weight: 150,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/00CED1/000000/png?text=Doritos+Ranch',
            alt: 'Doritos Cool Ranch 150g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 16: Sprite
  await prisma.product.upsert({
    where: { sku: 'SPR-500' },
    update: {},
    create: {
      name: 'Sprite 500ml',
      slug: 'sprite-500ml',
      description: 'Sprite refrescante con sabor a lima-limón. Sin cafeína, solo refrescante.',
      shortDescription: 'Refresco lima-limón',
      sku: 'SPR-500',
      price: 600.0,
      stock: 85,
      categoryId: catBebidas.id,
      isActive: true,
      isFeatured: false,
      tags: ['bebida', 'lima-limón'],
      weight: 500,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/00FF00/000000/png?text=Sprite',
            alt: 'Sprite 500ml',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 17: Milka Chocolate con Leche
  await prisma.product.upsert({
    where: { sku: 'MIL-LEH-100' },
    update: {},
    create: {
      name: 'Milka Chocolate con Leche 100g',
      slug: 'milka-chocolate-leche-100g',
      description: 'Chocolate Milka con leche suiza. Suave, cremoso y delicioso.',
      shortDescription: 'Chocolate suizo con leche',
      sku: 'MIL-LEH-100',
      price: 1100.0,
      stock: 42,
      categoryId: catChocolates.id,
      isActive: true,
      isFeatured: false,
      tags: ['chocolate', 'premium'],
      weight: 100,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/7B1FA2/FFFFFF/png?text=Milka',
            alt: 'Milka Chocolate con Leche 100g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 18: Pringles Sour Cream
  await prisma.product.upsert({
    where: { sku: 'PRI-SCR-124' },
    update: {},
    create: {
      name: 'Pringles Sour Cream 124g',
      slug: 'pringles-sour-cream-124g',
      description: 'Pringles sabor crema agria en su icónico tubo. Un sabor único y delicioso.',
      shortDescription: 'Papas en tubo sabor crema agria',
      sku: 'PRI-SCR-124',
      price: 1450.0,
      stock: 30,
      categoryId: catPapasFritas.id,
      isActive: true,
      isFeatured: false,
      tags: ['sour-cream'],
      weight: 124,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/FFD700/000000/png?text=Pringles+SC',
            alt: 'Pringles Sour Cream 124g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 19: Chicles Trident Sabor Menta
  await prisma.product.upsert({
    where: { sku: 'TRI-MEN-14' },
    update: {},
    create: {
      name: 'Chicles Trident Sabor Menta 14g',
      slug: 'chicles-trident-menta-14g',
      description: 'Chicles Trident sin azúcar con sabor a menta. Refrescante y duradero.',
      shortDescription: 'Chicles sin azúcar sabor menta',
      sku: 'TRI-MEN-14',
      price: 450.0,
      stock: 95,
      categoryId: catGolosinas.id,
      isActive: true,
      isFeatured: false,
      tags: ['chicles', 'sin-azúcar'],
      weight: 14,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/00FF7F/000000/png?text=Trident',
            alt: 'Chicles Trident Sabor Menta 14g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 20: Agua Mineral Sin Gas
  await prisma.product.upsert({
    where: { sku: 'AGU-MIN-500' },
    update: {},
    create: {
      name: 'Agua Mineral Sin Gas 500ml',
      slug: 'agua-mineral-sin-gas-500ml',
      description: 'Agua mineral natural sin gas. Hidratación pura y refrescante.',
      shortDescription: 'Agua mineral natural',
      sku: 'AGU-MIN-500',
      price: 350.0,
      stock: 150,
      categoryId: catBebidas.id,
      isActive: true,
      isFeatured: false,
      tags: ['agua', 'sin-gas'],
      weight: 500,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/87CEEB/000000/png?text=Agua',
            alt: 'Agua Mineral Sin Gas 500ml',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 21: Ruffles Crema y Cebolla
  await prisma.product.upsert({
    where: { sku: 'RUF-CRE-150' },
    update: {},
    create: {
      name: 'Ruffles Crema y Cebolla 150g',
      slug: 'ruffles-crema-cebolla-150g',
      description: 'Papas Ruffles con sabor a crema y cebolla. Onduladas y deliciosas.',
      shortDescription: 'Papas onduladas crema y cebolla',
      sku: 'RUF-CRE-150',
      price: 1200.0,
      stock: 48,
      categoryId: catPapasFritas.id,
      isActive: true,
      isFeatured: false,
      tags: ['crema-cebolla'],
      weight: 150,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/FFE4B5/000000/png?text=Ruffles+CC',
            alt: 'Ruffles Crema y Cebolla 150g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 22: Mars
  await prisma.product.upsert({
    where: { sku: 'MAR-50G' },
    update: {},
    create: {
      name: 'Mars 50g',
      slug: 'mars-50g',
      description: 'Mars con chocolate, caramelo y nougat. La barra que te da energía.',
      shortDescription: 'Barra con chocolate y caramelo',
      sku: 'MAR-50G',
      price: 850.0,
      stock: 58,
      categoryId: catChocolates.id,
      isActive: true,
      isFeatured: false,
      tags: ['chocolate', 'energía'],
      weight: 50,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/8B4513/FFFFFF/png?text=Mars',
            alt: 'Mars 50g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 23: Tostitos Original
  await prisma.product.upsert({
    where: { sku: 'TOS-ORI-150' },
    update: {},
    create: {
      name: 'Tostitos Original 150g',
      slug: 'tostitos-original-150g',
      description: 'Tostitos chips de maíz originales. Perfectos para compartir con salsa.',
      shortDescription: 'Chips de maíz originales',
      sku: 'TOS-ORI-150',
      price: 1100.0,
      stock: 52,
      categoryId: catNachos.id,
      isActive: true,
      isFeatured: false,
      tags: ['original'],
      weight: 150,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/FFD700/000000/png?text=Tostitos',
            alt: 'Tostitos Original 150g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 24: 7UP
  await prisma.product.upsert({
    where: { sku: 'SEV-500' },
    update: {},
    create: {
      name: '7UP 500ml',
      slug: '7up-500ml',
      description: '7UP refrescante con sabor a lima-limón. Sin cafeína, solo refrescante.',
      shortDescription: 'Refresco lima-limón',
      sku: 'SEV-500',
      price: 600.0,
      stock: 75,
      categoryId: catBebidas.id,
      isActive: true,
      isFeatured: false,
      tags: ['bebida', 'lima-limón'],
      weight: 500,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/00FF00/000000/png?text=7UP',
            alt: '7UP 500ml',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 25: Hershey's Chocolate con Almendras
  await prisma.product.upsert({
    where: { sku: 'HER-ALM-43' },
    update: {},
    create: {
      name: "Hershey's Chocolate con Almendras 43g",
      slug: 'hersheys-chocolate-almendras-43g',
      description: "Chocolate Hershey's con almendras enteras. Delicioso y crujiente.",
      shortDescription: 'Chocolate con almendras',
      sku: 'HER-ALM-43',
      price: 950.0,
      stock: 62,
      categoryId: catChocolates.id,
      isActive: true,
      isFeatured: false,
      tags: ['chocolate', 'almendras'],
      weight: 43,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/4B0082/FFFFFF/png?text=Hershey',
            alt: "Hershey's Chocolate con Almendras 43g",
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 26: Lays Limón
  await prisma.product.upsert({
    where: { sku: 'LAY-LIM-180' },
    update: {},
    create: {
      name: 'Lays Limón 180g',
      slug: 'lays-limon-180g',
      description: 'Papas Lays con sabor a limón. Frescas y ácidas, perfectas para el verano.',
      shortDescription: 'Papas sabor limón',
      sku: 'LAY-LIM-180',
      price: 1150.0,
      stock: 43,
      categoryId: catPapasFritas.id,
      isActive: true,
      isFeatured: false,
      tags: ['limón', 'ácido'],
      weight: 180,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/FFFF00/000000/png?text=Lays+Limon',
            alt: 'Lays Limón 180g',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 27: Monster Energy
  await prisma.product.upsert({
    where: { sku: 'MON-500' },
    update: {},
    create: {
      name: 'Monster Energy 500ml',
      slug: 'monster-energy-500ml',
      description: 'Monster Energy con taurina y cafeína. La bebida energética que necesitas.',
      shortDescription: 'Bebida energética',
      sku: 'MON-500',
      price: 1200.0,
      stock: 25,
      categoryId: catBebidas.id,
      isActive: true,
      isFeatured: false,
      tags: ['energética', 'cafeína'],
      weight: 500,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/00FF00/000000/png?text=Monster',
            alt: 'Monster Energy 500ml',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Producto 28: Ferrero Rocher
  await prisma.product.upsert({
    where: { sku: 'FER-ROC-3' },
    update: {},
    create: {
      name: 'Ferrero Rocher 3 unidades',
      slug: 'ferrero-rocher-3-unidades',
      description: 'Ferrero Rocher con avellana y chocolate. El lujo en cada bocado.',
      shortDescription: 'Chocolates premium con avellana',
      sku: 'FER-ROC-3',
      price: 1800.0,
      discountPrice: 1440.0,
      discountPercentage: 20,
      stock: 35,
      categoryId: catChocolates.id,
      isActive: true,
      isFeatured: true,
      tags: ['oferta', 'premium', 'avellana'],
      weight: 45,
      images: {
        create: [
          {
            url: 'https://placehold.co/600x600/8B4513/FFFFFF/png?text=Ferrero',
            alt: 'Ferrero Rocher 3 unidades',
            isPrimary: true,
            order: 1,
          },
        ],
      },
    },
  });

  console.log(`✅ ${28} productos creados`);

  console.log('');
  console.log('🎉 Seed completado exitosamente!');
  console.log('');
  console.log('📊 Resumen:');
  console.log(`   - 1 usuario admin: ${admin.email}`);
  console.log(`   - 6 categorías (3 padres + 3 hijas)`);
  console.log(`   - 28 productos con imágenes`);
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
