import { SessionError } from './SessionError';

export class Session {
  private viewState: string | null = null;

  setViewState(viewState: string): void {
    this.viewState = viewState;
  }

  getViewState(): string {
    if (!this.viewState) {
      throw new SessionError('Missing ViewState: cannot continue without an active session.');
    }
    return this.viewState;
  }

  hasViewState(): boolean {
    return this.viewState !== null;
  }
}
