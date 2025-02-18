import axios from 'axios';
import * as cheerio from 'cheerio';
import * as XLSX from 'xlsx';
import { LotteryData, ScrapedData } from '../types/lottery';
import iconv from 'iconv-lite';
import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isValidNumber = (n: any): boolean => typeof n === 'number' && Number.isFinite(n);

class LotteryScraper {
  private readonly SSQ_URL = process.env.SSQ_URL as string;
  private readonly DLT_URL = process.env.DLT_URL as string;
  private readonly DATA_DIR = 'lottery_data';

  constructor() {
    if (!fs.existsSync(this.DATA_DIR)) {
      fs.mkdirSync(this.DATA_DIR);
    }
  }

  async scrapeSSQ(): Promise<ScrapedData> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const filename = path.join(this.DATA_DIR, `ssq_data_${today}.xlsx`);

      if (fs.existsSync(filename)) {
        // eslint-disable-next-line no-console
        console.log(`SSQ data for today (${today}) already exists. Skipping.`);
        return { type: 'ssq', data: [] };
      }

      const response = await axios.get(this.SSQ_URL, {
        responseType: 'arraybuffer',
      });
      const decodedData = iconv.decode(response.data, 'gb2312'); // use iconv to decode GB2312 encoding
      const $ = cheerio.load(decodedData);
      const data: LotteryData[] = [];

      $('tr.t_tr1').each((_, element) => {
        const cells = $(element).find('td');
        if (cells.length >= 8) {
          const numbers = Array.from({ length: 6 }, (_, i) =>
            parseInt(
              $(cells[i + 1])
                .text()
                .trim()
            )
          );
          const bonusNumber = parseInt($(cells[7]).text().trim());
          const date = $(cells[0]).text().trim();

          data.push({
            date,
            numbers,
            bonusNumber,
          });
        }
      });

      await this.saveToExcel(data, filename);
      return { type: 'ssq', data };
    } catch (error) {
      console.error('Error scraping SSQ data:', error);
      throw error;
    }
  }

  async scrapeDLT(): Promise<ScrapedData> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const filename = path.join(this.DATA_DIR, `dlt_data_${today}.xlsx`);

      if (fs.existsSync(filename)) {
        // eslint-disable-next-line no-console
        console.log(`DLT data for today (${today}) already exists. Skipping.`);
        return { type: 'dlt', data: [] };
      }

      const response = await axios.get(this.DLT_URL);
      const $ = cheerio.load(response.data);
      const data: LotteryData[] = [];

      $('tr.t_tr1').each((_, element) => {
        const cells = $(element).find('td');
        if (cells.length >= 9) {
          const numbers = Array.from({ length: 5 }, (_, i) =>
            parseInt(
              $(cells[i + 1])
                .text()
                .trim()
            )
          );
          const bonusNumber = parseInt($(cells[6]).text().trim());
          const bonusNumber2 = parseInt($(cells[7]).text().trim());
          const date = $(cells[0]).text().trim();

          data.push({
            date,
            numbers,
            bonusNumber,
            bonusNumber2,
          });
        }
      });

      await this.saveToExcel(data, filename);
      return { type: 'dlt', data };
    } catch (error) {
      console.error('Error scraping DLT data:', error);
      throw error;
    }
  }

  private async saveToExcel(data: LotteryData[], filename: string): Promise<void> {
    const workbook = XLSX.utils.book_new();

    const validData = data.filter((item) => {
      if (filename.includes('dlt')) {
        if (item.numbers.length < 5 || item.numbers.some((num) => !isValidNumber(num)))
          return false;
        if (!isValidNumber(item.bonusNumber) || !isValidNumber(item.bonusNumber2)) return false;
      } else {
        if (item.numbers.length < 6 || item.numbers.some((num) => !isValidNumber(num)))
          return false;
        if (!isValidNumber(item.bonusNumber)) return false;
      }
      return true;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sheetData: any[][] = [];
    if (filename.includes('dlt')) {
      // 大乐透表头
      const headers = ['期号', '前区号码', '后区号码1', '后区号码2'];
      sheetData.push(headers);
      validData.forEach((item) => {
        sheetData.push([
          item.date,
          item.numbers.join(', '),
          item.bonusNumber,
          item.bonusNumber2 || '',
        ]);
      });
    } else {
      // 双色球表头
      const headers = ['期号', '红球号码', '蓝球号码'];
      sheetData.push(headers);
      validData.forEach((item) => {
        sheetData.push([item.date, item.numbers.join(', '), item.bonusNumber]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    let wscols;
    if (filename.includes('dlt')) {
      wscols = [
        { wch: 15 }, // 期号
        { wch: 20 }, // 前区号码
        { wch: 15 }, // 后区号码1
        { wch: 15 }, // 后区号码2
      ];
    } else {
      wscols = [
        { wch: 15 }, // 期号
        { wch: 20 }, // 红球号码
        { wch: 15 }, // 蓝球号码
      ];
    }
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, ws, 'Lottery Data');
    XLSX.writeFile(workbook, filename);
  }
}
export default new LotteryScraper();
