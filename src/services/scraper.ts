import axios from 'axios';
import * as cheerio from 'cheerio';
import * as XLSX from 'xlsx';
import { LotteryData, ScrapeResult } from '../types/lottery';
import iconv from 'iconv-lite';
import * as fs from 'fs';
import * as path from 'path';
import config from '../config'; // Import config

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isValidNumber = (n: any): boolean => typeof n === 'number' && Number.isFinite(n);

class LotteryScraper {
  private readonly SSQ_URL = config.SSQ_URL;
  private readonly DLT_URL = config.DLT_URL;
  private readonly DATA_DIR = config.DATA_PATH;
  private readonly SSQ_PREFIX = config.SSQ_FILE_PREFIX;
  private readonly DLT_PREFIX = config.DLT_FILE_PREFIX;

  constructor() {
    if (!fs.existsSync(this.DATA_DIR)) {
      fs.mkdirSync(this.DATA_DIR);
    }
  }

  private deleteOldFiles(prefix: string): void {
    const today = new Date().toISOString().slice(0, 10);
    const files = fs.readdirSync(this.DATA_DIR);
    files.forEach((file) => {
      if (file.startsWith(prefix) && !file.includes(today)) {
        fs.unlinkSync(path.join(this.DATA_DIR, file));
      }
    });
  }

  async scrapeSSQ(): Promise<ScrapeResult> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const filename = path.join(this.DATA_DIR, `${this.SSQ_PREFIX}${today}.xlsx`);

      // Delete old SSQ files before checking/creating new one
      this.deleteOldFiles(this.SSQ_PREFIX);

      if (fs.existsSync(filename)) {
        return {
          success: true,
          message: `SSQ data file for ${today} already exists`,
          fileName: filename,
          isNewFile: false
        };
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
      return {
        success: true,
        message: `Successfully created new SSQ data file for ${today}`,
        fileName: filename,
        isNewFile: true
      };
    } catch (error) {
      console.error('Error scraping SSQ data:', error);
      throw error;
    }
  }

  async scrapeDLT(): Promise<ScrapeResult> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const filename = path.join(this.DATA_DIR, `${this.DLT_PREFIX}${today}.xlsx`);

      // Delete old DLT files before checking/creating new one
      this.deleteOldFiles(this.DLT_PREFIX);

      if (fs.existsSync(filename)) {
        return {
          success: true,
          message: `DLT data file for ${today} already exists`,
          fileName: filename,
          isNewFile: false
        };
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
      return {
        success: true,
        message: `Successfully created new DLT data file for ${today}`,
        fileName: filename,
        isNewFile: true
      };
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
