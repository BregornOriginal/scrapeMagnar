import { logger } from './logger/Logger';

async function main(): Promise<void> {
  logger.info('Starting session');
}

main().catch((error) => {
  logger.error(`Fatal error: ${(error as Error).message}`);
  process.exit(1);
});
