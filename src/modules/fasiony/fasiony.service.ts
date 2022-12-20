import { Injectable, Logger } from '@nestjs/common';
import { Items, PrismaClient } from '@prisma/client';
import { ItemModel } from '../dto/item.model.dto';
import { storeItemInfoInDB } from '../db/store.db';

@Injectable()
export class FasionyService {
  private log: Logger;
  private client: PrismaClient;
  constructor() {
    this.log = new Logger();
    this.client = new PrismaClient();
  }
  async getAllItemsFormDB(): Promise<Items[]> {
    const data = await this.client.items.findMany({
      include: {
        variance: {
          include: {
            websites: {
              include: {
                websites: true,
              },
            },
          },
        },
        prices: {
          include: {
            website: true,
          },
        },
      },
    });
    return data;
  }

  async createWebsiteToCrawl(url: string, name: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.websiteUrls
        .create({
          data: {
            url: url,
            name: name,
          },
        })
        .then((data) => resolve(data))
        .catch((err) => reject(err));
    });
  }

  async storeItemInfo(body: ItemModel[]): Promise<any> {
    return await storeItemInfoInDB(body, this.client);
  }
}
