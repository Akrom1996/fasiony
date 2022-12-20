import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ItemModel } from '../dto/item.model.dto';
import { FasionyService } from './fasiony.service';

@Controller('/fasiony')
export class FasionyController {
  constructor(private readonly fasionyService: FasionyService) {}
  @Post('/create-url')
  createNewUrl(@Query('url') url: string, @Query('name') name: string) {
    return this.fasionyService.createWebsiteToCrawl(url, name);
  }
  @Get('/get-all-items')
  getStoredData() {
    return this.fasionyService.getAllItemsFormDB();
  }
  @Post('/save-db-demo')
  storeData(@Body() body: ItemModel[]) {
    return this.fasionyService.storeItemInfo(body);
  }
}
