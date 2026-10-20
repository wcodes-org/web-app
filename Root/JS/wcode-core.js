/**
 * WCode Core Engine
 * Bit-level encoding and decoding implementation of WCode Base-1024
 * Legacy byte transport matches C++/Java; typed phone payloads require codec v1.
 */
(function(global) {
  'use strict';

  const POLYVAL = 0x8C; // X^8 + X^5 + X^4 + 1
  const INDEX_BITS = 10;
  const BYTE_BITS = 8;

  function crc8(byteArray) {
    let crc = 0;
    for (let i = 0; i < byteArray.length; i++) {
      let x = byteArray[i];
      for (let j = 0; j < 8; j++) {
        if (((crc ^ x) & 1) !== 0) {
          crc = ((crc >> 1) ^ POLYVAL) & 0xFF;
        } else {
          crc = (crc >> 1) & 0xFF;
        }
        x >>= 1;
      }
    }
    return crc;
  }

  function getBitSize(val) {
    if (val <= 0) return 0;
    for (let i = 0; i < 32; i++) {
      if ((0x80000000 & (val << i)) !== 0) {
        return 32 - i;
      }
    }
    return 0;
  }

  function textToBytes(str) {
    return new TextEncoder().encode(str);
  }

  function bytesToText(bytes) {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }

  function bigIntToBytes(bi) {
    if (bi === 0n) return new Uint8Array([0]);
    let hex = bi.toString(16);
    if (hex.length % 2 !== 0) hex = '0' + hex;
    const len = hex.length / 2;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    // Java BigInteger toByteArray() two's-complement sign bit convention
    if (bytes[0] & 0x80) {
      const padded = new Uint8Array(len + 1);
      padded[0] = 0;
      padded.set(bytes, 1);
      bytes = padded;
    }
    return bytes;
  }

  function bytesToBigInt(bytes) {
    if (!bytes || bytes.length === 0) return 0n;
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return BigInt('0x' + hex);
  }

  // 0xFF is impossible in a valid UTF-8 payload. The next byte versions the codec.
  const PHONE_MARKER = [0xFF, 0x01];
  const DIAL_ALPHABET = '0123456789*#,;';

  function normalizePhone(raw) {
    const value = String(raw).trim().replace(/[\s().-]/g, '');
    if (!/^\+?[0-9*#,;]+$/.test(value) || !/[0-9]/.test(value)) {
      throw new Error('Enter digits with an optional leading + and dial controls * # , ;');
    }
    if (value.length > 257) throw new Error('Dial strings are limited to 256 symbols');
    return value;
  }

  function encodePhone(raw) {
    const normalized = normalizePhone(raw);
    const plus = normalized.startsWith('+');
    const body = plus ? normalized.slice(1) : normalized;
    if (body.length > 256) throw new Error('Dial strings are limited to 256 symbols');
    const extended = /[*#,;]/.test(body);
    const radix = extended ? 14n : 10n;
    // Bijective digits (1..radix), minus one: dense ranks for all nonempty strings.
    let rank = 0n;
    for (const symbol of body) rank = rank * radix + BigInt(DIAL_ALPHABET.indexOf(symbol) + 1);
    const packed = ((rank - 1n) << 2n) | BigInt((extended ? 2 : 0) + (plus ? 1 : 0));
    let hex = packed.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    const bytes = new Uint8Array(2 + hex.length / 2);
    bytes.set(PHONE_MARKER);
    for (let i = 0; i < hex.length; i += 2) bytes[2 + i / 2] = parseInt(hex.slice(i, i + 2), 16);
    return { bytes, normalized };
  }

  function decodePhone(bytes) {
    if (bytes.length < 3 || bytes[1] !== PHONE_MARKER[1]) throw new Error('Unsupported phone encoding version');
    if (bytes.length > 125 || (bytes.length > 3 && bytes[2] === 0)) throw new Error('Invalid phone payload');
    const packed = bytesToBigInt(bytes.slice(2));
    const mode = Number(packed & 3n);
    const radix = mode & 2 ? 14n : 10n;
    let rank = (packed >> 2n) + 1n;
    let body = '';
    while (rank > 0n) {
      rank -= 1n;
      body = DIAL_ALPHABET[Number(rank % radix)] + body;
      rank /= radix;
      if (body.length > 256) throw new Error('Invalid phone payload');
    }
    const value = (mode & 1 ? '+' : '') + body;
    const canonical = encodePhone(value).bytes;
    if (canonical.length !== bytes.length || canonical.some((v, i) => v !== bytes[i])) throw new Error('Noncanonical phone payload');
    return value;
  }

  class WCodeCore {
    constructor(dictionary, options = {}) {
      this.dict = dictionary || (typeof window !== 'undefined' ? window.WCodeDictionary : null);
      if (!this.dict) {
        throw new Error('WCodeDictionary is required');
      }
      this.bChecksum = !!options.checksum;
    }

    setChecksum(enabled) {
      this.bChecksum = !!enabled;
    }

    encode(byteArray, lbBlock = 8) {
      if (!(byteArray instanceof Uint8Array)) {
        byteArray = new Uint8Array(byteArray);
      }
      const lByteData = byteArray.length;
      const lBitTrail = 0;
      const nBlock = Math.floor((lByteData * BYTE_BITS) / lbBlock);

      const code = [0];
      let iCodeElement = 0;
      let iCodeBit = 0;

      const setBits = (data, bitSz) => {
        data = data & (0xFFFFFFFF >>> (32 - bitSz));
        if (iCodeBit + bitSz > INDEX_BITS) {
          const lBitNxt = iCodeBit + bitSz - INDEX_BITS;
          const bfr = (data >>> lBitNxt);
          code[iCodeElement] |= bfr;
          code[++iCodeElement] = 0;
          const rem = data & ((1 << lBitNxt) - 1);
          code[iCodeElement] |= rem << (INDEX_BITS - lBitNxt);
          iCodeBit = lBitNxt;
        } else {
          const lBitLft = INDEX_BITS - (iCodeBit + bitSz);
          code[iCodeElement] |= (data << lBitLft);
          iCodeBit += bitSz;
          if (iCodeBit === INDEX_BITS) {
            code[++iCodeElement] = 0;
            iCodeBit = 0;
          }
        }
      };

      // Header: checksum
      if (this.bChecksum) {
        const csum = crc8(byteArray);
        setBits(csum, BYTE_BITS);
      }

      // Header: trailing blocks
      const maxNTrailBlock = Math.floor(INDEX_BITS / lbBlock);
      const lbMaxTrailingBlocks = getBitSize(maxNTrailBlock);
      const tlVb = (iCodeBit + lbMaxTrailingBlocks + lbBlock * nBlock) % INDEX_BITS;
      const nTrailingBlocks = tlVb !== 0 ? Math.floor((INDEX_BITS - tlVb) / lbBlock) : 0;

      setBits(nTrailingBlocks, lbMaxTrailingBlocks);

      // Data payload
      for (let i = 0; i < lByteData - 1; i++) {
        setBits(byteArray[i], BYTE_BITS);
      }
      if (lByteData > 0) {
        setBits(byteArray[lByteData - 1] >>> lBitTrail, BYTE_BITS - lBitTrail);
      }

      const nCode = (iCodeBit !== 0) ? iCodeElement + 1 : iCodeElement;
      const words = [];
      for (let i = 0; i < nCode; i++) {
        const word = this.dict.getWord(code[i]);
        if (!word) {
          throw new Error('Failed to resolve word for index ' + code[i]);
        }
        words.push(word);
      }

      return {
        words,
        message: words.join(' '),
        formatted: `\\ ${words.join(' ')} /`,
        wordCount: words.length,
        bitCount: words.length * INDEX_BITS,
        hasChecksum: this.bChecksum
      };
    }

    decode(message, lbBlock = 8) {
      if (typeof message !== 'string') {
        throw new Error('Message must be a string of words');
      }

      // Sanitize input: swallow leading/trailing slashes, dashes/hyphens, and spaces
      const cleanMsg = message
        .replace(/^[\s\\/\-]+|[\s\\/\-]+$/g, '')
        .replace(/[\\\/,;.–—\-]/g, ' ')
        .trim()
        .toLowerCase();
      const tokens = cleanMsg.split(/\s+/).filter(t => t.length > 0);

      if (tokens.length === 0) {
        throw new Error('No words entered');
      }

      const nCode = tokens.length;
      const code = [];
      const invalidWords = [];

      for (let i = 0; i < nCode; i++) {
        const token = tokens[i];
        const idx = this.dict.getIndex(token);
        if (idx === -1) {
          invalidWords.push(token);
        } else {
          code.push(idx);
        }
      }

      if (invalidWords.length > 0) {
        throw new Error(`Word(s) not in dictionary: ${invalidWords.join(', ')}`);
      }

      let iCodeElement = 0;
      let iCodeBit = 0;

      const getBits = (bitSz) => {
        let result = 0;
        if (iCodeBit + bitSz > INDEX_BITS) {
          const lBitNxt = iCodeBit + bitSz - INDEX_BITS;
          const bfr = (code[iCodeElement] << lBitNxt) & ((1 << bitSz) - 1);
          result = bfr;
          iCodeElement++;
          if (iCodeElement < nCode) {
            result |= (code[iCodeElement] >>> (INDEX_BITS - lBitNxt));
          }
          iCodeBit = lBitNxt;
        } else {
          const lBitRmn = INDEX_BITS - (iCodeBit + bitSz);
          result = (code[iCodeElement] >>> lBitRmn) & ((1 << bitSz) - 1);
          iCodeBit += bitSz;
          if (iCodeBit === INDEX_BITS) {
            iCodeElement++;
            iCodeBit = 0;
          }
        }
        return result;
      };

      let checksum = null;
      if (this.bChecksum) {
        checksum = getBits(BYTE_BITS);
      }

      const maxNTrailBlock = Math.floor(INDEX_BITS / lbBlock);
      const lbMaxTrailingBlocks = getBitSize(maxNTrailBlock);
      const nTrailingBlocks = getBits(lbMaxTrailingBlocks);

      const bitsRead = (iCodeElement * INDEX_BITS) + iCodeBit;
      const nBlock = Math.floor(((nCode * INDEX_BITS) - (nTrailingBlocks * lbBlock) - bitsRead) / lbBlock);
      const lb = nBlock * lbBlock;

      let lByteData = 0;
      if (lb % BYTE_BITS === 0) {
        lByteData = Math.floor(lb / BYTE_BITS);
      } else {
        lByteData = Math.floor(lb / BYTE_BITS) + 1;
      }

      const output = new Uint8Array(lByteData);
      for (let i = 0; i < lByteData; i++) {
        output[i] = getBits(BYTE_BITS);
      }

      if (this.bChecksum && checksum !== null) {
        const calcCrc = crc8(output);
        if (calcCrc !== checksum) {
          throw new Error('CRC-8 Checksum verification failed: code may be corrupted');
        }
      }

      return output;
    }

    // High-level type handlers
    encodeByType(type, input, options = {}) {
      type = (type || 'auto').toLowerCase();
      const str = String(input != null ? input : '');
      if (!str.trim()) throw new Error('Input cannot be empty');

      let effectiveType = type;
      if (type === 'auto') {
        effectiveType = this.detectType(str);
      }

      // Preserve legacy UTF-8 for other types; phones choose the shorter wire format.
      const phone = effectiveType === 'phone' ? encodePhone(str) : null;
      const bytes = phone ? phone.bytes : textToBytes(str);
      let result = this.encode(bytes);
      if (phone) {
        const legacy = this.encode(textToBytes(phone.normalized));
        if (legacy.wordCount <= result.wordCount) result = legacy;
      }
      result.type = effectiveType;
      result.input = phone ? phone.normalized : input;
      return result;
    }

    decodeByType(type, message, options = {}) {
      type = (type || 'auto').toLowerCase();
      const bytes = this.decode(message);
      if (bytes[0] === PHONE_MARKER[0]) {
        return { type: 'phone', data: decodePhone(bytes), bytes };
      }

      // Attempt UTF-8 text decoding first
      let text = null;
      try {
        const decoded = bytesToText(bytes);
        // Verify text contains valid printable UTF-8 without control character corruption
        if (!/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(decoded)) {
          text = decoded;
        }
      } catch (e) {
        text = null;
      }

      if (text !== null) {
        let detectedType = type;
        if (type === 'auto') {
          detectedType = this.detectType(text);
        }
        return {
          type: detectedType,
          data: text,
          bytes
        };
      }

      // Fallback for raw binary payloads (e.g., legacy BigInt encoding)
      const bi = bytesToBigInt(bytes);
      return {
        type: (type === 'auto' ? 'number' : type),
        data: bi.toString(),
        bytes
      };
    }

    detectType(input) {
      if (!input) return 'text';
      const str = String(input).trim();
      if (/^https?:\/\//i.test(str) || /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i.test(str)) {
        return 'url';
      }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
        return 'email';
      }
      if (/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(str)) {
        return 'location';
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return 'date';
      }
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(str)) {
        return 'time';
      }
      if (/^\+?[0-9\s().*#,;-]+$/.test(str) && /[+*#;]/.test(str) && /\d/.test(str)) {
        return 'phone';
      }
      if (/^\d{1,18}$/.test(str)) {
        return 'number';
      }
      if (/^\+?[\d\s\-\(\)]{7,18}$/.test(str) && str.replace(/[^\d]/g, '').length >= 7) {
        return 'phone';
      }
      return 'text';
    }
  }

  const WCode = {
    Core: WCodeCore,
    crc8,
    getBitSize,
    textToBytes,
    bytesToText,
    bigIntToBytes,
    bytesToBigInt,
    create(options) {
      const dict = (typeof window !== 'undefined' ? window.WCodeDictionary : null);
      return new WCodeCore(dict, options);
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WCode;
  } else {
    global.WCode = WCode;
  }
})(typeof window !== 'undefined' ? window : globalThis);
