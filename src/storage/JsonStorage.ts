import { mkdir, writeFile } from 'fs/promises';
import * as path from 'path';
import { config } from '../config';
import { logger } from '../logger/Logger';

export class JsonStorage {
  async save<T>(filename: string, data: T): Promise<string> {
    await mkdir(config.outputFolder, { recursive: true });
    const filePath = path.join(config.outputFolder, filename);
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`Saved ${filePath}`);
    return filePath;
  }
}
