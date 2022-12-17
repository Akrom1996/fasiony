import { Module } from '@nestjs/common';
import { FarfetchModule } from './modules/farfetch/farfetch.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [FarfetchModule, ScheduleModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule {}
