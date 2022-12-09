import { Module } from '@nestjs/common';
import { FarfetchModule } from './modules/farfetch/farfetch.module';

@Module({
  imports: [FarfetchModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
