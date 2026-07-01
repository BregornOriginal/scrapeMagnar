import { HttpClient } from './client/HttpClient';
import { Session } from './session/Session';
import { SearchService } from './services/SearchService';
import { PaginationService } from './services/PaginationService';
import { PdfDownloadService, FailedDownload } from './services/PdfDownloadService';
import { JsonStorage } from './storage/JsonStorage';
import { PdfStorage } from './storage/PdfStorage';
import { ScrapedDocument } from './models/Document';
import { logger } from './logger/Logger';

async function main(): Promise<void> {
  const http = new HttpClient();
  const session = new Session();
  const searchService = new SearchService(http, session);
  const paginationService = new PaginationService(http, session, searchService);
  const pdfDownloadService = new PdfDownloadService(http, session);
  const jsonStorage = new JsonStorage();
  const pdfStorage = new PdfStorage();

  const allDocuments: ScrapedDocument[] = [];
  const allFailed: FailedDownload[] = [];

  for await (const pageDocuments of paginationService.fetchAllPages()) {
    const { succeeded, failed } = await pdfDownloadService.downloadAll(pageDocuments);

    for (const { document, buffer } of succeeded) {
      document.filename = await pdfStorage.save(document, buffer);
    }

    allDocuments.push(...pageDocuments);
    allFailed.push(...failed);

    await jsonStorage.save('documents.json', allDocuments);
  }

  if (allFailed.length > 0) {
    await jsonStorage.save(
      'failed-downloads.json',
      allFailed.map(({ document, reason }) => ({
        caseNumber: document.caseNumber,
        pdfUuid: document.pdfUuid,
        reason,
      })),
    );
  }

  logger.info(`Done. ${allDocuments.length} documents processed, ${allFailed.length} downloads failed.`);
}

main().catch((error) => {
  logger.error(`Fatal error: ${(error as Error).message}`);
  process.exit(1);
});
