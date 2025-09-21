import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateTrialRequestDto } from './dto/create-trial-request.dto';
import { TrialRequestsService } from './trial-requests.service';

@Controller('trial-requests')
export class TrialRequestsController {
  constructor(private readonly svc: TrialRequestsService) {}

  @Post()
  async create(@Body() dto: CreateTrialRequestDto) {
    return this.svc.accept(dto);
  }

  @Get('status')
  status() {
    return this.svc.status();
  }
}
