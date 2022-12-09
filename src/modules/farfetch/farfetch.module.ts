import { Module } from '@nestjs/common';
import { FarfetchController } from './farfetch.controller';
import { FarfetchService } from './farfetch.service';

@Module({
  imports: [],
  controllers: [FarfetchController],
  providers: [FarfetchService],
})
export class FarfetchModule {}
