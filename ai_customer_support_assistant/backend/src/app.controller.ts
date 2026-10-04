import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AiService } from './ai/ai.service';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  @Get('customers')
  async getCustomers() {
    return this.prisma.customer.findMany();
  }

  @Get('customers/:customerId/conversations')
  async getCustomerConversations(@Param('customerId') customerId: string) {
    return this.prisma.conversation.findMany({
      where: { customer_id: parseInt(customerId, 10) },
      orderBy: { conversation_id: 'desc' },
    });
  }

  @Get('conversations/:conversationId/messages')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
  ) {
    return this.prisma.message.findMany({
      where: { conversation_id: conversationId },
      orderBy: { timestamp: 'asc' },
    });
  }

  @Post('chat')
  async chat(
    @Body()
    body: {
      customerId: string;
      conversationId: string;
      message: { role: string; content: string };
    },
  ) {
    const { customerId, conversationId, message } = body;
    const reply = await this.aiService.chatWithAi(
      customerId,
      conversationId,
      message,
    );
    return reply;
  }
}
