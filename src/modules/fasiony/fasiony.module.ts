import { Module } from '@nestjs/common';
import { FasionyController } from './fasiony.controller';
import { FasionyService } from './fasiony.service';

@Module({
  imports: [],
  controllers: [FasionyController],
  providers: [FasionyService],
})
export class FasionyModule {}
