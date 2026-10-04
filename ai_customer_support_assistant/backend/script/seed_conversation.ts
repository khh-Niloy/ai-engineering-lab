import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaService();

function generateMessages(topic: string) {
  const messages: { role: string; content: string }[] = [];
  for (let i = 0; i < 10; i++) {
    messages.push({ 
      role: 'user', 
      content: `I have a question about my ${topic} (Question ${i + 1}). Could you help me?` 
    });
    messages.push({ 
      role: 'assistant', 
      content: `Of course! I can help you with your ${topic} (Response ${i + 1}). Please provide more details.` 
    });
  }
  return messages;
}

async function main() {
  console.log('Seeding conversations and messages...');
  
  const customers = await prisma.customer.findMany();

  if (customers.length === 0) {
    console.log('Please seed customers first.');
    return;
  }

  const topics = [
    'order status', 'refund request', 'product inquiry', 'shipping delay', 
    'account issue', 'payment problem', 'technical support', 
    'subscription cancellation', 'feedback', 'general inquiry'
  ];

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const topic = topics[i % topics.length];
    
    await prisma.conversation.create({
      data: {
        customer_id: customer.customer_id,
        messages: {
          create: generateMessages(topic)
        }
      }
    });
  }
  
  console.log(`Successfully seeded ${customers.length} conversations with 20 messages each.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
