import test from 'node:test';
import assert from 'node:assert/strict';
import { __testables } from '../src/minecraft/java-status.js';

const { encodeVarInt, decodeVarInt, flattenDescription } = __testables;

test('VarInt round-trips common Minecraft values', () => {
  for (const value of [0, 1, 127, 128, 255, 25565, 2147483647]) {
    const encoded = encodeVarInt(value);
    const decoded = decodeVarInt(encoded);
    assert.equal(decoded.value, value);
    assert.equal(decoded.size, encoded.length);
  }
});

test('decodeVarInt returns null for an incomplete value', () => {
  assert.equal(decodeVarInt(Buffer.from([0x80])), null);
});

test('flattenDescription supports strings and nested text components', () => {
  assert.equal(flattenDescription('Hello'), 'Hello');
  assert.equal(flattenDescription({ text: 'Hello ', extra: [{ text: 'world' }] }), 'Hello world');
  assert.equal(flattenDescription([{ text: 'Java ' }, { text: 'server' }]), 'Java server');
});
