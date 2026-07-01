import 'dotenv/config';
import { HttpClient } from './client/HttpClient';
import { Session } from './session/Session';
import { SearchService } from './services/SearchService';
import { PaginationService } from './services/PaginationService';
import { PdfDownloadService, FailedDownload } from './services/PdfDownloadService';
import { JsonStorage } from './storage/JsonStorage';
import { PdfStorage } from './storage/PdfStorage';
import { ScrapedDocument } from './models/Document';
import { captureFormFields } from './jsf/JsfForm';
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

  // Each row's download link references its position in the table's
  // *currently rendered* page (e.g. "dt:3:j_idt63"), so PDFs for a page must
  // be downloaded right after that page is fetched, before navigating away.
  // Downloading them later (once a different page is "current" server-side)
  // makes the server reject those stale row references.
  for await (const pageDocuments of paginationService.fetchAllPages()) {
    const baseFormFields = captureFormFields(searchService.getInitialHtml());
    const { succeeded, failed } = await pdfDownloadService.downloadAll(pageDocuments, baseFormFields);

    for (const { document, buffer } of succeeded) {
      document.filename = await pdfStorage.save(document, buffer, document.pageNumber);
    }

    allDocuments.push(...pageDocuments);
    allFailed.push(...failed);

    await jsonStorage.save('documents.json', allDocuments.map(toPublicDocument));
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

function toPublicDocument(document: ScrapedDocument) {
  const { downloadParams: _downloadParams, ...publicFields } = document;
  return publicFields;
}

main().catch((error) => {
  logger.error(`Fatal error: ${(error as Error).message}`);
  process.exit(1);
});
