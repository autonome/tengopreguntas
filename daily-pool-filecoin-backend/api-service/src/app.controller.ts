import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('encrypt')
  getEncryptedAnswer(
    @Query('answer') answer: string,
    @Query('roundId') roundId: number,
    @Query('userAddress') userAddress: string,
  ): Promise<string> {
    return this.appService.getEncryptedAnswer(answer, roundId, userAddress);
  }

  @Get('info')
  getUserInfo(@Query('roundId') roundId: number, @Query('userAddress') userAddress: string) {
    return this.appService.getUserInfo(roundId, userAddress);
  }

  @Get('signature')
  getClaimSignature(@Query('roundId') roundId: number, @Query('userAddress') userAddress: string) {
    return this.appService.getClaimSignature(roundId, userAddress);
  }
}
