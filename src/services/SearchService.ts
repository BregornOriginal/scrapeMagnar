import * as cheerio from 'cheerio';
import { HttpClient } from '../client/HttpClient';
import { Session } from '../session/Session';
import { ViewStateParser } from '../jsf/ViewStateParser';
import { PartialResponseParser, PartialUpdate } from '../jsf/PartialResponseParser';
import { JsfProtocolError } from '../jsf/JsfProtocolError';
import { logger } from '../logger/Logger';

export interface SearchResult {
  updates: PartialUpdate[];
}

interface FormState {
  formData: URLSearchParams;
  searchButtonName: string;
}

export class SearchService {
  private readonly viewStateParser = new ViewStateParser();
  private readonly partialResponseParser = new PartialResponseParser();

  constructor(
    private readonly http: HttpClient,
    private readonly session: Session,
  ) {}

  async search(criteria: Record<string, string> = {}): Promise<SearchResult> {
    logger.info('Starting session');
    const initialHtml = await this.fetchInitialPage();
    const formState = this.captureFormState(initialHtml);

    logger.info('Searching');
    const payload = this.buildSearchPayload(formState, criteria);
    const response = await this.http.post<string>('', payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Faces-Request': 'partial/ajax',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const updates = this.partialResponseParser.parse(response.data);
    this.updateViewStateFromUpdates(updates);

    return { updates };
  }

  private async fetchInitialPage(): Promise<string> {
    const response = await this.http.get<string>('');
    this.session.setViewState(this.viewStateParser.extract(response.data));
    return response.data;
  }

  private captureFormState(html: string): FormState {
    const $ = cheerio.load(html);
    const searchButton = $('[id$=":btnBuscar"], [name$=":btnBuscar"]').first();
    if (searchButton.length === 0) {
      throw new JsfProtocolError('Could not find the search button (btnBuscar) in the initial page.');
    }
    const searchButtonName = searchButton.attr('name') ?? searchButton.attr('id') ?? '';

    const formData = new URLSearchParams();
    $('form')
      .first()
      .find('input[name], select[name], textarea[name]')
      .each((_, element) => {
        const field = $(element);
        const name = field.attr('name');
        if (!name) {
          return;
        }

        const type = (field.attr('type') ?? '').toLowerCase();
        if (type === 'checkbox' || type === 'radio') {
          if (field.is(':checked')) {
            formData.set(name, field.attr('value') ?? 'on');
          }
          return;
        }

        formData.set(name, this.readFieldValue(field));
      });

    return { formData, searchButtonName };
  }

  private readFieldValue(field: cheerio.Cheerio<any>): string {
    const value = field.val();
    if (Array.isArray(value)) {
      return value.join(',');
    }
    return value?.toString() ?? '';
  }

  private buildSearchPayload(formState: FormState, criteria: Record<string, string>): URLSearchParams {
    const { formData, searchButtonName } = formState;

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

  private updateViewStateFromUpdates(updates: PartialUpdate[]): void {
    const viewStateUpdate = updates.find((update) => update.id.includes('ViewState'));
    if (viewStateUpdate) {
      this.session.setViewState(this.viewStateParser.extract(viewStateUpdate.content));
    }
  }
}
