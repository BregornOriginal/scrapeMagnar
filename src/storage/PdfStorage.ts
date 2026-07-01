import { mkdir, writeFile, access } from 'fs/promises';
import * as path from 'path';
import { config } from '../config';
import { ScrapedDocument } from '../models/Document';
import { logger } from '../logger/Logger';

export class PdfStorage {
  private readonly usedFilenames = new Set<string>();

  async save(document: ScrapedDocument, buffer: Buffer, pageNumber: number): Promise<string> {
    const pageFolder = `page-${pageNumber}`;
    const pageDir = path.join(config.outputFolder, 'pdfs', pageFolder);
    await mkdir(pageDir, { recursive: true });

    const filename = await this.resolveFilename(document, pageDir, pageFolder);
    await writeFile(path.join(pageDir, filename), buffer);
    this.usedFilenames.add(`${pageFolder}/${filename}`);

    const relativePath = path.join(pageFolder, filename);
    logger.info(`Saved ${relativePath}`);
    return relativePath;
  }

  private async resolveFilename(document: ScrapedDocument, pageDir: string, pageFolder: string): Promise<string> {
    const baseName = this.sanitize(document.caseNumber);
    const candidate = `${baseName}.pdf`;

    if (!this.usedFilenames.has(`${pageFolder}/${candidate}`) && !(await this.exists(path.join(pageDir, candidate)))) {
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
