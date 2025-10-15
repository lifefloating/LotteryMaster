import nodemailer from 'nodemailer';
import { createLogger } from '../../utils/logger';
import { databaseService } from '../database';
import { generateEmailHTML, generateEmailSubject } from './emailTemplate';
import { AnalysisResult } from '../../types/lottery';

const logger = createLogger('EmailService');

export interface SendEmailOptions {
  to: string;
  lotteryType: 'ssq' | 'dlt' | 'fc3d';
  period: string;
  date: string;
  analysis: AnalysisResult;
  frontendUrl?: string;
}

export class EmailService {
  private static instance: EmailService;

  private constructor() {
    logger.info('EmailService initialized');
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Create transporter from database config
   */
  private async createTransporter() {
    const emailConfig = databaseService.getEmailConfig();

    if (!emailConfig) {
      throw new Error('Email configuration not found. Please configure SMTP settings first.');
    }

    const transporter = nodemailer.createTransport({
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      secure: emailConfig.smtp_secure, // true for 465, false for other ports
      auth: {
        user: emailConfig.smtp_user,
        pass: emailConfig.smtp_pass,
      },
    });

    // Verify connection
    try {
      await transporter.verify();
      logger.info('SMTP connection verified successfully');
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
      throw new Error('Failed to connect to email server. Please check your SMTP settings.');
    }

    return { transporter, emailConfig };
  }

  /**
   * Send lottery prediction email
   */
  async sendPredictionEmail(options: SendEmailOptions): Promise<void> {
    try {
      logger.info(
        `Sending prediction email to ${options.to} for ${options.lotteryType} ${options.period}`
      );

      const { transporter, emailConfig } = await this.createTransporter();

      const frontendUrl = options.frontendUrl || 'https://lottery-master.vercel.app';

      const subject = generateEmailSubject(options.lotteryType, options.period, options.date);
      const html = generateEmailHTML({
        lotteryType: options.lotteryType,
        period: options.period,
        date: options.date,
        analysis: options.analysis,
        frontendUrl,
      });

      await transporter.sendMail({
        from: emailConfig.from_name
          ? `"${emailConfig.from_name}" <${emailConfig.from_email}>`
          : emailConfig.from_email,
        to: options.to,
        subject,
        html,
      });

      logger.info(`Email sent successfully to ${options.to}`);
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(toEmail: string): Promise<void> {
    try {
      logger.info(`Sending test email to ${toEmail}`);

      const { transporter, emailConfig } = await this.createTransporter();

      await transporter.sendMail({
        from: emailConfig.from_name
          ? `"${emailConfig.from_name}" <${emailConfig.from_email}>`
          : emailConfig.from_email,
        to: toEmail,
        subject: '【彩票大师】邮件配置测试',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background-color: #f8f9fa; border-radius: 8px; padding: 30px; }
              h1 { color: #3b82f6; }
              .success { background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🎉 邮件配置成功！</h1>
              <div class="success">
                <strong>恭喜！</strong> 您的邮件服务器配置正确，可以正常发送邮件。
              </div>
              <p>这是一封测试邮件，表示您的 SMTP 配置已经成功。</p>
              <p>现在您可以开始使用彩票大师的邮件订阅功能了！</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 14px;">彩票大师团队</p>
            </div>
          </body>
          </html>
        `,
      });

      logger.info(`Test email sent successfully to ${toEmail}`);
    } catch (error) {
      logger.error('Error sending test email:', error);
      throw error;
    }
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    const emailConfig = databaseService.getEmailConfig();
    return !!emailConfig;
  }
}

export default EmailService.getInstance();
