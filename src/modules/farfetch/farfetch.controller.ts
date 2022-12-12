import { Controller, Get, Post, Query } from '@nestjs/common';
import { FarfetchService } from './farfetch.service';

@Controller('/farfetch')
export class FarfetchController {
  constructor(private readonly farfetchService: FarfetchService) {}
  @Get()
  getItemByUrl(@Query('url') url: string) {
    return this.farfetchService.getItemDataByUrl(url);
  }
  @Post('/create-url')
  createNewUrl(@Query('url') url: string, @Query('name') name: string) {
    return this.farfetchService.createWebsiteToCrawl(url, name);
  }
  @Get('/crawl-from-db')
  crawlItemsFromDB() {
    return this.farfetchService.getItemsDataFromDB();
  }
}
