import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

// public/ask-widget.js is a classic no-build browser script (an IIFE), so it has no
// import seam. This runs the REAL file against a minimal DOM double and a real
// Response/ReadableStream body; only the DOM surface the widget touches is faked.

const source = readFileSync(new URL('./public/ask-widget.js', import.meta.url), 'utf8');

class El {
  textContent = '';
  innerHTML = '';
  value = '';
  disabled = false;
  hidden = false;
  handlers: Record<string, (ev: unknown) => void> = {};
  classList = { add() {} };
  setAttribute() {}
  appendChild() {}
  addEventListener(type: string, fn: (ev: unknown) => void) {
    this.handlers[type] = fn;
  }
}

async function ask(chunks: string[]) {
  const els: Record<string, El> = {};
  for (const c of ['.vjask-form', '.vjask-input', '.vjask-btn', '.vjask-answer', '.vjask-sources', '.vjask-label']) {
    els[c] = new El();
  }
  const root = Object.assign(new El(), {
    querySelector: (sel: string) => els[sel] ?? null,
  });
  const enc = new TextEncoder();
  const fetchStub = async () =>
    new Response(
      new ReadableStream({
        start(c) {
          for (const ch of chunks) c.enqueue(enc.encode(ch));
          c.close();
        },
      }),
      { status: 200, headers: { 'content-type': 'text/event-stream' } },
    );
  const script = { getAttribute: (n: string) => (n === 'data-endpoint' ? 'https://x.test/ask' : null) };
  const document = {
    currentScript: script,
    readyState: 'complete',
    querySelector: () => root,
    createElement: () => new El(),
  };
  runInNewContext(source, {
    document,
    window: {},
    fetch: fetchStub,
    TextDecoder,
    Promise,
    JSON,
    setTimeout,
    setInterval,
    clearInterval,
  });
  els['.vjask-input'].value = 'q';
  els['.vjask-form'].handlers.submit({ preventDefault() {} });
  for (let i = 0; i < 200 && (els['.vjask-btn'].disabled || i === 0); i++) {
    await new Promise((r) => setTimeout(r, 5));
  }
  return { answer: els['.vjask-answer'].textContent, btnDisabled: els['.vjask-btn'].disabled };
}

const delta = (t: string) => `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`;

describe('ask-widget stream handling', () => {
  it('control: renders a normal stream', async () => {
    const r = await ask([delta('hello '), delta('world'), 'data: [DONE]\n\n']);
    expect(r.answer).toBe('hello world');
    expect(r.btnDisabled).toBe(false);
  });

  it('renders a final event that has no trailing blank line', async () => {
    const r = await ask([delta('hello '), `data: ${JSON.stringify({ choices: [{ delta: { content: 'tail' } }] })}`]);
    expect(r.answer).toBe('hello tail');
  });

  it('joins multi-line data fields of one event', async () => {
    const r = await ask(['data: {"choices":\ndata: [{"delta":{"content":"multi"}}]}\n\n']);
    expect(r.answer).toBe('multi');
  });

  it('shows the error of an error event on a 200 stream instead of a blank answer', async () => {
    const r = await ask(['event: error\ndata: {"error":"generation_failed"}\n\n']);
    expect(r.answer).toContain('generation_failed');
  });

  it('never leaves the answer blank when the stream ends with no content', async () => {
    const r = await ask(['event: ping\ndata: {}\n\n', 'data: [DONE]\n\n']);
    expect(r.answer.trim()).not.toBe('');
  });
});
