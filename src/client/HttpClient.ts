import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { config } from '../config';
import { logger } from '../logger/Logger';
import { HttpError } from './HttpError';

export class HttpClient {
  private readonly instance: AxiosInstance;
  private readonly jar: CookieJar;

  constructor(baseURL: string = config.baseUrl) {
    this.jar = new CookieJar();
    this.instance = wrapper(
      axios.create({
        baseURL,
        jar: this.jar,
      }),
    );
  }

  getCookieJar(): CookieJar {
    return this.jar;
  }

  async get<T = unknown>(url: string, requestConfig?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    logger.info(`GET ${url}`);
    try {
      return await this.instance.get<T>(url, requestConfig);
    } catch (error) {
      throw this.toHttpError(error, 'GET', url);
    }
  }

  async post<T = unknown>(
    url: string,
    body?: unknown,
    requestConfig?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    logger.info(`POST ${url}`);
    try {
      return await this.instance.post<T>(url, body, requestConfig);
    } catch (error) {
      throw this.toHttpError(error, 'POST', url);
    }
  }

  private toHttpError(error: unknown, method: string, url: string): HttpError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      return new HttpError(`${method} ${url} failed with status ${status ?? 'unknown'}`, status, url);
    }
    const message = error instanceof Error ? error.message : String(error);
    return new HttpError(`${method} ${url} failed: ${message}`, undefined, url);
  }
}
