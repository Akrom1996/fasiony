import { Module } from '@nestjs/common';
import { ModesController } from './modes.controller';
import { ModesService } from './modes.service';

@Module({
  imports: [],
  controllers: [ModesController],
  providers: [ModesService],
})
export class ModesModule {}
