export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number | undefined,
    public readonly url: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
