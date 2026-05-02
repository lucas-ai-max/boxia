import { EventEmitter } from 'node:events';

export type SessionEvent =
  | { type: 'status'; sessionId: string; status: 'queued' | 'processing' | 'ready' | 'failed' }
  | { type: 'step'; sessionId: string; step: string; done: boolean }
  | { type: 'progress'; sessionId: string; pct: number }
  | { type: 'caixinhas-extracted'; sessionId: string; total: number };

class SessionBus extends EventEmitter {
  emitFor(sessionId: string, ev: SessionEvent) {
    this.emit(`session:${sessionId}`, ev);
  }

  onSession(sessionId: string, listener: (ev: SessionEvent) => void) {
    const channel = `session:${sessionId}`;
    this.on(channel, listener);
    return () => this.off(channel, listener);
  }
}

export const sessionBus = new SessionBus();
sessionBus.setMaxListeners(0);
