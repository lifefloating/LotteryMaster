import { FastifyRequest, FastifyReply } from 'fastify';
import { healthCheck } from '../../controllers/healthController';

describe('Health Controller', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {};
    mockReply = {
      send: jest.fn().mockReturnThis(),
    };
  });

  it('should return success message', async () => {
    await healthCheck(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      message: 'Welcome to the lottery API',
    });
  });
});
