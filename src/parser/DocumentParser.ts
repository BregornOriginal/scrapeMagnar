import * as cheerio from 'cheerio';
import { ScrapedDocument } from '../models/Document';
import { logger } from '../logger/Logger';

const DOWNLOAD_PARAMS_PATTERN = /'([^']+)':'([^']*)'/g;
const EXPECTED_COLUMN_COUNT = 6;

export class DocumentParser {
  parse(html: string, tableId: string): ScrapedDocument[] {
    const $ = cheerio.load(html);
    const documents: ScrapedDocument[] = [];

    $(`[id="${tableId}"] tbody tr`).each((rowIndex, row) => {
      const cells = $(row).find('td');
      if (cells.length < EXPECTED_COLUMN_COUNT) {
        return;
      }

      const text = (cellIndex: number): string =>
        $(cells.get(cellIndex)).text().replace(/\s+/g, ' ').trim();
      const downloadParams = this.extractDownloadParams($(row).html() ?? '');
      const pdfUuid = downloadParams['param_uuid'] ?? '';
      if (!pdfUuid) {
        logger.warn(`Row ${rowIndex + 1}: could not find a PDF UUID.`);
      }

      documents.push({
        index: rowIndex + 1,
        caseNumber: text(1),
        company: text(2),
        facility: text(3),
        sector: text(4),
        resolution: text(5),
        pdfUuid,
        downloadParams,
      });
    });

    return documents;
  }

  private extractDownloadParams(rowHtml: string): Record<string, string> {
    const params: Record<string, string> = {};
    for (const match of rowHtml.matchAll(DOWNLOAD_PARAMS_PATTERN)) {
      params[match[1]] = match[2];
    }
    return params;
  }
}
