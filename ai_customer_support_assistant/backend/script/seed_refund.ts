import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaService();

async function main() {
  console.log('Seeding refunds...');
  
  const orders = await prisma.order.findMany();

  if (orders.length === 0) {
    console.log('Please seed orders first.');
    return;
  }

  const refundData = [
    {
      order_id: orders[0].order_id,
      status: 'APPROVED',
      amount: 45.50
    },
    {
      order_id: orders[min(1, orders.length - 1)].order_id,
      status: 'PENDING',
      amount: 120.00
    },
    {
      order_id: orders[min(2, orders.length - 1)].order_id,
      status: 'COMPLETED',
      amount: 25.99
    },
    {
      order_id: orders[min(3, orders.length - 1)].order_id,
      status: 'PROCESSING',
      amount: 89.95
    },
    {
      order_id: orders[min(4, orders.length - 1)].order_id,
      status: 'CANCELLED',
      amount: 15.00
    }
  ];

  for (const refund of refundData) {
    await prisma.refund.create({
      data: {
        order_id: refund.order_id,
        status: refund.status as any,
        amount: refund.amount
      }
    });
  }
  
  console.log(`Successfully seeded ${refundData.length} refunds.`);
}

function min(a: number, b: number) {
  return a < b ? a : b;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
