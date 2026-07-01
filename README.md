# scrapeMagnar

A TypeScript scraper for JSF (Java Server Faces) applications, without browser automation. It navigates paginated results, extracts documents, and downloads the associated PDFs using plain HTTP requests only.

## Constraints

- Browser automation libraries (Playwright, Puppeteer, Selenium, etc.) are forbidden.
- Only direct HTTP requests are allowed.

## Stack

- **Core:** TypeScript, Node.js, Axios
- **Parsing:** Cheerio, fast-xml-parser
- **HTTP/Session:** axios-cookiejar-support, tough-cookie
- **Utilities:** fs/promises, path
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

All configuration is handled through environment variables (with defaults), in `src/config.ts`:

| Variable            | Description                                | Default  |
| ------------------- | ------------------------------------------- | -------- |
| `BASE_URL`          | Base URL of the target JSF site             | `''`     |
| `PAGE_SIZE`         | Number of rows per page                     | `10`     |
| `DOWNLOAD_DELAY_MS` | Delay between PDF downloads                 | `1000`   |
| `MAX_RETRIES`       | Maximum retries for transient failures      | `5`      |
| `MAX_PAGES`         | Page limit to traverse (`0` = no limit)     | `0`      |
| `OUTPUT_FOLDER`     | Output folder for metadata and PDFs         | `output` |

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

## Output

- `output/documents.json`: metadata of the extracted documents.
- `output/pdfs/`: downloaded PDFs.
- `output/failed-downloads.json`: downloads that exhausted all retries.

## Project status

Under incremental, phase-by-phase development (see Pull Request history). Each phase adds a functional layer: HTTP client, session, JSF parsers, pagination, PDF download, retry policy, and persistence.
