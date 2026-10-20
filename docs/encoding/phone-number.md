# Compact phone and dial-string encoding

Status: implemented in `Root/JS/wcode-core.js`. This replaces the original phone encoding proposal. The objective is fewer **spoken dictionary words**, including framing and optional checksum, for common phone inputs. It does not claim a universal optimum or an unmeasured usage distribution.

## Input and behavior

Choose Phone for domestic numbers, emergency codes, or digit strings that should be treated as phones. Auto recognizes a leading `+`, service controls, and formatted phone numbers; plain integers remain Number to avoid changing existing IDs. Country code is optional and blank by default. An explicitly supplied country code is prepended with `+` only to a domestic numeric input; a leading zero is preserved, since country-specific trunk-prefix conversion requires numbering-plan knowledge.

Normalization removes whitespace, parentheses, periods and hyphens. It preserves all digits, leading zeroes, an optional leading `+`, and controls `* # , ;`. No other characters, internal plus signs, empty bodies or control-only strings are accepted. The maximum body length is 256 symbols. This is a dial-string syntax codec, not a check that a subscriber number exists. Formatting is intentionally not round-tripped. Pause and wait characters are preserved without imposing platform-specific timing semantics.

## Wire format, version 1

The existing Base-1024 byte transport and optional CRC-8 are unchanged. The phone byte payload is:

```
FF 01 <unsigned packed integer, big endian, minimum one byte>
```

`FF` cannot occur in valid UTF-8, and `01` is the phone format version. This permits Auto decoding independently of the selected input type. Unknown versions and malformed/noncanonical payloads are rejected. Old UTF-8 WCodes continue to decode. Older apps do not understand the new phone payload: cross-client interoperability requires this codec to be ported. Historical arbitrary binary payloads starting with `FF` now occupy the reserved typed namespace; this compatibility limit is deliberate.

The packed integer is `(R << 2) | mode`:

| Mode | Alphabet | Leading plus |
| --- | --- | --- |
| 0 | `0123456789` | absent |
| 1 | `0123456789` | present |
| 2 | `0123456789*#,;` | absent |
| 3 | `0123456789*#,;` | present |

Numeric bodies always use radix 10. Only bodies with controls use radix 14. This avoids charging ordinary phone numbers for a larger alphabet. There is no country table, implicit country, or country-prefix guessing.

### Dense ranking, including leading zeroes

For radix `b`, symbol values are `0..b-1`. Start `A = 0`; for each symbol `v`, set `A = A*b + v + 1`. Finally `R = A - 1`. This assigns consecutive ranks to every nonempty string in length-first, then alphabet order. Equivalently, for length `n`, `R = sum(b^k, k=1..n-1) + numericValue(body)`. It preserves leading zeroes without a separate length field and leaves no unused ranks between lengths.

Decode with `A = R + 1`. While `A > 0`, decrement A, extract `A % b`, then integer-divide A by b. Reverse the symbols. Apply the plus flag. Re-encode and compare bytes to reject redundant zero bytes, wrong alphabet modes, and invalid strings.

Small vectors, before byte transport:

| Input | R | Mode | Packed | Bytes (hex) |
| --- | ---: | ---: | ---: | --- |
| `0` | 0 | 0 | 0 | `FF 01 00` |
| `+0` | 0 | 1 | 1 | `FF 01 01` |
| `00` | 10 | 0 | 40 | `FF 01 28` |
| `911` | 1021 | 0 | 4084 | `FF 01 0F F4` |

These are codec vectors; the final encoder may choose text instead.

### Choose by final word count

Encode both normalized UTF-8 text and the typed compact bytes using the current checksum setting. Emit the candidate with fewer dictionary words; ties use text for interoperability. Thus phone encoding never adds words compared with the normalized text representation. No extra selector is required: the decoder distinguishes the typed byte prefix from UTF-8.

For B payload bytes, the existing transport needs `ceil((8B + 1 + C)/10)` words, where C is 0 or 8 checksum bits. Compare complete outputs, not fractional bytes or payload-only bits. No changes are made to raw `encode(bytes)` or Number encoding.

## Measured examples

The following counts are produced by the implementation, without checksum:

| Normalized input | Previous text words | Selected words |
| --- | ---: | ---: |
| `0` | 1 | 1 |
| `911` | 3 | 3 |
| `07911123456` | 9 | 6 |
| `+14155552671` | 10 | 6 |
| `+442079460000` | 11 | 7 |
| `+123456789012345` | 13 | 8 |
| `*123#` | 5 | 5 |
| `*#06#` | 5 | 5 |
| `+18005550199,123#` | 14 | 9 |
| `123;456` | 6 | 5 |

## Corrections to the original proposal

A decimal sentinel preserves zeroes but does not have zero overhead: prefixing 1 wastes integer ranges between lengths. Dense ranking removes those gaps. A two-bit header must define its bit ordering consistently; here the flags are the two least significant bits. Radix 12 cannot represent pause/wait without another discriminator, so this version specifies radix 14 for every extended string.

The earlier table understated some bit lengths and mixed payload bits with total bits. For example, sentinel-based `911` is 11 payload bits plus 2 flag bits, or 13 bits. `*#06#` has five characters, not six, and radix-12 sentinel encoding requires 19 payload bits plus 2 flags. Claims of 99.8% Shannon efficiency and 70% usage were unsupported and are removed. Alphabet entropy alone does not establish optimality for real phone distributions or account for transport/version overhead.

A future word-native protocol could save byte padding and marker overhead, but requires a separately versioned transport and migration strategy. Country-specific compression needs measured distributions and stable shared tables. Neither is silently introduced here.

## Validation

Run `node tests/phone-codec.test.cjs` from the app repo. Tests exercise more than 2,000 deterministic round trips across both checksum settings, leading zeroes, control symbols, normalization, length limits, malformed typed payloads, Auto detection and legacy UTF-8 decoding. Dictionary indices are represented by synthetic words so the codec test does not depend on the network or dictionary refresh.
