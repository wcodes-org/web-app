// A code written with a retired word (wordlist v3) decodes exactly like one with its replacement (v4).
const assert = require('node:assert/strict');
const { Core } = require('../Root/JS/wcode-core.js');
const dict = require('../Root/JS/wordlist.js');

assert.equal(dict.version, 4);
assert.equal(dict.getWord(235), 'comet');
assert.equal(dict.getIndex('death'), dict.getIndex('comet'));
assert.equal(dict.getIndex(' Death '), 235);
assert.ok(!dict.suggest('dea').includes('death'));
assert.equal(Object.keys(dict.RETIRED).length, 28);
// Final v4 words (after the Codex review); unpublished drafts are not aliases.
for (const [old, word, i] of [['lead', 'crystal', 468], ['prison', 'burger', 685], ['rifle', 'puzzle', 720], ['trouser', 'microphone', 934], ['wind', 'sunrise', 1000], ['wound', 'sticker', 1014]]) {
  assert.equal(dict.getWord(i), word);
  assert.equal(dict.getIndex(old), i);
}
for (const draft of ['capsule', 'diagram', 'textile', 'emblem']) assert.ok(!(draft in dict.RETIRED) && !dict.WORDS.includes(draft), draft);
for (const word of Object.keys(dict.RETIRED)) {
  assert.equal(dict.getIndex(word), dict.RETIRED[word]);
  assert.ok(!dict.WORDS.includes(word), word + ' must not be encoded');
}

for (const checksum of [false, true]) {
  const core = new Core(dict, { checksum });
  let seed = 7;
  let found = 0;
  for (let i = 0; i < 20000 && found < 5; i++) {
    const bytes = new Uint8Array(4 + (i % 12));
    for (let j = 0; j < bytes.length; j++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; bytes[j] = seed >>> 24; }
    const encoded = core.encode(bytes);
    for (const w of encoded.words) assert.ok(dict.WORDS.includes(w), 'encoder used a non-current word: ' + w);
    if (!encoded.words.includes('comet')) continue;
    found++;
    const oldMessage = encoded.words.map(w => (w === 'comet' ? 'death' : w)).join(' ');
    assert.notEqual(oldMessage, encoded.message);
    assert.deepEqual(core.decode(oldMessage), core.decode(encoded.message));
  }
  assert.ok(found > 0, 'no sample code contained comet');

}
console.log("Wordlist aliases: a code with 'death' decodes the same as one with 'comet'; encoder uses only v4 words");
