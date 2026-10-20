# Ultra-Compact Phone Number & Dial String Encoding Specification

This document specifies a bit-level encoding scheme for phone numbers and telephony dial strings. It maximizes bit efficiency by utilizing a **2-bit classification header** that separates pure numeric numbers from extended dial strings (USSD/MMI codes), achieving near-optimal Shannon entropy limits while guaranteeing lossless round-trips.

---

## 1. Bitstream Architecture

Every encoded phone number is packed into a variable-length bit sequence composed of a **2-bit control header** followed by a **compact payload**.

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|P|S| Payload Bits (Variable Bit-Length)                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### 1.1 Header Bits (2 Bits)

| Bit Position | Flag Name | Values | Meaning |
| :---: | :---: | :---: | :--- |
| **Bit 0** | `has_plus` | `0` = Absent<br>`1` = Present | Indicates whether the phone number begins with a leading `+` (international E.164 format). |
| **Bit 1** | `has_syms` | `0` = Pure Numeric<br>`1` = Extended Symbols | Indicates whether the payload contains telephony control symbols (`*`, `#`). |

---

## 2. Table of Possible Cases & Technical Remarks

The following table comprehensively covers all input combinations, their header flag states, optimal encoding modes, and operational remarks:

| Case # | Category | Example Input | `has_plus` | `has_syms` | Encoding Mode | Payload Representation | Remarks & Handling |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **1** | **Standard International (E.164)** | `+14155552671`<br>`+442079460000` | `1` | `0` | **Mode 0**<br>(Radix-10) | `BigInt("1" + digits)` | **Most common international case (~70% of mobile usage).** Digits are strictly `0–9`. The sentinel `'1'` prefix guarantees that any leading digit patterns are preserved unambiguously. |
| **2** | **National / Domestic (No Leading Zero)** | `18005550199`<br>`9841234567` | `0` | `0` | **Mode 0**<br>(Radix-10) | `BigInt("1" + digits)` | Standard domestic dialing format without international prefix. Sentinel prefix avoids any sign-bit ambiguities. |
| **3** | **National / Domestic (With Leading Zeroes)** | `07911123456`<br>`02079460000`<br>`0044...` | `0` | `0` | **Mode 0**<br>(Radix-10) | `BigInt("1" + digits)` | **Critical leading zero case.** Naive integer conversion collapses `07...` to `7...`. Prepending sentinel `'1'` creates `107...`, ensuring 100% lossless preservation of arbitrary leading zeroes with zero length header overhead. |
| **4** | **Emergency & Short Service Codes** | `911`, `112`, `999`, `311` | `0` | `0` | **Mode 0**<br>(Radix-10) | `BigInt("1" + digits)` | Very small payload: `911` $\to$ `1911` ($< 2048$, exactly 11 bits total). Enables ultra-compact transmission over constrained channels. |
| **5** | **USSD / MMI Service Codes** | `*123#`<br>`*#06#`<br>`##002#` | `0` | `1` | **Mode 1**<br>(Radix-12) | Base-12 integer with sentinel `1` | `*` and `#` are present. Uses Radix-12 alphabet (`0–9`, `*` $\to$ 10, `#` $\to$ 11). Achieves 3.58 bits/symbol vs 8-bit ASCII (55% compression). |
| **6** | **Carrier Feature Prefix Codes** | `*8218005550199`<br>`*67...` | `0` | `1` | **Mode 1**<br>(Radix-12) | Base-12 integer with sentinel `1` | Used to toggle Caller ID or call services prior to dialing a domestic number. Packed as a single contiguous Base-12 stream. |
| **7** | **International USSD / Roaming Queries** | `+*123#`<br>`*#+...` (rare) | `1` | `1` | **Mode 1**<br>(Radix-12) | Base-12 integer with sentinel `1` | Leading `+` is stripped and flagged in Bit 0; remaining symbols (`*`, `#`, digits) are encoded via Radix-12. |
| **8** | **Extension Dialing with DTMF Control** | `+18005550199#123` | `1` | `1` | **Mode 1**<br>(Radix-12) | Base-12 integer with sentinel `1` | Includes in-call automated system extension delimiter (`#`). Both `has_plus` and `has_syms` are set to `1`. |
| **9** | **Dial Strings with Pause / Wait** *(Optional Extension)* | `+18005550199,123#`<br>`+18005550199;456` | `1` | `1` | **Mode 1b**<br>(Radix-14 / 4-bit Nibbles) | Base-14 or 4-bit nibbles (`A=*`, `B=#`, `C=,`, `D=;`) | DTMF Pause (`,`, 2-second pause) and Wait (`;`, wait for user tap). Can be mapped into symbols 12 and 13 if full PBX dial string support is required. |
| **10** | **Maximum Length E.164 Number** | `+123456789012345` (15 digits) | `1` | `0` | **Mode 0**<br>(Radix-10) | `BigInt("1" + digits)` | ITU-T E.164 specifies a maximum of 15 digits. $2 \times 10^{15} < 2^{51}$, requiring only **51 payload bits + 2 header bits = 53 bits (6.625 bytes)** vs 16 bytes in ASCII. |

