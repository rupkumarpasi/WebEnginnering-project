import { describe, expect, it, vi } from 'vitest';
import { requireJson } from '../../src/middleware/require-json.js';
import { validateIdParam } from '../../src/middleware/validate-id.js';

// Middleware are just functions: call them with fake req/res/next and check what `next` received.

describe('requireJson', () => {
  const fakeReq = (method, isJson) => ({ method, is: () => (isJson ? 'application/json' : false) });

  it('lets GET through without a body', () => {
    const next = vi.fn();
    requireJson(fakeReq('GET', false), {}, next);
    expect(next).toHaveBeenCalledWith(); // called with NO error
  });

  it('lets a JSON POST through', () => {
    const next = vi.fn();
    requireJson(fakeReq('POST', true), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it.each(['POST', 'PUT', 'PATCH'])('rejects a non-JSON %s with 415', (method) => {
    const next = vi.fn();
    requireJson(fakeReq(method, false), {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 415 });
  });
});

describe('validateIdParam', () => {
  it('accepts a UUID', () => {
    const next = vi.fn();
    validateIdParam({}, {}, next, '15cfde80-9253-4e58-a113-a87a9e67498a');
    expect(next).toHaveBeenCalledWith();
  });

  it.each(['123', 'abc', '15cfde80-9253-4e58-a113'])('rejects %s with 400', (id) => {
    const next = vi.fn();
    validateIdParam({}, {}, next, id);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 400, detail: 'id must be a valid UUID' });
  });
});