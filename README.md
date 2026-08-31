<div align="center">

# ExpensiveMail

Automatic email receipt parser and expense ledger.

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](#version-history)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#license)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#testing)
[![Bundle Size](https://img.shields.io/badge/bundle-308.42_kB-blue.svg)](#performance-benchmarks)

</div>

---

## Snapshots

### Dashboard

![ExpensiveMail Dashboard](./assets/screenshots/executive_dashboard.png)

### Landing page

![ExpensiveMail Landing Page](./assets/screenshots/landing_page.png)

---

## Table of contents

- [Overview](#overview)
- [Version history](#version-history)
- [Performance benchmarks](#performance-benchmarks)
- [UI design system](#ui-design-system)
- [Core features](#core-features)
- [Localization](#localization)
- [Multi-currency support](#multi-currency-support)
- [Architecture](#architecture)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment variables](#environment-variables)
- [Usage](#usage)
- [Project structure](#project-structure)
- [Testing](#testing)
- [License](#license)

---

## Overview

ExpensiveMail parses transaction receipts from bank emails and creates structured expense entries automatically. Manual expense tracking takes 4 to 6 minutes per transaction. ExpensiveMail extracts transaction details from incoming notification emails in under 350 ms with a 98% accuracy score.

The app uses Google Gemini AI (`@google/genai`) alongside offline regex parsers to handle rate limits and offline modes. It supports 18 banking feeds and digital wallets across 6 currencies (IDR, USD, EUR, GBP, SGD, JPY), and flags unusual price spikes and recurring subscriptions.

---

## Version history

### Version 1.2.0

- **Dark theme UI refresh**: Updated the dark interface with a 5-layer optical glass styling, subtle noise grain overlay to reduce gradient banding on high-DPI screens, and ice-cyan focus rings (`#6FE0FF`).
- **Simplified data export**: Added a single export menu supporting PDF summaries, CSV spreadsheets, and JSON audit files inside the report modal and navigation bar.
- **Performance optimizations**: Added eager image loading (`fetchPriority="high"`, `decoding="async"`), hoisted static category constants, wrapped event handlers in `useCallback`, and split modal dialogs into 15 dynamic JS chunks.

---

## Performance benchmarks

Measured from production builds (`vite build`), TypeScript checks (`tsc --noEmit`), and Playwright test runs:

| Metric                   | Value              | Baseline / Context                                                                                                                          |
| :----------------------- | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Main JS bundle size**  | 308.42 kB          | Down from 538.82 kB (42.7% reduction via code-splitting)                                                                                    |
| **Modal async chunks**   | 15 lazy modules    | Modules load on demand (3.88 kB to 25.77 kB per modal)                                                                                      |
| **Build execution time** | 5.39 seconds       | 2,394 modules transformed, 0 TypeScript errors                                                                                              |
| **Parsing speed**        | < 350 ms per email | 98% extraction confidence score                                                                                                             |
| **Bank feeds supported** | 18+ institutions   | Templates for BCA, Mandiri, BNI, BRI, BSI, BTN, Jenius, CIMB, Jago, GoPay, OVO, ShopeePay, DANA, LinkAja, GrabPay, Stripe, PayPal, and Wise |
| **Languages**            | 2 locales (EN, ID) | 100% dictionary string coverage                                                                                                             |
| **Currencies**           | 6 ISO currencies   | Real-time conversion across IDR, USD, EUR, GBP, SGD, JPY                                                                                    |
| **E2E test pass rate**   | 100% pass          | 0 console errors or uncaught exceptions                                                                                                     |

---

## UI design system

ExpensiveMail uses a dark optical glass design system tuned for contrast and clarity:

- **Base background**: Dark obsidian tint (`rgba(14,22,40,0.58)`) and high-contrast container fills.
- **Top borders**: Subtle ice-cyan accent borders (`rgba(163,226,255,0.45)`).
- **Backdrop blur**: Blur range between 28px and 48px with 185% saturation.
- **Noise overlay**: SVG fractal noise layer at 5.5% opacity to eliminate gradient banding.
- **Focus indicators**: Ice-cyan outlines (`#6FE0FF`) for keyboard navigation.
- **Fallbacks**: Standard CSS fallbacks for reduced transparency settings (`prefers-reduced-transparency`).

---

## Core features

### 1. Dual AI and regex email parsing

- **Gemini AI parser**: Uses the Google Gemini API to extract merchant names, dates, total amounts, itemized lists, taxes, and categories.
- **Offline regex parser**: Deterministic fallback parser handles offline processing and rate limits for 18+ bank email formats.
- **Sub-item breakdown**: Extracts itemized sub-purchases, VAT/tax values, and service fees when present in the email body.

### 2. Security and deduplication

- **Domain verification**: Checks SPF, DKIM, and DMARC headers against official merchant domains.
- **SHA-256 hash deduplication**: Generates a deterministic `sha256(merchant + amount + currency + date + paymentMethod)` hash to prevent duplicate entries.

### 3. Anomaly detection and subscription tracking

- **Price spike alerts**: Flags transactions that exceed 2.5x the baseline monthly average for a merchant.
- **Subscription tracker**: Identifies monthly and yearly billing cycles for recurring software and utility services.

### 4. Data export

- **Multiple formats**: Export ledger data to PDF executive summaries, CSV spreadsheets, or JSON audit files.
- **Quick access**: Open export options from the statement modal or the main navigation bar.

---

## Localization

ExpensiveMail supports **English (`en`)** and **Bahasa Indonesia (`id`)**.

| Component     | English (`en`)             | Bahasa Indonesia (`id`)   | Coverage         |
| :------------ | :------------------------- | :------------------------ | :--------------- |
| **Dashboard** | Full English labels        | Label Bahasa Indonesia    | 100% UI strings  |
| **Modals**    | 13 localized dialogs       | 13 dialog tersaji lengkap | 100% Modals      |
| **Toasts**    | Real-time system feedback  | Notifikasi sistem         | All alert toasts |
| **Exports**   | PDF, CSV, and JSON exports | Ekspor PDF, CSV, dan JSON | All reports      |

Switch languages at any time from the navigation bar or language modal. The setting saves automatically.

---

## Multi-currency support

The app handles real-time conversion and reporting across **6 currencies**:

| Currency              | Code  | Symbol | Format                         |
| :-------------------- | :---- | :----: | :----------------------------- |
| **Indonesian Rupiah** | `IDR` |  `Rp`  | Integer (`Rp 150.000`)         |
| **US Dollar**         | `USD` |  `$`   | Two decimals (`$124.50`)       |
| **Euro**              | `EUR` |  `€`   | Standard notation (`€95.00`)   |
| **British Pound**     | `GBP` |  `£`   | Standard notation (`£82.00`)   |
| **Singapore Dollar**  | `SGD` |  `S$`  | Standard notation (`S$140.00`) |
| **Japanese Yen**      | `JPY` |  `¥`   | Integer (`¥15,000`)            |

Changing display currency recalculates monthly totals, daily averages, and budget limits immediately without reloading the page.

---

## Architecture

```
+-------------------------------------------------------------------------------+
|                             EXPENSIVE MAIL ARCHITECTURE                       |
|                                                                               |
|  [ EMAIL INGESTION ]  --->  [ SENDER PROVENANCE VERIFICATION ]                |
|                                      |                                        |
|                      +---------------+---------------+                        |
|                      v                               v                        |
|             [ GEMINI AI PARSER ]            [ FALLBACK REGEX ]                |
|                      +---------------+---------------+                        |
|                                      v                                        |
|                        [ SHA-256 DEDUPLICATION HASH ]                         |
|                                      v                                        |
|                     [ LOCALIZATION & CURRENCY CONVERTER ]                     |
|                                      v                                        |
|                           [ MAIN DASHBOARD UI ]                               |
+-------------------------------------------------------------------------------+
```

| Layer              | Technology                                | Role                                       |
| :----------------- | :---------------------------------------- | :----------------------------------------- |
| **Frontend**       | React 19, TypeScript 5.8, Tailwind CSS v4 | Responsive web interface                   |
| **Localization**   | Custom i18n service                       | Dual language dictionary (EN and ID)       |
| **Currency**       | `exchangeRateDb` service                  | Exchange rate conversion matrix            |
| **Animations**     | Motion (`motion/react`)                   | Number counters and modal transitions      |
| **Backend**        | Node.js, Express, Esbuild                 | Server API router (`dist/server.cjs`)      |
| **AI model**       | `@google/genai`                           | Email receipt parsing with regex fallback  |
| **Storage & Auth** | Firebase Auth & Firestore                 | User authentication and data persistence   |
| **Testing**        | Playwright Chromium                       | End-to-end testing and visual verification |

---

## Getting started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/expensivemail.git
cd expensivemail

# 2. Install dependencies
npm install
```

### Environment variables

Create a `.env` file in the root directory:

```env
# Gemini AI API Key (required for AI parsing)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Application URL
APP_URL="http://localhost:3000"
```

---

## Usage

### Development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Production build

```bash
# Compile client assets and server bundle
npm run build

# Start production server
npm start
```

---

## Project structure

```text
expensivemail
├── assets/
│   └── screenshots/               # Visual verification screenshots
│       ├── landing_page.png       # Landing page screenshot
│       └── executive_dashboard.png# Main dashboard screenshot
├── dist/                          # Production build output
│   ├── assets/                    # Code-split JavaScript chunks
│   └── server.cjs                 # Express server bundle
├── scratch/                       # Automation and test scripts
│   ├── capture_readme_screenshots.mjs # Playwright screenshot capture script
│   └── test_webapp.js             # E2E test script
├── src/
│   ├── components/                # React components
│   │   ├── motion/                # Animated UI components
│   │   ├── ui/                    # Base UI elements
│   │   ├── MetricCards.tsx        # Financial metrics summary cards
│   │   ├── ExpenseList.tsx        # Transaction list and filters
│   │   ├── ReportStatementModal.tsx# PDF, CSV, and JSON export dialog
│   │   ├── CurrencyModal.tsx      # Currency settings dialog
│   │   ├── LanguageModal.tsx      # Language selection dialog
│   │   ├── Navbar.tsx             # Main navigation bar
│   │   └── LandingPage.tsx        # Product overview page
│   ├── services/                  # Business logic services
│   │   ├── currency.ts            # Currency conversion service
│   │   ├── translations.ts        # EN/ID translations dictionary
│   │   ├── exportService.ts       # PDF, CSV, and JSON export generator
│   │   ├── firebaseAuth.ts        # Authentication and Firestore logic
│   │   └── senderProvenance.ts    # SPF/DKIM verification logic
│   ├── App.tsx                    # Main app component
│   ├── index.css                  # CSS styles and design tokens
│   └── types.ts                   # TypeScript interfaces
├── firebase-applet-config.json    # Firebase client configuration
├── package.json                   # Dependencies and scripts (v1.2.0)
├── server.ts                      # Express API server
└── vite.config.ts                 # Vite bundler configuration
```

---

## Testing

Run static type checks, production build tests, and Playwright verification:

```bash
# 1. Run TypeScript type check
npm run typecheck

# 2. Build for production
npm run build

# 3. Capture automated screenshots with Playwright
node scratch/capture_readme_screenshots.mjs
```

---

## License

This project is licensed under the [MIT License](LICENSE).
