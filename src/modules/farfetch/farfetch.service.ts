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
    const nameExists = await page
      .$eval(
        '#content > div > div.ltr-wckt8b > div.ltr-1rujwwh > div > div > div.ltr-1q071fb > div.ltr-ayy0e9 > div > h1 > a',
        () => true,
      )
      .catch(() => false);
    const itemName = await this.getSelectorText(
      page,
      `#content > div > div.ltr-wckt8b > div.ltr-1rujwwh > div > div > div.ltr-1q071fb > div.ltr-ayy0e9 > div > h1 > a`,
    );
    this.log.log(itemName);
    const price = await page.evaluate(
      (el) => el.textContent,
      //
      await page.$(
        '#content > div > div.ltr-wckt8b > div.ltr-1rujwwh > div > div > div.ltr-1q071fb > div.ltr-10c5n0l.eev02n90 > p.ltr-194u1uv-Heading.e54eo9p0',
      ),
    );
    this.log.log(`price ${price}`);
    const sizeSelector =
      '#content > div > div.ltr-wckt8b > div.ltr-1rujwwh > div > div > div.ltr-1m7d7di > div.ltr-1m7d7di > div';
    const sizeExists = await page
      .$eval(sizeSelector, () => true)
      .catch(() => false);
    this.log.log(`other sizes exist: ${sizeExists}`);
    const list = [];
    if (sizeExists) {
      const box = await (await page.$(sizeSelector)).click();
      await page.waitForTimeout(600);
      const payload = {
        size: await this.getXPathText(page, '//*[@id="20"]/p[1]'),
        sizePrice:
          (await this.getXPathText(page, '//*[@id="20"]/div')) || price,
      };
      list.push(payload);
      console.log(list);
    }
    const firstImageSelector =
      '#content > div > div.ltr-wckt8b > div.ltr-rcjmp3 > div > div:nth-child(1) > button';
    const firstImageExists = await page
      .$eval(firstImageSelector, () => true)
      .catch(() => false);
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
      await page
        .$eval(
          mainDetailsSelector + ' > div > div.ltr-4y8w0i-Body.e1s5vycj0 > p',
          () => true,
        )
        .catch(() => false)
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
