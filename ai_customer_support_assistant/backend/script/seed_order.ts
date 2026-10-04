import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaService();

async function main() {
  console.log('Seeding orders...');
  
  const customers = await prisma.customer.findMany();
  const products = await prisma.product.findMany();

  if (customers.length === 0 || products.length === 0) {
    console.log('Please seed customers and products first.');
    return;
  }

  const orders = [
    {
      customer: customers[0],
      status: 'PENDING',
      items: [
        { product: products[0], quantity: 2 },
        { product: products[1], quantity: 1 }
      ]
    },
    {
      customer: customers[1],
      status: 'COMPLETED',
      items: [
        { product: products[2], quantity: 1 }
      ]
    },
    {
      customer: customers[2],
      status: 'SHIPPED',
      items: [
        { product: products[3], quantity: 3 },
        { product: products[4], quantity: 2 },
        { product: products[5], quantity: 5 }
      ]
    },
    {
      customer: customers[3],
      status: 'CANCELLED',
      items: [
        { product: products[6], quantity: 1 }
      ]
    }
  ];

  for (const orderData of orders) {
    await prisma.order.create({
      data: {
        customer_id: orderData.customer.customer_id,
        status: orderData.status,
        orderItems: {
          create: orderData.items.map(item => ({
            product_id: item.product.product_id,
            quantity: item.quantity,
            price: item.product.price, // Storing unit price at time of order
          }))
        }
      }
    });
  }
  
  console.log('Successfully seeded orders.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
