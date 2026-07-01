import { HttpError } from '../client/HttpError';
import { config } from '../config';
import { logger } from '../logger/Logger';

export class RetryPolicy {
  constructor(
    private readonly maxRetries: number = config.maxRetries,
    private readonly baseDelayMs: number = 1000,
  ) {}

  async execute<T>(operation: () => Promise<T>, context: string): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        attempt += 1;
        if (!this.isRetryable(error) || attempt > this.maxRetries) {
          throw error;
        }

        const delayMs = this.baseDelayMs * 2 ** (attempt - 1);
        const reason = error instanceof HttpError ? (error.status ?? 'network error') : 'unknown error';
        logger.warn(`${context}: ${reason}, retry ${attempt}/${this.maxRetries} in ${delayMs}ms`);
        await this.delay(delayMs);
      }
    }
  }

  private isRetryable(error: unknown): boolean {
    if (!(error instanceof HttpError)) {
      return false;
    }
    return error.status === undefined || error.status === 429;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
