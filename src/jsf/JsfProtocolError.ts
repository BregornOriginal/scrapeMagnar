export class JsfProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JsfProtocolError';
  }
}
