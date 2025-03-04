import { FastifyRequest, FastifyReply } from 'fastify';
import { scrapeSSQ, scrapeDLT } from '../../controllers/scrapeController';
import scraper from '../../services/scraperService';

// Mock scraper service
jest.mock('../../services/scraperService');

describe('Scrape Controller', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  const mockScrapeResult = {
    success: true,
    message: 'Scraping completed successfully',
    isNewFile: true,
  };

  beforeEach(() => {
    mockRequest = {};
    mockReply = {
      send: jest.fn().mockReturnThis(),
    };
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('scrapeSSQ', () => {
    it('should scrape SSQ data successfully', async () => {
      (scraper.scrapeSSQ as jest.Mock).mockResolvedValue(mockScrapeResult);

      await scrapeSSQ(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(scraper.scrapeSSQ).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith(mockScrapeResult);
    });

    it('should handle scraping errors', async () => {
      const errorResult = {
        success: false,
        message: 'Failed to scrape SSQ data',
        isNewFile: false,
      };
      (scraper.scrapeSSQ as jest.Mock).mockResolvedValue(errorResult);

      await scrapeSSQ(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(scraper.scrapeSSQ).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith(errorResult);
    });
  });

  describe('scrapeDLT', () => {
    it('should scrape DLT data successfully', async () => {
      (scraper.scrapeDLT as jest.Mock).mockResolvedValue(mockScrapeResult);

      await scrapeDLT(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(scraper.scrapeDLT).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith(mockScrapeResult);
    });

    it('should handle scraping errors', async () => {
      const errorResult = {
        success: false,
        message: 'Failed to scrape DLT data',
        isNewFile: false,
      };
      (scraper.scrapeDLT as jest.Mock).mockResolvedValue(errorResult);

      await scrapeDLT(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(scraper.scrapeDLT).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith(errorResult);
    });
  });
});
