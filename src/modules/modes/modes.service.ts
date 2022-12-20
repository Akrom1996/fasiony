import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer-extra';
import { args, isDocker, userAgent } from 'src/config/service-config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pluginStealth = require('puppeteer-extra-plugin-stealth');
import { Cron } from '@nestjs/schedule';
import { storeItemInfoInDB } from '../db/store.db';

@Injectable()
export class ModesService {
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
  async startItemCrawlingModes(page, url: string): Promise<any> {
    const highlightList = [];
    const list = [];
    let price;
    let brandName;
    let itemName;
    return new Promise(async (resolve, reject) => {
      this.log.log('Starting startItemCrawlingModes');
      try {
        await page.goto(url);
        await page.waitForSelector(
          '#root > div > main > div.NyQXC > div.PtZTz > div > a',
        ); // wait for loading item name
        brandName = await this.getSelectorText(
          page,
          '#root > div > main > div.NyQXC > div.PtZTz > div > a',
        ); // get brand name
        this.log.log(brandName);
        const priceSelector =
          '#root > div > main > div.NyQXC > div.PtZTz > p._3p-Yz'; // discount or sale
        const saleExists = await this.checkSelectorForExistance(
          page,
          priceSelector + ' > span._1WTWk',
        ); // if discount or sale exists
        if (saleExists) {
          price = await this.getSelectorText(
            page,
            priceSelector + ' > span._677BI', // for original price add this ' > span._1WTWk',
          );
        } else {
          // price = await this.priceWithSale(page, priceSelector); // get price with sales
          price = await this.getSelectorText(page, priceSelector + ' > span');
        }
        this.log.log(`price ${price}`);
        itemName = await this.getSelectorText(
          page,
          '#root > div > main > div.NyQXC > div.PtZTz > p._1CC2G._3XCDb',
        ); // get item name
        this.log.log(`brand name ${itemName}`);
        const sizeSelector =
          '#root > div > main > div.NyQXC > div:nth-child(2) > div > div._2ZHiC '; //'> div:nth-child(5) > ol
        await page.waitForSelector(sizeSelector);
        const sizeExists = await page
          .$eval(sizeSelector + ' > div:nth-child(5) > ol', () => true)
          .catch(() => false); // check for size selector exists
        this.log.log(`other sizes exist: ${sizeExists}`);
        if (sizeExists) {
          //   await (await page.$(sizeSelector)).click();
          //   await page.waitForTimeout(600);
          let i = 1;
          while (i < 10) {
            const liSelector =
              sizeSelector + ` > div:nth-child(5) > ol > li:nth-child(${i})`;
            if (
              await this.getSelectorText(page, `${liSelector} > button`)
                .then(() => true)
                .catch(() => false)
            ) {
              const payload = {
                size: (
                  await this.getSelectorText(page, `${liSelector} > button`)
                ).trim(),
                sizePrice: price,
              };
              list.push(payload);
            }
            i++;
          }
        }
        const firstImageSelector = '#root > div > main > div._37T5Z._2PdLC';
        const firstImageExists = await this.checkSelectorForExistance(
          page,
          firstImageSelector,
        );
        let imageSrc = [];
        if (firstImageExists) {
          imageSrc = await page.$$eval(
            firstImageSelector +
              ' > div._10LDn > div:nth-child(1) > span > img',
            (imgs) => imgs.map((img) => img.getAttribute('src')),
          );
          this.log.log(`image source ${imageSrc}`);
        }
        const mainDetailsSelector = '#description-info-content > div';
        await page.waitForSelector(mainDetailsSelector);
        let details;
        if (
          await this.checkSelectorForExistance(
            page,
            mainDetailsSelector + ' > div',
          )
        )
          // check details
          details = await this.getSelectorText(
            page,
            mainDetailsSelector + ' > div',
          );
        this.log.log(`details ${details}`);
        (await this.getSelectorText(page, '#details-info-content > div > div'))
          .split('-')
          .forEach((element) => {
            if (element.length)
              highlightList.push(element.trim().replace(';', ''));
          });
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
    const data = await this.startItemCrawlingModes(page, url).catch((err) =>
      Promise.reject(err),
    );
    await browser.close();
    return data;
  }

  async getItemsDataFromDB(): Promise<any> {
    const results = [];
    const urls = await this.client.websiteUrls
      .findMany()
      .catch((err) => Promise.reject(err));
    const modesUrls = urls.filter((url) => url.url.indexOf('www.modes.com'));
    this.log.log(`Number of items to crawl ${modesUrls.length}`);
    if (!modesUrls.length) {
      return 'No modesUrls saved in DB';
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
    for (let urlCounter = 0; urlCounter < modesUrls.length; urlCounter++) {
      this.log.log(`Starting modes with ${modesUrls[urlCounter].url}`);
      const data = await this.startItemCrawlingModes(
        page,
        modesUrls[urlCounter].url,
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
