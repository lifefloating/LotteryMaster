import { createLogger } from '../utils/logger';
import { databaseService } from './database';
import {
  CreateEmailConfigInput,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from './database/types';
import analyzeService from './analyzeService';
import scrapeService from './scrapeService';
import { emailService } from './email';
import config from '../config';
import path from 'path';

const logger = createLogger('SubscriptionService');

export class SubscriptionService {
  private static instance: SubscriptionService;

  private constructor() {
    logger.info('SubscriptionService initialized');
  }

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  // Email Config Methods
  getEmailConfig() {
    return databaseService.getEmailConfig();
  }

  saveEmailConfig(configInput: CreateEmailConfigInput) {
    return databaseService.saveEmailConfig(configInput);
  }

  deleteEmailConfig() {
    databaseService.deleteEmailConfig();
  }

  // Subscription Methods
  getAllSubscriptions() {
    return databaseService.getAllSubscriptions();
  }

  getSubscription(id: number) {
    return databaseService.getSubscription(id);
  }

  createSubscription(input: CreateSubscriptionInput) {
    return databaseService.createSubscription(input);
  }

  updateSubscription(id: number, input: UpdateSubscriptionInput) {
    return databaseService.updateSubscription(id, input);
  }

  deleteSubscription(id: number) {
    return databaseService.deleteSubscription(id);
  }

  // Send Methods
  async sendTestEmail(toEmail: string): Promise<void> {
    if (!emailService.isConfigured()) {
      throw new Error('Email service is not configured');
    }

    await emailService.sendTestEmail(toEmail);
  }

  async sendPredictionEmailForSubscription(subscriptionId: number): Promise<void> {
    const subscription = this.getSubscription(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    if (!subscription.enabled) {
      logger.info(`Subscription ${subscriptionId} is disabled, skipping email`);
      return;
    }

    await this.sendPredictionEmail(subscription.lottery_type, subscription.to_email);
  }

  async sendPredictionEmail(lotteryType: 'ssq' | 'dlt' | 'fc3d', toEmail: string): Promise<void> {
    try {
      logger.info(`Preparing prediction email for ${lotteryType} to ${toEmail}`);

      // Get lottery data file path
      const filePrefix =
        lotteryType === 'ssq'
          ? config.SSQ_FILE_PREFIX
          : lotteryType === 'dlt'
            ? config.DLT_FILE_PREFIX
            : config.FC3D_FILE_PREFIX;

      // Try to scrape latest data first
      try {
        logger.info(`Scraping latest ${lotteryType} data...`);
        if (lotteryType === 'ssq') {
          await scrapeService.scrapeSSQ();
        } else if (lotteryType === 'dlt') {
          await scrapeService.scrapeDLT();
        } else if (lotteryType === 'fc3d') {
          await scrapeService.scrapeFC3D();
        }
      } catch (error) {
        logger.warn(`Failed to scrape latest data, using existing data: ${error}`);
      }

      // Find the latest data file
      const fs = require('fs');
      const dataPath = path.join(process.cwd(), config.DATA_PATH);
      const files = fs.readdirSync(dataPath);
      const dataFiles = files
        .filter((f: string) => f.startsWith(filePrefix) && f.endsWith('.xlsx'))
        .sort()
        .reverse();

      if (dataFiles.length === 0) {
        throw new Error(`No data file found for ${lotteryType}`);
      }

      const latestFile = path.join(dataPath, dataFiles[0]);
      logger.info(`Using data file: ${latestFile}`);

      // Analyze lottery data
      const analysis = await analyzeService.analyzeLotteryData(latestFile, lotteryType.toUpperCase() as any);

      // Get period and date from filename or current date
      const now = new Date();
      const period = `${now.getFullYear()}${String(Math.ceil((now.getMonth() + 1) * 4.33)).padStart(3, '0')}`;
      const date = now.toISOString().split('T')[0];

      // Send email
      await emailService.sendPredictionEmail({
        to: toEmail,
        lotteryType,
        period,
        date,
        analysis,
        frontendUrl: 'https://lottery-master.vercel.app',
      });

      logger.info(`Prediction email sent successfully to ${toEmail}`);
    } catch (error) {
      logger.error(`Error sending prediction email: ${error}`);
      throw error;
    }
  }
}

export default SubscriptionService.getInstance();
