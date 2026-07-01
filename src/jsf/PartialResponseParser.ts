import { XMLParser } from 'fast-xml-parser';
import { JsfProtocolError } from './JsfProtocolError';

export interface PartialUpdate {
  id: string;
  content: string;
}

interface RawUpdate {
  '@_id'?: string;
  __cdata?: string | string[];
}

export class PartialResponseParser {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    cdataPropName: '__cdata',
  });

  parse(xml: string): PartialUpdate[] {
    const parsed = this.parser.parse(xml);
    const response = parsed['partial-response'];
    if (!response) {
      throw new JsfProtocolError('Invalid partial-response XML: missing root element.');
    }

    if (response.error) {
      const name = this.extractText(response.error['error-name']) || 'Unknown error';
      const message = this.extractText(response.error['error-message']);
      throw new JsfProtocolError(`JSF partial-response error: ${name} ${message}`.trim());
    }

    const rawUpdates = response.changes?.update;
    if (!rawUpdates) {
      return [];
    }

    const updates: RawUpdate[] = Array.isArray(rawUpdates) ? rawUpdates : [rawUpdates];

    return updates.map((update) => ({
      id: update['@_id'] ?? '',
      content: this.extractContent(update),
    }));
  }

  private extractContent(update: RawUpdate): string {
    return this.extractText(update.__cdata);
  }

  private extractText(value: unknown): string {
    if (value === undefined || value === null) {
      return '';
    }
    if (typeof value === 'object' && '__cdata' in value) {
      return this.extractText((value as RawUpdate).__cdata);
    }
    return Array.isArray(value) ? value.join('') : String(value);
  }
}
