import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaService();

async function main() {
  console.log('Seeding 10 products...');

  const products = [
    { name: 'Radhuni Mustard Oil (1L)', price: 250.0 },
    { name: 'Ispahani Mirzapore Tea (500g)', price: 220.0 },
    { name: 'Pran Frooto Mango Juice (1L)', price: 70.0 },
    { name: 'Fresh Soyabean Oil (5L)', price: 890.0 },
    { name: 'Chashi Aromatic Chinigura Rice (1kg)', price: 145.0 },
    { name: 'Meril Splash Beauty Soap (100g)', price: 40.0 },
    { name: 'Sunsilk Black Shine Shampoo (180ml)', price: 190.0 },
    { name: 'Bombay Sweets Potato Crackers', price: 15.0 },
    { name: 'Dano Full Cream Milk Powder (500g)', price: 430.0 },
    { name: 'Rupchanda Soyabean Oil (2L)', price: 360.0 },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log('Successfully seeded 10 products.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
