import { FastifyRequest, FastifyReply } from 'fastify';
import chartService from '../services/chartService';

interface ChartQuerystring {
  type: 'ssq' | 'dlt';
  periodCount?: string;
  zoneType?: 'red' | 'blue';
  includeChartData?: string;
}

export const getTrendChart = async (
  request: FastifyRequest<{ Querystring: ChartQuerystring }>,
  reply: FastifyReply
): Promise<FastifyReply> => {
  try {
    const {
      type,
      periodCount = '100',
      zoneType = 'red',
      includeChartData = 'true',
    } = request.query;
    const lotteryType = type.toUpperCase() as 'SSQ' | 'DLT';
    const periods = parseInt(periodCount, 10);

    if (isNaN(periods) || periods <= 0) {
      return reply.status(400).send({
        success: false,
        error: 'Period count must be a positive number',
      });
    }

    const result = await chartService.generateNumberTrend(lotteryType, periods, zoneType);

    if (includeChartData === 'false') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { chartData, ...rest } = result;
      return reply.send({
        success: true,
        data: rest,
      });
    }

    return reply.send({
      success: true,
      data: result,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: {
        message: (error as Error).message,
      },
    });
  }
};

export const getFrequencyChart = async (
  request: FastifyRequest<{ Querystring: ChartQuerystring }>,
  reply: FastifyReply
): Promise<FastifyReply> => {
  try {
    const {
      type,
      periodCount = '100',
      zoneType = 'red',
      includeChartData = 'true',
    } = request.query;
    const lotteryType = type.toUpperCase() as 'SSQ' | 'DLT';
    const periods = parseInt(periodCount, 10);

    if (isNaN(periods) || periods <= 0) {
      return reply.status(400).send({
        success: false,
        error: 'Period count must be a positive number',
      });
    }

    if (includeChartData === 'false') {
      return reply.send({
        success: true,
        data: { message: 'Chart data excluded as requested' },
      });
    }

    const chartData = await chartService.generateFrequencyChart(lotteryType, periods, zoneType);

    return reply.send({
      success: true,
      data: chartData,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: {
        message: (error as Error).message,
      },
    });
  }
};
