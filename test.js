const fs = require('fs');
const assert = require('assert');
const { JSDOM } = require('jsdom');

const overlayCode = fs.readFileSync(require.resolve('./overlay.js'), 'utf8');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  runScripts: 'dangerously',
  pretendToBeVisual: true
});

dom.window.eval(overlayCode);
dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));

const root = dom.window.document.getElementById('overlay-root');
assert(root, 'overlay root should exist');

dom.window.dispatchEvent(new dom.window.MessageEvent('message', { data: { text: 'Hello', visible: true } }));
const textEl = dom.window.document.getElementById('overlay-text');
assert.strictEqual(textEl.textContent, 'Hello', 'text should update from postMessage');

console.log('overlay script initialized and handled message');
process.exit(0);
