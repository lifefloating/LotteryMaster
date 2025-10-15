import * as cron from 'node-cron';
import { createLogger } from '../utils/logger';
import subscriptionService from './subscriptionService';
import { databaseService } from './database';
import { Subscription } from './database/types';

const logger = createLogger('SchedulerService');

export class SchedulerService {
  private static instance: SchedulerService;
  private tasks: Map<number, cron.ScheduledTask> = new Map();

  private constructor() {
    logger.info('SchedulerService initialized');
  }

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Start all scheduled tasks from database
   */
  start(): void {
    logger.info('Starting scheduler service');

    // Stop all existing tasks
    this.stopAll();

    // Get all enabled subscriptions
    const subscriptions = databaseService.getEnabledSubscriptions();

    logger.info(`Found ${subscriptions.length} enabled subscriptions`);

    // Schedule each subscription
    subscriptions.forEach((subscription) => {
      try {
        this.scheduleSubscription(subscription);
      } catch (error) {
        logger.error(
          `Failed to schedule subscription ${subscription.id}:`,
          error instanceof Error ? error.message : error
        );
      }
    });

    logger.info('Scheduler service started successfully');
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll(): void {
    logger.info('Stopping all scheduled tasks');
    this.tasks.forEach((task, id) => {
      task.stop();
      logger.info(`Stopped task for subscription ${id}`);
    });
    this.tasks.clear();
  }

  /**
   * Schedule a single subscription
   */
  scheduleSubscription(subscription: Subscription): void {
    // Stop existing task if any
    if (this.tasks.has(subscription.id)) {
      this.tasks.get(subscription.id)!.stop();
      this.tasks.delete(subscription.id);
    }

    const cronExpression = this.buildCronExpression(subscription);

    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    logger.info(
      `Scheduling subscription ${subscription.id} with cron: ${cronExpression} (${subscription.schedule_type})`
    );

    const task = cron.schedule(cronExpression, async () => {
      try {
        logger.info(
          `Executing scheduled task for subscription ${subscription.id} (${subscription.lottery_type})`
        );

        await subscriptionService.sendPredictionEmailForSubscription(subscription.id);

        logger.info(`Successfully sent scheduled email for subscription ${subscription.id}`);
      } catch (error) {
        logger.error(
          `Error executing scheduled task for subscription ${subscription.id}:`,
          error instanceof Error ? error.message : error
        );
      }
    });

    this.tasks.set(subscription.id, task);
    logger.info(`Subscription ${subscription.id} scheduled successfully`);
  }

  /**
   * Unschedule a subscription
   */
  unscheduleSubscription(subscriptionId: number): void {
    const task = this.tasks.get(subscriptionId);
    if (task) {
      task.stop();
      this.tasks.delete(subscriptionId);
      logger.info(`Subscription ${subscriptionId} unscheduled`);
    }
  }

  /**
   * Build cron expression from subscription config
   * Cron format: second minute hour day-of-month month day-of-week
   * Example: "0 9 * * *" = every day at 9:00 AM
   * Example: "0 9 * * 1" = every Monday at 9:00 AM
   */
  private buildCronExpression(subscription: Subscription): string {
    const [hours, minutes] = subscription.schedule_time.split(':').map(Number);

    if (subscription.schedule_type === 'daily') {
      // Run daily at specified time
      // Format: minute hour * * *
      return `${minutes} ${hours} * * *`;
    } else {
      // Run weekly on specified day at specified time
      // Format: minute hour * * day-of-week (0-6, 0=Sunday)
      const weekday = subscription.schedule_weekday ?? 0;
      return `${minutes} ${hours} * * ${weekday}`;
    }
  }

  /**
   * Get human-readable schedule description
   */
  getScheduleDescription(subscription: Subscription): string {
    if (subscription.schedule_type === 'daily') {
      return `每天 ${subscription.schedule_time}`;
    } else {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekday = weekdays[subscription.schedule_weekday ?? 0];
      return `每${weekday} ${subscription.schedule_time}`;
    }
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.tasks.size > 0;
  }

  /**
   * Get number of active tasks
   */
  getActiveTaskCount(): number {
    return this.tasks.size;
  }
}

export default SchedulerService.getInstance();
