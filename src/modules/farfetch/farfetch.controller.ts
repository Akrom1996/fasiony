import { Controller, Get, Query } from '@nestjs/common';
import { FarfetchService } from './farfetch.service';

@Controller('/farfetch')
export class FarfetchController {
  constructor(private readonly farfetchService: FarfetchService) {}
  @Get()
  getItemByUrl(@Query('url') url: string) {
    return this.farfetchService.startItemCrawling(url);
  }
}
