import { HttpClient } from '../client/HttpClient';
import { Session } from '../session/Session';
import { ViewStateParser } from '../jsf/ViewStateParser';
import { PartialResponseParser, PartialUpdate } from '../jsf/PartialResponseParser';
import { captureFormFields, findIdentifierBySuffix, extractViewStateFromUpdates } from '../jsf/JsfForm';
import { logger } from '../logger/Logger';

export interface SearchResult {
  initialHtml: string;
  updates: PartialUpdate[];
}

export class SearchService {
  private readonly viewStateParser = new ViewStateParser();
  private readonly partialResponseParser = new PartialResponseParser();
  private lastInitialHtml: string | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly session: Session,
  ) {}

  getInitialHtml(): string {
    if (!this.lastInitialHtml) {
      throw new Error('Initial page has not been fetched yet. Call search() first.');
    }
    return this.lastInitialHtml;
  }

  async search(criteria: Record<string, string> = {}): Promise<SearchResult> {
    logger.info('Starting session');
    const initialHtml = await this.fetchInitialPage();

    logger.info('Searching');
    const payload = this.buildSearchPayload(initialHtml, criteria);
    const response = await this.http.post<string>('', payload, {
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
    }

    return { initialHtml, updates };
  }

  private async fetchInitialPage(): Promise<string> {
    const response = await this.http.get<string>('');
    this.session.setViewState(this.viewStateParser.extract(response.data));
    this.lastInitialHtml = response.data;
    return response.data;
  }

  private buildSearchPayload(initialHtml: string, criteria: Record<string, string>): URLSearchParams {
    const formData = captureFormFields(initialHtml);
    const searchButtonName = findIdentifierBySuffix(initialHtml, ':btnBuscar');

    for (const [name, value] of Object.entries(criteria)) {
      formData.set(name, value);
    }

    formData.set('javax.faces.partial.ajax', 'true');
    formData.set('javax.faces.source', searchButtonName);
    formData.set('javax.faces.partial.execute', '@all');
    formData.set('javax.faces.partial.render', '@all');
    formData.set(searchButtonName, searchButtonName);
    formData.set('javax.faces.ViewState', this.session.getViewState());

    return formData;
  }
}
