import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ItemModel } from './dto/farfetch.service.dto';
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
  @Post('/save-db-demo')
  storeData(@Body() body: ItemModel[]) {
    return this.farfetchService.storeItemInfoInDB(body);
  }
  @Get('/get-all-items')
  getStoredData() {
    return this.farfetchService.getAllItemsFormDB();
  }
}
