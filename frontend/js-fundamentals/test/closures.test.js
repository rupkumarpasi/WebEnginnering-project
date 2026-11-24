import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeCounter, memoize } from '../src/closures.js';

test('counter starts at 0 and increments/decrements via closure', () => {
  const counter = makeCounter();
  assert.equal(counter.value, 0);
  assert.equal(counter.inc(), 1);
  assert.equal(counter.inc(), 2);
  assert.equal(counter.value, 2);
  assert.equal(counter.dec(), 1);
  assert.equal(counter.value, 1);
});

test('counter supports custom start and independent instances', () => {
  const a = makeCounter(10);
  const b = makeCounter(-5);

  a.inc();
  assert.equal(a.value, 11);
  assert.equal(b.value, -5);
});

test('memoize caches results by argument and avoids recomputation', () => {
  let calls = 0;
  const double = memoize((x) => {
    calls += 1;
    return x * 2;
  });

  assert.equal(double(4), 8);
  assert.equal(double(4), 8);
  assert.equal(calls, 1);

  assert.equal(double(5), 10);
  assert.equal(calls, 2);
});