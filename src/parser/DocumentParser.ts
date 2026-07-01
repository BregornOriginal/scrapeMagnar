import * as cheerio from 'cheerio';
import { ScrapedDocument } from '../models/Document';
import { logger } from '../logger/Logger';

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const EXPECTED_COLUMN_COUNT = 6;

export class DocumentParser {
  parse(html: string): ScrapedDocument[] {
    const $ = cheerio.load(html);
    const documents: ScrapedDocument[] = [];

    $('tbody tr').each((rowIndex, row) => {
      const cells = $(row).find('td');
      if (cells.length < EXPECTED_COLUMN_COUNT) {
        return;
      }

      const text = (cellIndex: number): string => $(cells.get(cellIndex)).text().trim();
      const pdfUuid = this.extractPdfUuid($(row).html() ?? '');
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
        pdfUuid: pdfUuid ?? '',
      });
    });

    return documents;
  }

  private extractPdfUuid(rowHtml: string): string | null {
    const match = rowHtml.match(UUID_PATTERN);
    return match ? match[0] : null;
  }
}
