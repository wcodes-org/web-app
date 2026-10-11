WCode - Web App
=========================

Encode and decode digital information into simple literal words (Base-1024).

Features:
- Encode and Decode modes matching Windows and Android WCode apps
- 9 Data Types: Auto, Text, Number, Phone, Email, Location (GPS coordinates), URL, Date, Time
- Optional CRC-8 Checksum verification (polynomial 0x8C)
- Real-time word suggestions & autocomplete using the 1024-word dictionary
- Pure native Web implementation (HTML5, CSS3, ES6+) - zero external frameworks
- Modern polished UI with light/dark/system themes, glassmorphism, and responsive layout
- Text-to-speech pronunciation, clipboard copy/paste, Web Share API, and local Saved Codes / History
- Offline support via Service Worker

Technology:
- Hosting: Firebase Hosting (served at root `/`, merged with site at `/about`)
- Dictionary: 1024 distinct nouns (10 bits per word), canonical source at [`https://wordlist.wcodes.org`](https://wordlist.wcodes.org)
- Platform: Vanilla JavaScript & Modern CSS
