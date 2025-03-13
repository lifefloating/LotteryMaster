import axios from 'axios';
import * as cheerio from 'cheerio';
import * as XLSX from 'xlsx';
import { LotteryData, ScrapeResult, LotteryType } from '../types/lottery';
import * as fs from 'fs';
import * as path from 'path';
import config from '../config'; // Import config
import { createLogger } from '../utils/logger';

const logger = createLogger('scrapeService');
const isValidNumber = (n: any): boolean => typeof n === 'number' && Number.isFinite(n);

class LotteryScraper {
  private readonly SSQ_BASE_URL = config.SSQ_BASE_URL;
  private readonly DLT_BASE_URL = config.DLT_BASE_URL;
  private readonly FC3D_BASE_URL = config.FC3D_BASE_URL;
  private readonly HISTORY_LIMIT = config.HISTORY_LIMIT;
  private readonly DATA_DIR = config.DATA_PATH;
  private readonly SSQ_PREFIX = config.SSQ_FILE_PREFIX;
  private readonly DLT_PREFIX = config.DLT_FILE_PREFIX;
  private readonly FC3D_PREFIX = config.FC3D_FILE_PREFIX;

  constructor() {
    const dataDir = path.join(__dirname, '..', this.DATA_DIR);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  private getDataDirPath(): string {
    return path.join(__dirname, '..', this.DATA_DIR);
  }

  private deleteOldFiles(prefix: string): void {
    const today = new Date().toISOString().slice(0, 10);
    const dataDir = this.getDataDirPath();
    const files = fs.readdirSync(dataDir);
    files.forEach((file) => {
      if (file.startsWith(prefix) && !file.includes(today)) {
        fs.unlinkSync(path.join(dataDir, file));
      }
    });
  }

  private getFullUrl(baseUrl: string, type: LotteryType): string {
    if (type === LotteryType.FC3D) {
      return `${baseUrl}?expect=${this.HISTORY_LIMIT}`;
    }
    return `${baseUrl}?limit=${this.HISTORY_LIMIT}`;
  }

  async scrapeSSQ(): Promise<ScrapeResult> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const filename = path.join(this.getDataDirPath(), `${this.SSQ_PREFIX}${today}.xlsx`);

      // Delete old SSQ files before checking/creating new one
      this.deleteOldFiles(this.SSQ_PREFIX);

      if (fs.existsSync(filename)) {
        return {
          success: true,
          message: `SSQ data file for ${today} already exists`,
          fileName: filename,
          isNewFile: false,
        };
      }

      logger.info(
        `Fetching SSQ data from URL: ${this.getFullUrl(this.SSQ_BASE_URL, LotteryType.SSQ)}`
      );
      const response = await axios.get(this.getFullUrl(this.SSQ_BASE_URL, LotteryType.SSQ));
      logger.info(`Response received. Status: ${response.status}`);
      if (!response.data) {
        logger.error('Response data is empty or undefined');
        throw new Error('No data received from SSQ URL');
      }

      const $ = cheerio.load(response.data);
      logger.info(`Cheerio loaded the HTML content`);
      const data: LotteryData[] = [];

      $('tr.t_tr1').each((_, element) => {
        const cells = $(element).find('td');
        // Remove the length check to capture all rows with class t_tr1
        const numbers = Array.from({ length: 6 }, (_, i) =>
          parseInt(
            $(cells[i + 1])
              .text()
              .trim()
          )
        );
        const bonusNumber = parseInt($(cells[7]).text().trim());
        const date = $(cells[0]).text().trim();

        // Only add valid entries (where all numbers are parsed correctly)
        if (date && !isNaN(bonusNumber) && numbers.every((num) => !isNaN(num))) {
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
        isNewFile: true,
      };
    } catch (error) {
      logger.error('Error scraping SSQ data:', error);
      return {
        success: false,
        message: `Failed to scrape SSQ data: ${error instanceof Error ? error.message : String(error)}`,
        isNewFile: false,
      };
    }
  }

  async scrapeDLT(): Promise<ScrapeResult> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const filename = path.join(this.getDataDirPath(), `${this.DLT_PREFIX}${today}.xlsx`);

      // Delete old DLT files before checking/creating new one
      this.deleteOldFiles(this.DLT_PREFIX);

      if (fs.existsSync(filename)) {
        return {
          success: true,
          message: `DLT data file for ${today} already exists`,
          fileName: filename,
          isNewFile: false,
        };
      }

      logger.info(
        `Fetching DLT data from URL: ${this.getFullUrl(this.DLT_BASE_URL, LotteryType.DLT)}`
      );
      const response = await axios.get(this.getFullUrl(this.DLT_BASE_URL, LotteryType.DLT));
      logger.info(`Response received. Status: ${response.status}`);
      if (!response.data) {
        logger.error('Response data is empty or undefined');
        throw new Error('No data received from DLT URL');
      }

      const $ = cheerio.load(response.data);
      logger.info(`Cheerio loaded the HTML content`);
      const data: LotteryData[] = [];

      $('tr.t_tr1').each((_, element) => {
        const cells = $(element).find('td');
        // Remove the length check to capture all rows with class t_tr1
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

        // Only add valid entries (where all numbers are parsed correctly)
        if (
          date &&
          !isNaN(bonusNumber) &&
          !isNaN(bonusNumber2) &&
          numbers.every((num) => !isNaN(num))
        ) {
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
        isNewFile: true,
      };
    } catch (error) {
      logger.error('Error scraping DLT data:', error);
      return {
        success: false,
        message: `Failed to scrape DLT data: ${error instanceof Error ? error.message : String(error)}`,
        isNewFile: false,
      };
    }
  }

  async scrapeFC3D(): Promise<ScrapeResult> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const filename = path.join(this.getDataDirPath(), `${this.FC3D_PREFIX}${today}.xlsx`);

      // Delete old FC3D files before checking/creating new one
      this.deleteOldFiles(this.FC3D_PREFIX);

      if (fs.existsSync(filename)) {
        return {
          success: true,
          message: `FC3D data file for ${today} already exists`,
          fileName: filename,
          isNewFile: false,
        };
      }

      logger.info(
        `Fetching FC3D data from URL: ${this.getFullUrl(this.FC3D_BASE_URL, LotteryType.FC3D)}`
      );
      const response = await axios.get(this.getFullUrl(this.FC3D_BASE_URL, LotteryType.FC3D));
      logger.info(`Response received. Status: ${response.status}`);
      if (!response.data) {
        logger.error('Response data is empty or undefined');
        throw new Error('No data received from FC3D URL');
      }

      const $ = cheerio.load(response.data);
      logger.info(`Cheerio loaded the HTML content`);
      const data: LotteryData[] = [];

      $('tr').each((_, element) => {
        const cells = $(element).find('td');
        if (cells.length < 5) return;

        // 检查是否是包含开奖号码的行（通过查找chartBall01类）
        const hasBallClass = $(cells[2]).hasClass('chartBall01');
        if (!hasBallClass) return;

        const date = $(cells[0]).text().trim();

        // 获取个十百
        const hundredsPlace = parseInt($(cells[2]).text().trim());
        const tensPlace = parseInt($(cells[3]).text().trim());
        const onesPlace = parseInt($(cells[4]).text().trim());

        // 验证所有数字是否有效
        if (date && !isNaN(hundredsPlace) && !isNaN(tensPlace) && !isNaN(onesPlace)) {
          data.push({
            date,
            numbers: [hundredsPlace, tensPlace, onesPlace],
          });
        }
      });

      if (data.length === 0) {
        logger.error('Failed to parse any FC3D data from the HTML');
        throw new Error('No valid FC3D data found in the response');
      }

      logger.info(`Successfully parsed ${data.length} FC3D records`);
      await this.saveToExcel(data, filename);
      return {
        success: true,
        message: `Successfully created new FC3D data file for ${today} with ${data.length} records`,
        fileName: filename,
        isNewFile: true,
      };
    } catch (error) {
      logger.error('Error scraping FC3D data:', error);
      return {
        success: false,
        message: `Failed to scrape FC3D data: ${error instanceof Error ? error.message : String(error)}`,
        isNewFile: false,
      };
    }
  }

  private async saveToExcel(data: LotteryData[], filename: string): Promise<void> {
    const workbook = XLSX.utils.book_new();

    const validData = data.filter((item) => {
      if (filename.includes('dlt')) {
        if (item.numbers.length < 5 || item.numbers.some((num) => !isValidNumber(num)))
          return false;
        if (!isValidNumber(item.bonusNumber) || !isValidNumber(item.bonusNumber2)) return false;
      } else if (filename.includes('ssq')) {
        if (item.numbers.length < 6 || item.numbers.some((num) => !isValidNumber(num)))
          return false;
        if (!isValidNumber(item.bonusNumber)) return false;
      } else if (filename.includes('fc3d')) {
        if (item.numbers.length < 3 || item.numbers.some((num) => !isValidNumber(num)))
          return false;
      }
      return true;
    });

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
    } else if (filename.includes('ssq')) {
      // 双色球表头
      const headers = ['期号', '红球号码', '蓝球号码'];
      sheetData.push(headers);
      validData.forEach((item) => {
        sheetData.push([item.date, item.numbers.join(', '), item.bonusNumber]);
      });
    } else if (filename.includes('fc3d')) {
      // 福彩3D表头
      const headers = ['期号', '百位', '十位', '个位'];
      sheetData.push(headers);
      validData.forEach((item) => {
        sheetData.push([item.date, item.numbers[0], item.numbers[1], item.numbers[2]]);
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
    } else if (filename.includes('ssq')) {
      wscols = [
        { wch: 15 }, // 期号
        { wch: 20 }, // 红球号码
        { wch: 15 }, // 蓝球号码
      ];
    } else if (filename.includes('fc3d')) {
      wscols = [
        { wch: 15 }, // 期号
        { wch: 10 }, // 百位
        { wch: 10 }, // 十位
        { wch: 10 }, // 个位
      ];
    }
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, ws, 'Lottery Data');
    XLSX.writeFile(workbook, filename);
  }
}
export default new LotteryScraper();
