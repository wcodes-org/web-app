const assert = require('node:assert/strict');
const { Core } = require('../Root/JS/wcode-core.js');
const dict = { getWord: i => 'w' + i, getIndex: s => /^w\d+$/.test(s) && +s.slice(1) < 1024 ? +s.slice(1) : -1 };
for (const checksum of [false, true]) {
 const core = new Core(dict, {checksum});
 const cases = ['0','00','0001','911','112','07911123456','+14155552671','+442079460000','+123456789012345','*123#','*#06#','##002#','+*123#','+18005550199,123#','123;456','9'.repeat(256)];
 let seed = 21;
 for (let i=0;i<1000;i++) {
  let s = i % 2 ? '+' : '';
  const alphabet = i % 3 ? '0123456789' : '0123456789*#,;';
  s += '0';
  for(let j=0;j<i%60;j++) {seed=(Math.imul(seed,1664525)+1013904223)>>>0; s+=alphabet[seed%alphabet.length];}
  cases.push(s);
 }
 for(const input of cases) {
  const result = core.encodeByType('phone', input);
  assert.ok(result.wordCount <= core.encode(new TextEncoder().encode(input)).wordCount);
  assert.equal(core.decodeByType('auto', result.message).data,input);
 }
 assert.equal(core.decodeByType('auto',core.encodeByType('phone',' +1 (415) 555-2671 ').message).data,'+14155552671');
 for(const bad of ['', '+', '*#', '12+34', '12abc', '1/2', '9'.repeat(257)]) assert.throws(()=>core.encodeByType('phone',bad));
 for(const bytes of [[255],[255,2,1],[255,1,0,1],[255,1,2]]) assert.throws(()=>core.decodeByType('auto',core.encode(bytes).message));
 for(const input of ['hello','911','+14155552671','*123#']) assert.equal(core.decodeByType('auto',core.encode(new TextEncoder().encode(input)).message).data,input);
 assert.equal(core.encodeByType('auto','+14155552671').type,'phone');
 assert.equal(core.encodeByType('auto','*123#').type,'phone');
 assert.equal(core.encodeByType('auto','1234567').type,'number');
 if(!checksum) for(const input of cases.slice(0,15)) console.log(input,core.encodeByType('phone',input).wordCount,core.encode(new TextEncoder().encode(input)).wordCount);
}
console.log('Phone codec: round trips, normalization, validation, legacy UTF-8, and CRC passed');
