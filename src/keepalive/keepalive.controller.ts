import { Controller, Get } from '@nestjs/common';
import { KeepAliveService } from './keepalive.service';

@Controller('keepalive')
export class KeepAliveController {
  constructor(private readonly keepAliveService: KeepAliveService) {}

  @Get('status')
  getStatus() {
    return this.keepAliveService.getStatus();
  }
}
