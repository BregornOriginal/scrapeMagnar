import { HttpClient } from '../client/HttpClient';
import { Session } from '../session/Session';
import { SearchService } from './SearchService';
import { DocumentParser } from '../parser/DocumentParser';
import { PartialResponseParser, PartialUpdate } from '../jsf/PartialResponseParser';
import { findIdentifierByClass, extractViewStateFromUpdates } from '../jsf/JsfForm';
import { ScrapedDocument } from '../models/Document';
import { config } from '../config';
import { logger } from '../logger/Logger';

export class PaginationService {
  private readonly partialResponseParser = new PartialResponseParser();

  constructor(
    private readonly http: HttpClient,
    private readonly session: Session,
    private readonly searchService: SearchService,
    private readonly documentParser: DocumentParser = new DocumentParser(),
  ) {}

  async *fetchAllPages(): AsyncGenerator<ScrapedDocument[]> {
    const { initialHtml, updates: firstPageUpdates } = await this.searchService.search();
    const tableId = findIdentifierByClass(initialHtml, 'ui-datatable');

    let offset = 0;
    let pageNumber = 1;
    let updates = firstPageUpdates;

    while (true) {
      logger.info(`Page ${pageNumber}`);
      const html = updates.map((update) => update.content).join('');
      const documents = this.documentParser.parse(html, tableId);

      if (documents.length === 0) {
        logger.info('No documents found, stopping pagination.');
        return;
      }

      logger.info(`${documents.length} documents found`);
      yield documents;

      if (config.maxPages > 0 && pageNumber >= config.maxPages) {
        logger.info(`Reached configured MAX_PAGES limit (${config.maxPages}).`);
        return;
      }

      offset += config.pageSize;
      pageNumber += 1;
      updates = await this.fetchPage(tableId, offset);
    }
  }

  private async fetchPage(tableId: string, offset: number): Promise<PartialUpdate[]> {
    const formData = new URLSearchParams();
    formData.set('javax.faces.partial.ajax', 'true');
    formData.set('javax.faces.source', tableId);
    formData.set('javax.faces.partial.execute', '@all');
    formData.set('javax.faces.partial.render', '@all');
    formData.set('javax.faces.behavior.event', 'page');
    formData.set(`${tableId}_pagination`, 'true');
    formData.set(`${tableId}_first`, String(offset));
    formData.set(`${tableId}_rows`, String(config.pageSize));
    formData.set('javax.faces.ViewState', this.session.getViewState());

    const response = await this.http.post<string>('', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Faces-Request': 'partial/ajax',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const updates = this.partialResponseParser.parse(response.data);
    const updatedViewState = extractViewStateFromUpdates(updates);
    if (updatedViewState) {
      this.session.setViewState(updatedViewState);
    } else {
      logger.warn(`Page ${offset / config.pageSize + 2}: response did not include an updated ViewState.`);
    }

    return updates;
  }
}
