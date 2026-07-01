import * as cheerio from 'cheerio';
import { JsfProtocolError } from './JsfProtocolError';

export class ViewStateParser {
  extract(html: string): string {
    const $ = cheerio.load(html);
    const viewState = $('input[name="javax.faces.ViewState"]').first().attr('value');
    if (!viewState) {
      throw new JsfProtocolError('Missing javax.faces.ViewState in response.');
    }
    return viewState;
  }
}
