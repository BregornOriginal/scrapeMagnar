export interface ScrapedDocument {
  index: number;
  pageNumber: number;
  caseNumber: string;
  company: string;
  facility: string;
  sector: string;
  resolution: string;
  pdfUuid: string;
  downloadParams: Record<string, string>;
  filename?: string;
}
