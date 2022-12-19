import { Injectable, Logger } from '@nestjs/common';
import { Items, PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer-extra';
import { args, isDocker, userAgent } from 'src/config/service-config';
import { ItemModel } from './dto/farfetch.service.dto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pluginStealth = require('puppeteer-extra-plugin-stealth');
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class FarfetchService {
  private log: Logger;
  private client: PrismaClient;
  constructor() {
    this.log = new Logger();
    puppeteer.use(pluginStealth());
    this.client = new PrismaClient();
  }
  async getSelectorText(page, selector) {
    return await page.evaluate((el) => el.textContent, await page.$(selector));
  }
  async getXPathText(page, selector) {
    return await page.evaluate(
      (el) => el.textContent,
      (
        await page.$x(selector)
      )[0],
    );
  }
  async checkSelectorForExistance(page, selector) {
    return await page.$eval(selector, () => true).catch(() => false);
  }
  // async priceWithSale(page, priceSelector) {
  //   return {
  //     originalPrice: await this.getSelectorText(
  //       page,
  //       priceSelector + '> div > p.ltr-jp8o8r-Footnote.e9urw9y0',
  //     ),
  //     salePrice: await this.getSelectorText(
  //       page,
  //       priceSelector + ' > p.ltr-o8ptjq-Heading.ex663c10',
  //     ), //sale price
  //     discountPercent: await this.getSelectorText(
  //       page,
  //       priceSelector + ' > div > p.es58y7t0.ltr-1oyjj5-Footnote.e1ektl920',
  //     ), // discount percent
  //   };
  // }

  async getItemDataByUrl(url: string) {
    this.log.log(`Starting farfetch with ${url}`);
    const browser = await puppeteer.launch({
      executablePath: isDocker()
        ? '/usr/bin/chromium-browser'
        : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: isDocker() ? true : false,
      args: args,
    });
    const [page] = await browser.pages();
    await page.setJavaScriptEnabled(true);
    await page.setUserAgent(
      userAgent[Math.floor(Math.random() * userAgent.length)],
    );
    await page.setDefaultNavigationTimeout(50000);
    const data = await this.startItemCrawling(page, url).catch((err) =>
      Promise.reject(err),
    );
    await browser.close();
    const result = await this.storeItemInfoInDB([data]);
    console.log(result);
    return data;
  }
  async startItemCrawling(page, url: string): Promise<any> {
    const highlightList = [];
    const list = [];
    let price;
    return new Promise(async (resolve, reject) => {
      this.log.log('Starting startItemCrawling');
      try {
        await page.goto(url);
        await page.waitForSelector(
          '#content > div > div.ltr-wckt8b > div.ltr-1rujwwh > div > div > div.ltr-1q071fb > div.ltr-ayy0e9 > div > h1 > a',
        ); // wait for loading item name
        const itemName = await this.getSelectorText(
          page,
          `#content > div > div.ltr-wckt8b > div.ltr-1rujwwh > div > div > div.ltr-1q071fb > div.ltr-ayy0e9 > div > h1 > a`,
        ); // get item name
        this.log.log(itemName);
        const priceSelector =
          '#content > div > div.ltr-wckt8b > div.ltr-1rujwwh > div > div > div.ltr-1q071fb > div.ltr-10c5n0l.eev02n90'; // discount or sale
        const saleExists = await this.checkSelectorForExistance(
          page,
          priceSelector + ' > p.ltr-194u1uv-Heading.e54eo9p0',
        ); // if discount or sale exists
        if (saleExists) {
          price = await this.getSelectorText(
            page,
            priceSelector + ' > p.ltr-194u1uv-Heading.e54eo9p0',
          );
        } else {
          // price = await this.priceWithSale(page, priceSelector); // get price with sales
          price = await this.getSelectorText(
            page,
            priceSelector + ' > p.ltr-o8ptjq-Heading.ex663c10',
          );
        }
        this.log.log(`price ${price}`);
        const sizeSelector =
          '#content > div > div.ltr-wckt8b > div.ltr-1rujwwh > div > div > div.ltr-1m7d7di > div.ltr-1m7d7di > div';
        const sizeExists = await page
          .$eval(sizeSelector, () => true)
          .catch(() => false); // check for size selector exists
        this.log.log(`other sizes exist: ${sizeExists}`);
        if (sizeExists) {
          await (await page.$(sizeSelector)).click();
          await page.waitForTimeout(600);
          let i = 1;
          while (i < 50) {
            const liSelector = `/html/body/div[2]/div[3]/div[2]/div[3]/div/ul/li[${i}]`;
            if (
              await this.getXPathText(page, `${liSelector}/p`)
                .then(() => true)
                .catch(() => false)
            ) {
              const payload = {
                size: (
                  await this.getXPathText(page, `${liSelector}/p[1]`)
                ).trim(),
                sizePrice:
                  (await this.getXPathText(page, `${liSelector}/div`)) || price, //newPriceWithDiscount,
              };
              list.push(payload);
            }
            i++;
          }
        }
        const firstImageSelector =
          '#content > div > div.ltr-wckt8b > div.ltr-rcjmp3 > div > div:nth-child(1) > button';
        const firstImageExists = await this.checkSelectorForExistance(
          page,
          firstImageSelector,
        );
        let imageSrc = [];
        if (firstImageExists) {
          imageSrc = await page.$$eval(firstImageSelector + '> img', (imgs) =>
            imgs.map((img) => img.getAttribute('src')),
          );
          this.log.log(`image source ${imageSrc}`);
        }
        const mainDetailsSelector =
          '#tabpanel-0 > div > div.ltr-182wjbq.exjav153';
        await page.waitForSelector(mainDetailsSelector);
        let details;
        if (
          await this.checkSelectorForExistance(
            page,
            mainDetailsSelector + ' > div > div.ltr-4y8w0i-Body.e1s5vycj0 > p',
          )
        )
          details = await this.getSelectorText(
            page,
            mainDetailsSelector + ' > div > div.ltr-4y8w0i-Body.e1s5vycj0 > p',
          );
        this.log.log(`details ${details}`);
        await page
          .waitForSelector(
            '#tabpanel-0 > div > div.ltr-182wjbq.exjav153 > div > div.ltr-fzg9du.e1yiqd0',
          )
          .catch((err) => console.log(err));
        if (
          await this.checkSelectorForExistance(
            page,
            '#tabpanel-0 > div > div.ltr-182wjbq.exjav153 > div > div.ltr-fzg9du.e1yiqd0',
          ) // check highlights
        ) {
          let counter = 1;
          while (counter < 20) {
            const highlightSelector = `#tabpanel-0 > div > div.ltr-182wjbq.exjav153 > div > div.ltr-fzg9du.e1yiqd0 > ul > li:nth-child(${counter})`;
            if (await this.checkSelectorForExistance(page, highlightSelector)) {
              highlightList.push(
                (await this.getSelectorText(page, highlightSelector)).trim(),
              );
            }
            counter++;
          }
        }
        this.log.log(`highlights of item ${highlightList}`);

        resolve({
          url: url,
          item: itemName,
          price: price,
          sizePrice: list,
          imageUrl: imageSrc[0],
          details: details || 'No details provided',
          highlights: highlightList,
          dateTime: new Date(),
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  // @Cron('10 * * * * *')
  async getItemsDataFromDB(): Promise<any> {
    const results = [];
    const urls = await this.client.websiteUrls
      .findMany()
      .catch((err) => Promise.reject(err));
    this.log.log(`Number of items to crawl ${urls.length}`);
    if (!urls.length) {
      return 'No urls saved in DB';
    }
    const browser = await puppeteer.launch({
      executablePath: isDocker()
        ? '/usr/bin/chromium-browser'
        : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: isDocker() ? true : false,
      args: args,
    });
    const [page] = await browser.pages();
    await page.setJavaScriptEnabled(true);
    await page.setUserAgent(
      userAgent[Math.floor(Math.random() * userAgent.length)],
    );
    for (let urlCounter = 0; urlCounter < urls.length; urlCounter++) {
      this.log.log(`Starting farfetch with ${urls[urlCounter].url}`);
      const data = await this.startItemCrawling(
        page,
        urls[urlCounter].url,
      ).catch((err) => Promise.reject(err));
      results.push(data);
    }
    await browser.close();
    // TODO: store item info into DB
    // console.log('results', results);
    const result = await this.storeItemInfoInDB(results);
    return result;
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
            websites: true,
          },
        },
      },
    });
    return data;
  }
  async storeItemInfoInDB(itemBody: ItemModel[]): Promise<any> {
    this.log.log('Starting storeItemInfoInDB');
    console.log(itemBody.length);
    for (let i = 0; i < itemBody.length; i++) {
      const variance = [];
      let price;
      const itemData = await this.client.items.findUnique({
        where: {
          itemName: itemBody[i].item,
        },
        include: {
          variance: true,
        },
      });
      itemBody[i].sizePrice.forEach(async (element) => {
        variance.push({
          varianceName: element.size,
          websites: {
            create: [
              {
                price: element.sizePrice,
                websites: {
                  connectOrCreate: {
                    where: {
                      url: itemBody[i].url,
                    },
                    create: {
                      url: itemBody[i].url,
                    },
                  },
                },
              },
            ],
          },
        });
      }); // creating variance with url n:m connection
      if (itemBody[i].sizePrice.length == 0) {
        price = itemBody[i].price;
      }
      if (!itemData) {
        const data = {
          itemName: itemBody[i].item,
          details: itemBody[i].details,
          imageUrl: itemBody[i].imageUrl,
          highlights: itemBody[i].highlights,
        };
        if (price)
          data['prices'] = {
            create: [
              {
                price: price,
                websites: {
                  connectOrCreate: {
                    where: {
                      url: itemBody[i].url,
                    },
                    create: {
                      url: itemBody[i].url,
                    },
                  },
                },
              },
            ],
          };
        else
          data['variance'] = {
            create: variance,
          };
        await this.client.items.create({
          data: data,
        });
      } else {
        // if variance of Item NOT exists (only one size)
        if (itemBody[i].sizePrice.length == 0) {
          await this.client.items.update({
            where: {
              itemName: itemBody[i].item,
            },
            include: {
              prices: true,
            },
            data: {
              prices: {
                create: {
                  price: itemBody[i].price,
                  websites: {
                    connectOrCreate: {
                      where: { url: itemBody[i].url },
                      create: {
                        url: itemBody[i].url,
                      },
                    },
                  },
                },
              },
            },
          });
        }
        itemBody[i].sizePrice.forEach(async (element) => {
          if (
            itemData.variance.filter(
              (data) => data.varianceName == element.size,
            ).length == 0
          ) {
            // if new vairance NOT exists create new variance
            await this.client.items.update({
              where: {
                itemName: itemBody[i].item,
              },
              include: {
                variance: true,
              },
              data: {
                variance: {
                  connectOrCreate: {
                    where: {
                      varianceName: element.size,
                    },
                    create: {
                      varianceName: element.size,
                      websites: {
                        create: {
                          price: element.sizePrice,
                          websites: {
                            connectOrCreate: {
                              where: { url: itemBody[i].url },
                              create: {
                                url: itemBody[i].url,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            });
          } else {
            // else new variance exists add new price of variance
            await this.client.items.update({
              where: {
                itemName: itemBody[i].item,
              },
              include: {
                variance: true,
              },
              data: {
                variance: {
                  connect: {
                    varianceName: element.size,
                  },
                  update: {
                    where: {
                      varianceName: element.size,
                    },
                    data: {
                      websites: {
                        create: [
                          {
                            price: element.sizePrice,
                            websites: {
                              connect: {
                                url: itemBody[i].url,
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            });
          }
        });
      }
    }
    // await this.client.items.findMany().then((data) => console.log(data));
    return 'success';
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
}
