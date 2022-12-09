import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import { args, isDocker, userAgent } from 'src/config/service-config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pluginStealth = require('puppeteer-extra-plugin-stealth');

@Injectable()
export class FarfetchService {
  private log: Logger;
  constructor() {
    this.log = new Logger();
    puppeteer.use(pluginStealth());
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
  async priceWithSale(page, priceSelector) {
    return {
      originalPrice: await this.getSelectorText(
        page,
        priceSelector + '> div > p.ltr-jp8o8r-Footnote.e9urw9y0',
      ),
      salePrice: await this.getSelectorText(
        page,
        priceSelector + ' > p.ltr-o8ptjq-Heading.ex663c10',
      ), // sale price
      discountPercent: await this.getSelectorText(
        page,
        priceSelector + ' > div > p.es58y7t0.ltr-1oyjj5-Footnote.e1ektl920',
      ), // discount percent
    }
  }
  async startItemCrawling(url: string): Promise<any> {
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
    await page.goto(url);
    await page.waitForSelector(
      '#content > div > div.ltr-wckt8b > div.ltr-1rujwwh > div > div > div.ltr-1q071fb > div.ltr-ayy0e9 > div > h1 > a',
    );
    const itemName = await this.getSelectorText(
      page,
      `#content > div > div.ltr-wckt8b > div.ltr-1rujwwh > div > div > div.ltr-1q071fb > div.ltr-ayy0e9 > div > h1 > a`,
    );
    this.log.log(itemName);
    let price;
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
      price = await this.priceWithSale(page, priceSelector);
    }
    this.log.log(`price ${price}`);
    const sizeSelector =
      '#content > div > div.ltr-wckt8b > div.ltr-1rujwwh > div > div > div.ltr-1m7d7di > div.ltr-1m7d7di > div';
    const sizeExists = await page
      .$eval(sizeSelector, () => true)
      .catch(() => false);
    this.log.log(`other sizes exist: ${sizeExists}`);
    const list = [];
    if (sizeExists) {
      await (await page.$(sizeSelector)).click();
      await page.waitForTimeout(600);
      let i = 1;
      const newSizeDiscountSelector = [];
      let newPriceWithDiscount;
      while (i < 50) {
        const liSelector = `/html/body/div[2]/div[3]/div[2]/div[3]/div/ul/li[${i}]`;
        if (
          await this.getXPathText(page, `${liSelector}/p`)
            .then(() => true)
            .catch(() => false)
        ) {
          if (!(await this.getXPathText(page, `${liSelector}/div`))) {
            newPriceWithDiscount = price;
          } else {
            await this.getXPathText(page, `${liSelector}/div`);
            newSizeDiscountSelector.push(liSelector);
            newPriceWithDiscount = await this.getXPathText(
              page,
              `${liSelector}/div`,
            );
          }
          const payload = {
            size: (await this.getXPathText(page, `${liSelector}/p[1]`)).trim(),
            sizePrice:
              (await this.getXPathText(page, `${liSelector}/div`)) || price, //newPriceWithDiscount,
          };
          list.push(payload);
        }
        i++;
      }
      // for (let i = 0; i < newPriceWithDiscount.length; i++) {
      //   await newSizeDiscountSelector[i].click();
      //   await page.waitForTimeout(5000);
      //   newPriceWithDiscount = await this.priceWithSale(page, priceSelector);
      //   this.log.log(`other discounts ${newPriceWithDiscount}`);
      // }

      // console.log(newSizeDiscountSelector);
    }
    const firstImageSelector =
      '#content > div > div.ltr-wckt8b > div.ltr-rcjmp3 > div > div:nth-child(1) > button';
    const firstImageExists = await this.checkSelectorForExistance(
      page,
      firstImageSelector,
    );
    let imageSrc;
    if (firstImageExists) {
      imageSrc = await page.$$eval(firstImageSelector + '> img', (imgs) =>
        imgs.map((img) => img.getAttribute('src')),
      );
      this.log.log(`image source ${imageSrc}`);
    }
    const mainDetailsSelector = '#tabpanel-0 > div > div.ltr-182wjbq.exjav153';
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
    await browser.close();
    return Promise.resolve({
      url: url,
      item: itemName,
      price: price,
      sizePrice: list,
      imageUrl: imageSrc[0],
      details: details || 'No details provided',
      dateTime: new Date(),
    });
  }
}
