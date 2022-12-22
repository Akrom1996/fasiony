import { Injectable, Logger } from '@nestjs/common';
import { Items, PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer-extra';
import { args, isDocker, userAgent } from 'src/config/service-config';
import { ItemModel } from '../dto/item.model.dto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pluginStealth = require('puppeteer-extra-plugin-stealth');
import { Cron, CronExpression } from '@nestjs/schedule';
import { storeItemInfoInDB } from '../db/store.db';

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
    const data = await this.startItemCrawlingFarfetch(page, url).catch((err) =>
      Promise.reject(err),
    );
    await browser.close();
    // const result = await storeItemInfoInDB([data], this.client);
    // console.log(result);
    return data;
  }
  async startItemCrawlingFarfetch(page, url: string): Promise<any> {
    const highlightList = [];
    const list = [];
    let price;
    return new Promise(async (resolve, reject) => {
      this.log.log('Starting startItemCrawlingFarfetch');
      try {
        await page.goto(url);
        const nameSelector =
          '#content > div > div.ltr-wckt8b > div.ltr-1rujwwh > div > div > div.ltr-1q071fb > div.ltr-ayy0e9 > div > h1';
        await page.waitForSelector(nameSelector + ' > a'); // wait for loading brand name
        const brandName = await this.getSelectorText(
          page,
          nameSelector + ' > a',
        ); // get brand name
        this.log.log(brandName);
        const itemName = await this.getSelectorText(
          page,
          nameSelector + ' > p',
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
          item: itemName.toUpperCase(),
          brand: brandName.toUpperCase(),
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
    const farfetchUrls = urls.filter((url) =>
      url.url.indexOf('www.farfetch.com'),
    );
    this.log.log(`Number of items to crawl ${farfetchUrls.length}`);
    if (!farfetchUrls.length) {
      return 'No farfetchUrls saved in DB';
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
    for (let urlCounter = 0; urlCounter < farfetchUrls.length; urlCounter++) {
      this.log.log(`Starting farfetch with ${farfetchUrls[urlCounter].url}`);
      const data = await this.startItemCrawlingFarfetch(
        page,
        farfetchUrls[urlCounter].url,
      ).catch((err) => Promise.reject(err));
      results.push(data);
    }
    await browser.close();
    // TODO: store item info into DB
    // console.log('results', results);
    const result = await storeItemInfoInDB(results, this.client);
    return result;
  }
}
