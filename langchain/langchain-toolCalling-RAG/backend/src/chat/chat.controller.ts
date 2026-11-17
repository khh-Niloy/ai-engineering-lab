import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatQueryDto } from './dto/chat-query.dto';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post(['chat/query', 'documents/search'])
  async query(@Body() body: ChatQueryDto) {
    return this.chatService.handleQuery(body);
  }

  @Get(['chat/qna', 'qna'])
  async getAllQna() {
    return this.chatService.getAllQnas();
  }

  @Get(['chat/qna/:id', 'qna/:id'])
  async getQnaById(@Param('id') id: string) {
    return this.chatService.getQnaById(id);
  }
}
