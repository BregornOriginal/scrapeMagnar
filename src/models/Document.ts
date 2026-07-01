export interface ScrapedDocument {
  index: number;
  caseNumber: string;
  company: string;
  facility: string;
  sector: string;
  resolution: string;
  pdfUuid: string;
  filename?: string;
}
