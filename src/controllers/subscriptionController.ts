import { FastifyRequest, FastifyReply } from 'fastify';
import subscriptionService from '../services/subscriptionService';
import schedulerService from '../services/schedulerService';
import {
  CreateEmailConfigInput,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from '../services/database/types';

// Email Config Handlers
export async function getEmailConfig(request: FastifyRequest, reply: FastifyReply) {
  try {
    const config = subscriptionService.getEmailConfig();

    if (!config) {
      return reply.status(404).send({
        success: false,
        error: 'Email configuration not found',
      });
    }

    // Don't return password
    const { smtp_pass, ...safeConfig } = config;

    return reply.send({
      success: true,
      data: safeConfig,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function saveEmailConfig(
  request: FastifyRequest<{ Body: CreateEmailConfigInput }>,
  reply: FastifyReply
) {
  try {
    const config = subscriptionService.saveEmailConfig(request.body);

    // Don't return password
    const { smtp_pass, ...safeConfig } = config;

    return reply.send({
      success: true,
      data: safeConfig,
      message: 'Email configuration saved successfully',
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function deleteEmailConfig(request: FastifyRequest, reply: FastifyReply) {
  try {
    subscriptionService.deleteEmailConfig();

    return reply.send({
      success: true,
      message: 'Email configuration deleted successfully',
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Subscription Handlers
export async function getAllSubscriptions(request: FastifyRequest, reply: FastifyReply) {
  try {
    const subscriptions = subscriptionService.getAllSubscriptions();

    return reply.send({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function getSubscription(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const id = parseInt(request.params.id);
    const subscription = subscriptionService.getSubscription(id);

    if (!subscription) {
      return reply.status(404).send({
        success: false,
        error: 'Subscription not found',
      });
    }

    return reply.send({
      success: true,
      data: subscription,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function createSubscription(
  request: FastifyRequest<{ Body: CreateSubscriptionInput }>,
  reply: FastifyReply
) {
  try {
    const subscription = subscriptionService.createSubscription(request.body);

    // Reschedule tasks if subscription is enabled
    if (subscription.enabled) {
      schedulerService.scheduleSubscription(subscription);
    }

    return reply.send({
      success: true,
      data: subscription,
      message: 'Subscription created successfully',
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function updateSubscription(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateSubscriptionInput }>,
  reply: FastifyReply
) {
  try {
    const id = parseInt(request.params.id);
    const subscription = subscriptionService.updateSubscription(id, request.body);

    if (!subscription) {
      return reply.status(404).send({
        success: false,
        error: 'Subscription not found',
      });
    }

    // Reschedule tasks
    if (subscription.enabled) {
      schedulerService.scheduleSubscription(subscription);
    } else {
      schedulerService.unscheduleSubscription(id);
    }

    return reply.send({
      success: true,
      data: subscription,
      message: 'Subscription updated successfully',
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function deleteSubscription(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const id = parseInt(request.params.id);
    const success = subscriptionService.deleteSubscription(id);

    if (!success) {
      return reply.status(404).send({
        success: false,
        error: 'Subscription not found',
      });
    }

    // Unschedule the task
    schedulerService.unscheduleSubscription(id);

    return reply.send({
      success: true,
      message: 'Subscription deleted successfully',
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Test Email Handler
export async function sendTestEmail(
  request: FastifyRequest<{ Body: { to_email: string } }>,
  reply: FastifyReply
) {
  try {
    await subscriptionService.sendTestEmail(request.body.to_email);

    return reply.send({
      success: true,
      message: 'Test email sent successfully',
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Send Prediction Email Handler (for manual trigger)
export async function sendPredictionEmail(
  request: FastifyRequest<{
    Body: {
      lottery_type: 'ssq' | 'dlt' | 'fc3d';
      to_email: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    await subscriptionService.sendPredictionEmail(
      request.body.lottery_type,
      request.body.to_email
    );

    return reply.send({
      success: true,
      message: 'Prediction email sent successfully',
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Scheduler Status Handler
export async function getSchedulerStatus(request: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send({
      success: true,
      data: {
        isRunning: schedulerService.isRunning(),
        activeTaskCount: schedulerService.getActiveTaskCount(),
      },
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
