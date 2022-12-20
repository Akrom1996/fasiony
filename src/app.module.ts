import { Module } from '@nestjs/common';
import { FarfetchModule } from './modules/farfetch/farfetch.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ModesModule } from './modules/modes/modes.module';
import { FasionyModule } from './modules/fasiony/fasiony.module';

@Module({
  imports: [
    FarfetchModule,
    ModesModule,
    FasionyModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
