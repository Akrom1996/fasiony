import { Controller, Get, Query } from '@nestjs/common';
import { ModesService } from './modes.service';

@Controller('/modes')
export class ModesController {
  constructor(private readonly modesService: ModesService) {}
  @Get()
  getItemByUrl(@Query('url') url: string) {
    return this.modesService.getItemDataByUrl(url);
  }
  @Get('/crawl-from-db')
  crawlItemsFromDB() {
    return this.modesService.getItemsDataFromDB();
  }
}
