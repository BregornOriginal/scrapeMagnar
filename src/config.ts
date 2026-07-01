export const config = {
  baseUrl: process.env.BASE_URL ?? 'https://publico.oefa.gob.pe/repdig/consulta/consultaTfa.xhtml',
  pageSize: Number(process.env.PAGE_SIZE ?? 10),
  downloadDelayMs: Number(process.env.DOWNLOAD_DELAY_MS ?? 1000),
  maxRetries: Number(process.env.MAX_RETRIES ?? 5),
  maxPages: Number(process.env.MAX_PAGES ?? 0), // 0 = no limit
  outputFolder: process.env.OUTPUT_FOLDER ?? 'output',
} as const;
