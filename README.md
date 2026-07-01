# scrapeMagnar

A TypeScript scraper for JSF (Java Server Faces) applications, without browser automation. It navigates paginated results, extracts documents, and downloads the associated PDFs using plain HTTP requests only.

## Constraints

- Browser automation libraries (Playwright, Puppeteer, Selenium, etc.) are forbidden.
- Only direct HTTP requests are allowed.

## Stack

- **Core:** TypeScript, Node.js, Axios
- **Parsing:** Cheerio, fast-xml-parser
- **HTTP/Session:** axios-cookiejar-support, tough-cookie
- **Utilities:** fs/promises, path, dotenv
- **Logging:** custom logger, no external dependencies

## Project structure

```
src/
  client/           HTTP client (Axios + cookie jar)
  session/          Session handling (JSESSIONID, ViewState)
  jsf/              JSF protocol parsers (ViewState, partial-response XML)
  parser/           HTML-to-domain-model parser (Cheerio)
  services/         Search, pagination and PDF download
  retry/            Retry policy with backoff
  storage/          Metadata (JSON) and PDF persistence
  logger/           Simple logger (INFO / WARN / ERROR)
  models/           Data models
  config.ts         Centralized configuration (no magic numbers)
  main.ts           Entry point
```

## Configuration

All configuration is handled through environment variables (with defaults), in `src/config.ts`. Copy `.env.example` to `.env` and adjust as needed — it's loaded automatically on startup, no manual `export` required:

```bash
cp .env.example .env
```

| Variable            | Description                                          | Default                                                          |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `BASE_URL`          | Base URL of the target JSF site                       | `https://publico.oefa.gob.pe/repdig/consulta/consultaTfa.xhtml` |
| `PAGE_SIZE`         | Number of rows requested per page                     | `10`                                                             |
| `DOWNLOAD_DELAY_MS` | Delay between PDF downloads                           | `1000`                                                           |
| `MAX_RETRIES`       | Maximum retries for transient failures (e.g. HTTP 429)| `5`                                                               |
| `MAX_PAGES`         | Page limit to traverse (`0` = no limit)               | `0`                                                               |
| `OUTPUT_FOLDER`     | Output folder for metadata and PDFs                   | `output`                                                         |

## Usage

Install dependencies:

```bash
npm install
```

Development mode:

```bash
npm run dev
```

Build and run:

```bash
npm run build
npm start
```

To do a quick smoke test against only the first page of results, set `MAX_PAGES=1` (either in `.env` or inline):

```bash
MAX_PAGES=1 npm run dev
```

## Output

- `output/documents.json`: metadata of every extracted document (case number, company, facility, sector, resolution, PDF UUID, page number and saved PDF path).
- `output/pdfs/page-N/`: downloaded PDFs, grouped in one folder per result page.
- `output/failed-downloads.json`: downloads that exhausted all retries, if any.

Metadata is saved incrementally after each page, so partial progress is preserved even if the process is interrupted.

## Project status

Feature-complete: session/cookie handling, JSF ViewState + AJAX partial-response protocol, search, offset-based pagination, PDF download with retry/backoff, and JSON/PDF persistence. Built and verified incrementally through Pull Requests, and validated end-to-end against the live target site.
