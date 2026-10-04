import { Injectable } from '@nestjs/common';
import { intentConfig } from './intentConfig';
import { IntentType } from './enum';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}
  client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  async chatWithAi(
    customerId: string,
    conversationId: string,
    message: {
      role: string;
      content: string;
    },
  ) {
    // 1. Determine required context
    const { context } = await this.detectContext(message.content);

    await this.prisma.message.create({
      data: {
        conversation_id: conversationId,
        role: 'user',
        content: message.content,
      },
    });

    // 2. Load only that context
    const finalContent = await this.finalContentForAi(
      context,
      customerId,
      conversationId,
    );
    // 3. Build the final prompt/context
    // 4. Call the main LLM
    const reply = await this.aiReply(finalContent, message);

    await this.prisma.message.create({
      data: {
        conversation_id: conversationId,
        role: 'assistant',
        content: reply,
      },
    });

    return {
      role: 'assistant',
      content: reply,
    };
  }

  private async detectContext(message: string): Promise<{
    context: string[];
  }> {
    const text = message.toLowerCase();

    for (const [intent, config] of Object.entries(intentConfig)) {
      if (config.keywords.some((keyword) => text.includes(keyword))) {
        return {
          context: config.context,
        };
      }
    }

    // suppose we didn't find any context
    const backupContext = await this.aiContextBackup(message);

    return backupContext;
  }

  private async aiContextBackup(message: string): Promise<{
    context: string[];
  }> {
    const result = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            intent: {
              type: 'string',
              enum: Object.values(IntentType),
            },
            requiredContext: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['customer', 'orders', 'products', 'refunds'],
              },
            },
          },
          required: ['intent', 'requiredContext'],
        },

        systemInstruction: `
      You are an intent classifier for a customer support system.

      Identify the user's intent and determine what context is required
      to answer the user's request.

      Available intents: ${Object.values(IntentType).join(', ')}

      Available context: customer, orders, products, refunds

      Rules:
      - Return exactly one intent.
      - Include only the context actually required.
      - Do not include unnecessary context.
      - Return valid JSON only.
    `,
      },

      contents: [
        {
          role: 'user',
          parts: [
            {
              text: message,
            },
          ],
        },
      ],
    });
    const responseText = result?.text;
    if (!responseText) {
      throw new Error('No response text from Gemini');
    }

    const jsonResponse = JSON.parse(responseText);
    console.log(jsonResponse);

    return {
      context: jsonResponse.requiredContext,
    };
  }

  private async finalContentForAi(
    context: string[],
    customerId: string,
    conversationId: string,
  ) {
    const finalContent: Record<string, any> = {};

    if (context.includes('customer')) {
      finalContent.customer = await this.prisma.customer.findUnique({
        where: { customer_id: parseInt(customerId, 10) },
      });
    }

    if (context.includes('orders')) {
      finalContent.orders = await this.prisma.order.findMany({
        where: { customer_id: parseInt(customerId, 10) },
        include: {
          orderItems: {
            include: { product: true },
          },
        },
      });
    }

    if (context.includes('products')) {
      finalContent.products = await this.prisma.product.findMany();
    }

    if (context.includes('refunds')) {
      finalContent.refunds = await this.prisma.refund.findMany({
        where: { order: { customer_id: parseInt(customerId, 10) } },
      });
    }

    // load previous conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { conversation_id: conversationId },
      include: { messages: true },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (!conversation.summary) {
      const conversationText = conversation.messages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

      const result = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
              },
            },
            required: ['summary'],
          },
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Summarize this conversation:\n\n${conversationText}`,
              },
            ],
          },
        ],
      });

      const jsonResponse = JSON.parse(result.text || '{}');
      const summary = jsonResponse.summary || '';
      finalContent.conversation = summary;

      //update conversation table
      await this.prisma.conversation.update({
        where: { conversation_id: conversationId },
        data: { summary: summary },
      });

      return finalContent;
    }

    finalContent.conversation = conversation.summary;

    return finalContent;
  }

  private async aiReply(
    finalContent: any,
    message: {
      role: string;
      content: string;
    },
  ) {
    const result = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            reply: {
              type: 'string',
            },
          },
          required: ['reply'],
        },

        systemInstruction: `
      You are an expert customer support AI assistant.
      Based on ${JSON.stringify(finalContent)} (this is your context), answer the user's message: ${message.content}

      Rules:
      - Return valid JSON only.
    `,
      },

      contents: [
        {
          role: 'user',
          parts: [
            {
              text: message.content,
            },
          ],
        },
      ],
    });

    const jsonResponse = JSON.parse(result.text || '{}');
    const reply = jsonResponse.reply || '';
    return reply;
  }
}
