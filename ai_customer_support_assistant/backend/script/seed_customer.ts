import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaService();

async function main() {
  console.log('Seeding 10 customers...');

  const customers = [
    {
      name: 'Rahim Uddin',
      email: 'rahim.uddin@example.com.bd',
      phone: '+8801711123456',
    },
    {
      name: 'Karim Hasan',
      email: 'karim.hasan@example.com.bd',
      phone: '+8801811234567',
    },
    {
      name: 'Ayesha Siddiqua',
      email: 'ayesha.siddiqua@example.com.bd',
      phone: '+8801911345678',
    },
    {
      name: 'Tariq Islam',
      email: 'tariq.islam@example.com.bd',
      phone: '+8801511456789',
    },
    {
      name: 'Nusrat Jahan',
      email: 'nusrat.jahan@example.com.bd',
      phone: '+8801611567890',
    },
    {
      name: 'Mehedi Hasan',
      email: 'mehedi.hasan@example.com.bd',
      phone: '+8801722123456',
    },
    {
      name: 'Sadia Akter',
      email: 'sadia.akter@example.com.bd',
      phone: '+8801822234567',
    },
    {
      name: 'Shahadat Hossain',
      email: 'shahadat.hossain@example.com.bd',
      phone: '+8801922345678',
    },
    {
      name: 'Farhana Islam',
      email: 'farhana.islam@example.com.bd',
      phone: '+8801522456789',
    },
    {
      name: 'Ariful Islam',
      email: 'ariful.islam@example.com.bd',
      phone: '+8801622567890',
    },
  ];

  for (const customer of customers) {
    await prisma.customer.create({
      data: customer,
    });
  }

  console.log('Successfully seeded 10 customers.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
