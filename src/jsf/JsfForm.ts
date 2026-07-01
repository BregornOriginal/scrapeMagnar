import * as cheerio from 'cheerio';
import { JsfProtocolError } from './JsfProtocolError';
import { ViewStateParser } from './ViewStateParser';
import { PartialUpdate } from './PartialResponseParser';

const viewStateParser = new ViewStateParser();

export function captureFormFields(html: string): URLSearchParams {
  const $ = cheerio.load(html);
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

      const value = field.val();
      formData.set(name, Array.isArray(value) ? value.join(',') : (value?.toString() ?? ''));
    });

  return formData;
}

export function findIdentifierBySuffix(html: string, suffix: string): string {
  const $ = cheerio.load(html);
  const element = $(`[id$="${suffix}"], [name$="${suffix}"]`).first();
  const identifier = element.attr('name') ?? element.attr('id');
  if (!identifier) {
    throw new JsfProtocolError(`Could not find an element with suffix "${suffix}".`);
  }
  return identifier;
}

export function findIdentifierByClass(html: string, className: string): string {
  const $ = cheerio.load(html);
  const element = $(`.${className}`).first();
  const identifier = element.attr('id');
  if (!identifier) {
    throw new JsfProtocolError(`Could not find an element with class "${className}".`);
  }
  return identifier;
}

export function extractViewStateFromUpdates(updates: PartialUpdate[]): string | null {
  const update = updates.find((candidate) => candidate.id.includes('ViewState'));
  return update ? viewStateParser.extract(update.content) : null;
}