---

## 3. Detailed Payload Mechanics

### 3.1 Mode 0: Clean Numeric Compression (`has_syms == 0`)

When no `*` or `#` is present, the input consists solely of characters `0–9`.

#### The Sentinel Digit Technique
To preserve leading zeroes without paying a 4-bit or 8-bit length field penalty:
1. Prepend ASCII character `'1'` to the numeric string:
   $$\text{Input: } "0044123" \implies \text{String: } "10044123"$$
2. Convert directly to an unsigned arbitrary-precision integer:
   $$X = \text{BigInt}("10044123")$$
3. **Decoding:** Convert $X$ back to string, assert that the first character is `'1'`, and slice it off:
   $$\text{Decoded: } \text{String}(X)\text{.slice}(1) \implies "0044123"$$

#### Theoretical Efficiency
- Entropy per digit: $\log_2(10) \approx 3.3219$ bits.
- Shannon efficiency: **$> 99.8\%$**.

---

### 3.2 Mode 1: Extended Dial Strings (`has_syms == 1`)

When `*` or `#` symbols appear, the alphabet expands to 12 symbols:

| Character | Numeric Value ($v$) |
| :---: | :---: |
| `'0'` – `'9'` | $0$ – $9$ |
| `'*'` | $10$ (`0xA`) |
| `'#'` | $11$ (`0xB`) |

#### Radix-12 Packing Algorithm
1. Initialize an accumulator with sentinel value $1$:
   $$V_0 = 1$$
2. For each symbol $s_i$ in the dial string:
   $$V_{i+1} = V_i \times 12 + v(s_i)$$
3. **Decoding:** Perform repeated modulo-12 operations until the quotient reaches $1$ (the sentinel):
   $$\text{symbol} = V \pmod{12}, \quad V = \lfloor V / 12 \rfloor$$
4. Reverse the extracted symbols to restore original string order.
- Entropy per character: $\log_2(12) \approx 3.585$ bits.

---

### 3.3 Alternative Mode 0 Variant: Base-1024 / 3-Digit Triplet Chunking

In systems using a Base-1024 word dictionary (such as **WCode**), every group of 3 decimal digits $(000 - 999)$ fits in exactly 10 bits:
$$10^3 = 1000 \le 1024 = 2^{10}$$

- **Rate:** $10\text{ bits} / 3\text{ digits} = 3.333\text{ bits/digit}$.
- Direct 1-to-1 mapping with 10-bit words in the WCode dictionary.
- The remaining 24 unallocated values ($1000 - 1023$) in the 10-bit word space can function as inline control escape markers (such as delimiter flags or symbol switches).

---

## 4. Bit-Budget & Size Comparison

| Phone Number Format | Raw ASCII | BCD (4-bit nibbles) | Proposed Compact Scheme | Reduction vs ASCII | Reduction vs BCD |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `+14155552671` (US/Canada Mobile) | 96 bits (12 B) | 48 bits (6 B) | **39 bits** (4.87 B) | **59.4%** | **18.7%** |
| `07911123456` (UK National Mobile) | 88 bits (11 B) | 44 bits (5.5 B) | **38 bits** (4.75 B) | **56.8%** | **13.6%** |
| `+442079460000` (UK Landline) | 104 bits (13 B) | 52 bits (6.5 B) | **42 bits** (5.25 B) | **59.6%** | **19.2%** |
| `911` (Emergency Code) | 24 bits (3 B) | 12 bits (1.5 B) | **13 bits** (1.62 B) | **45.8%** | - |
| `*123#` (Short USSD Code) | 40 bits (5 B) | 20 bits (2.5 B) | **19 bits** (2.37 B) | **52.5%** | **5.0%** |
| `*#06#` (IMEI Query) | 48 bits (6 B) | 24 bits (3 B) | **16 bits** (2.00 B) | **66.7%** | **33.3%** |
| `+123456789012345` (Max E.164, 15 digits) | 128 bits (16 B) | 64 bits (8 B) | **53 bits** (6.62 B) | **58.6%** | **17.2%** |

