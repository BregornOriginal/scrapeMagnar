import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { config } from '../config';

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

  get<T = unknown>(url: string, requestConfig?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, requestConfig);
  }

  post<T = unknown>(
    url: string,
    body?: unknown,
    requestConfig?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, body, requestConfig);
  }
}
