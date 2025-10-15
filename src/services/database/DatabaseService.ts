import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { createLogger } from '../../utils/logger';
import {
  EmailConfig,
  Subscription,
  CreateEmailConfigInput,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from './types';

const logger = createLogger('DatabaseService');

export class DatabaseService {
  private db: Database.Database;
  private static instance: DatabaseService;

  private constructor() {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      logger.info('Created data directory');
    }

    // Initialize database
    const dbPath = path.join(dataDir, 'subscription.db');
    this.db = new Database(dbPath);

    logger.info(`Database initialized at: ${dbPath}`);

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Initialize tables
    this.initTables();
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private initTables(): void {
    // Create email_config table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS email_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        smtp_host TEXT NOT NULL,
        smtp_port INTEGER NOT NULL,
        smtp_secure INTEGER NOT NULL DEFAULT 1,
        smtp_user TEXT NOT NULL,
        smtp_pass TEXT NOT NULL,
        from_email TEXT NOT NULL,
        from_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create subscriptions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        to_email TEXT NOT NULL,
        lottery_type TEXT NOT NULL CHECK (lottery_type IN ('ssq', 'dlt', 'fc3d')),
        schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly')),
        schedule_time TEXT NOT NULL,
        schedule_weekday INTEGER CHECK (schedule_weekday >= 0 AND schedule_weekday <= 6),
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('Database tables initialized');
  }

  // Email Config Methods
  getEmailConfig(): EmailConfig | null {
    const row = this.db.prepare('SELECT * FROM email_config WHERE id = 1').get() as any;
    if (!row) return null;

    return {
      ...row,
      smtp_secure: row.smtp_secure === 1,
      enabled: row.enabled === 1,
    };
  }

  saveEmailConfig(config: CreateEmailConfigInput): EmailConfig {
    const existing = this.getEmailConfig();

    if (existing) {
      // Update existing config
      this.db
        .prepare(
          `UPDATE email_config
           SET smtp_host = ?, smtp_port = ?, smtp_secure = ?, smtp_user = ?,
               smtp_pass = ?, from_email = ?, from_name = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = 1`
        )
        .run(
          config.smtp_host,
          config.smtp_port,
          config.smtp_secure ? 1 : 0,
          config.smtp_user,
          config.smtp_pass,
          config.from_email,
          config.from_name || null
        );
    } else {
      // Insert new config
      this.db
        .prepare(
          `INSERT INTO email_config
           (id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, from_email, from_name)
           VALUES (1, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          config.smtp_host,
          config.smtp_port,
          config.smtp_secure ? 1 : 0,
          config.smtp_user,
          config.smtp_pass,
          config.from_email,
          config.from_name || null
        );
    }

    logger.info('Email config saved');
    return this.getEmailConfig()!;
  }

  deleteEmailConfig(): void {
    this.db.prepare('DELETE FROM email_config WHERE id = 1').run();
    logger.info('Email config deleted');
  }

  // Subscription Methods
  getAllSubscriptions(): Subscription[] {
    const rows = this.db.prepare('SELECT * FROM subscriptions ORDER BY created_at DESC').all() as any[];
    return rows.map((row) => ({
      ...row,
      enabled: row.enabled === 1,
    }));
  }

  getSubscription(id: number): Subscription | null {
    const row = this.db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      ...row,
      enabled: row.enabled === 1,
    };
  }

  getEnabledSubscriptions(): Subscription[] {
    const rows = this.db
      .prepare('SELECT * FROM subscriptions WHERE enabled = 1')
      .all() as any[];
    return rows.map((row) => ({
      ...row,
      enabled: true,
    }));
  }

  createSubscription(input: CreateSubscriptionInput): Subscription {
    const result = this.db
      .prepare(
        `INSERT INTO subscriptions
         (to_email, lottery_type, schedule_type, schedule_time, schedule_weekday, enabled)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.to_email,
        input.lottery_type,
        input.schedule_type,
        input.schedule_time,
        input.schedule_weekday || null,
        input.enabled !== false ? 1 : 0
      );

    logger.info(`Subscription created with ID: ${result.lastInsertRowid}`);
    return this.getSubscription(result.lastInsertRowid as number)!;
  }

  updateSubscription(id: number, input: UpdateSubscriptionInput): Subscription | null {
    const existing = this.getSubscription(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (input.to_email !== undefined) {
      updates.push('to_email = ?');
      params.push(input.to_email);
    }
    if (input.lottery_type !== undefined) {
      updates.push('lottery_type = ?');
      params.push(input.lottery_type);
    }
    if (input.schedule_type !== undefined) {
      updates.push('schedule_type = ?');
      params.push(input.schedule_type);
    }
    if (input.schedule_time !== undefined) {
      updates.push('schedule_time = ?');
      params.push(input.schedule_time);
    }
    if (input.schedule_weekday !== undefined) {
      updates.push('schedule_weekday = ?');
      params.push(input.schedule_weekday);
    }
    if (input.enabled !== undefined) {
      updates.push('enabled = ?');
      params.push(input.enabled ? 1 : 0);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    this.db
      .prepare(`UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?`)
      .run(...params);

    logger.info(`Subscription ${id} updated`);
    return this.getSubscription(id);
  }

  deleteSubscription(id: number): boolean {
    const result = this.db.prepare('DELETE FROM subscriptions WHERE id = ?').run(id);
    logger.info(`Subscription ${id} deleted`);
    return result.changes > 0;
  }

  close(): void {
    this.db.close();
    logger.info('Database connection closed');
  }
}

export default DatabaseService.getInstance();