---

## 5. Reference Implementation (TypeScript / ES6)

```typescript
/**
 * Ultra-compact phone number and dial string codec.
 */
export class PhoneNumberCodec {
  /**
   * Encodes a phone number or dial string into a compact bit-packed payload.
   * 
   * Header:
   *  Bit 0: has_plus (1 if '+' prefix is present)
   *  Bit 1: has_syms (1 if '*' or '#' is present)
   */
  public static encode(raw: string): { bitLength: number; bits: bigint } {
    // 1. Sanitize standard formatting noise
    const sanitized = raw.trim().replace(/[\s\-\(\)\.]/g, '');
    
    // 2. Extract Flags
    const hasPlus = sanitized.startsWith('+') ? 1 : 0;
    const body = hasPlus ? sanitized.slice(1) : sanitized;
    const hasSyms = /[*#]/.test(body) ? 1 : 0;

    let payloadVal = 0n;
    let payloadBits = 0;

    if (!hasSyms) {
      // Mode 0: Radix-10 with sentinel '1'
      const sentinelStr = '1' + body;
      payloadVal = BigInt(sentinelStr);
      payloadBits = payloadVal.toString(2).length;
    } else {
      // Mode 1: Radix-12 with sentinel 1
      let acc = 1n;
      for (let i = 0; i < body.length; i++) {
        const c = body[i];
        acc *= 12n;
        if (c >= '0' && c <= '9') {
          acc += BigInt(c);
        } else if (c === '*') {
          acc += 10n;
        } else if (c === '#') {
          acc += 11n;
        } else {
          throw new Error(`Unsupported dial character: ${c}`);
        }
      }
      payloadVal = acc;
      payloadBits = payloadVal.toString(2).length;
    }

    // 3. Assemble: [Payload]<<2 | [hasPlus]<<1 | [hasSyms]
    const header = BigInt((hasPlus << 1) | hasSyms);
    const combined = (payloadVal << 2n) | header;
    const totalBits = payloadBits + 2;

    return {
      bitLength: totalBits,
      bits: combined
    };
  }

  /**
   * Decodes a bit-packed value back to the exact phone number or dial string.
   */
  public static decode(packed: bigint): string {
    const hasSyms = (packed & 1n) === 1n;
    const hasPlus = (packed & 2n) === 2n;
    const payload = packed >> 2n;

    let result = hasPlus ? '+' : '';

    if (!hasSyms) {
      // Mode 0: Radix-10, drop sentinel '1'
      const str = payload.toString();
      result += str.slice(1);
    } else {
      // Mode 1: Radix-12, extract symbols until sentinel 1
      let acc = payload;
      const symbols: string[] = [];
      while (acc > 1n) {
        const rem = Number(acc % 12n);
        if (rem < 10) {
          symbols.push(rem.toString());
        } else if (rem === 10) {
          symbols.push('*');
        } else if (rem === 11) {
          symbols.push('#');
        }
        acc /= 12n;
      }
      result += symbols.reverse().join('');
    }

    return result;
  }
}
```

---

## 6. Summary of Architectural Advantages

1. **Information-Theoretic Near-Optimality:** Captures 99.8% of theoretical entropy for pure numbers, outperforming BCD by $\approx 18\%$ and ASCII by $\approx 60\%$.
2. **Lossless Zero Preservation:** Uses an implicit numerical sentinel prefix `'1'` instead of dedicated byte/nibble length headers, saving 4–8 bits per message.
3. **Adaptive Mode Switching:** Unused special symbols (`*`, `#`) impose zero overhead on regular phone numbers, while specialized dial strings degrade gracefully into Radix-12.
4. **WCode Base-1024 Compatibility:** Seamlessly integrates with 10-bit word chunking schemes.

> Archived proposal. Superseded by [the implemented specification](phone-number.md); size estimates and claims above are not normative.
