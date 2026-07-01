import { HttpClient } from '../client/HttpClient';
import { Session } from '../session/Session';
import { RetryPolicy } from '../retry/RetryPolicy';
import { ScrapedDocument } from '../models/Document';
import { config } from '../config';
import { logger } from '../logger/Logger';

export interface DownloadedPdf {
  document: ScrapedDocument;
  buffer: Buffer;
}

export interface FailedDownload {
  document: ScrapedDocument;
  reason: string;
}

export interface DownloadAllResult {
  succeeded: DownloadedPdf[];
  failed: FailedDownload[];
}

export class PdfDownloadService {
  constructor(
    private readonly http: HttpClient,
    private readonly session: Session,
    private readonly retryPolicy: RetryPolicy = new RetryPolicy(),
  ) {}

  async downloadAll(documents: ScrapedDocument[], baseFormFields: URLSearchParams): Promise<DownloadAllResult> {
    const succeeded: DownloadedPdf[] = [];
    const failed: FailedDownload[] = [];

    for (const document of documents) {
      logger.info(`Downloading ${document.caseNumber}`);
      try {
        const buffer = await this.retryPolicy.execute(
          () => this.downloadOne(document, baseFormFields),
          `download ${document.caseNumber}`,
        );
        succeeded.push({ document, buffer });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        logger.error(`Download failed for ${document.caseNumber}: ${reason}`);
        failed.push({ document, reason });
      }
      await this.delay(config.downloadDelayMs);
    }

    return { succeeded, failed };
  }

  private async downloadOne(document: ScrapedDocument, baseFormFields: URLSearchParams): Promise<Buffer> {
    const formData = new URLSearchParams(baseFormFields);
    for (const [key, value] of Object.entries(document.downloadParams)) {
      formData.set(key, value);
    }
    formData.set('javax.faces.ViewState', this.session.getViewState());

    const response = await this.http.post<ArrayBuffer>('', formData, {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    });

    const contentType = String(response.headers['content-type'] ?? '');
    if (!contentType.includes('application/octet-stream') && !contentType.includes('application/pdf')) {
      throw new Error(`Unexpected content-type for PDF download: ${contentType || 'unknown'}`);
    }

    return Buffer.from(response.data);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
