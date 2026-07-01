import { mkdir, writeFile, access } from 'fs/promises';
import * as path from 'path';
import { config } from '../config';
import { ScrapedDocument } from '../models/Document';
import { logger } from '../logger/Logger';

export class PdfStorage {
  private readonly usedFilenames = new Set<string>();

  async save(document: ScrapedDocument, buffer: Buffer): Promise<string> {
    const pdfDir = path.join(config.outputFolder, 'pdfs');
    await mkdir(pdfDir, { recursive: true });

    const filename = await this.resolveFilename(document, pdfDir);
    await writeFile(path.join(pdfDir, filename), buffer);
    this.usedFilenames.add(filename);
    logger.info(`Saved ${filename}`);
    return filename;
  }

  private async resolveFilename(document: ScrapedDocument, pdfDir: string): Promise<string> {
    const baseName = this.sanitize(document.caseNumber);
    const candidate = `${baseName}.pdf`;

    if (!this.usedFilenames.has(candidate) && !(await this.exists(path.join(pdfDir, candidate)))) {
      return candidate;
    }

    const suffix = document.pdfUuid.replace(/-/g, '').slice(0, 8) || Date.now().toString(36);
    return `${baseName}_${suffix}.pdf`;
  }

  private sanitize(value: string): string {
    return value
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
