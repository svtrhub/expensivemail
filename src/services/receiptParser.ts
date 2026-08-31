import {
  Expense,
  BankAccount,
  ExpenseCategory,
  UserTrustedDomainRule,
} from '../types';
import {
  verifySenderProvenance,
  crossCheckMerchantWithDomain,
} from './senderProvenance';

/**
 * High-precision intent classification & anti-false-positive detector.
 * Rejects non-transactional emails such as OTPs, security alerts, marketing promos,
 * order shipping updates, and general newsletters.
 */
export interface IntentClassificationResult {
  isTransaction: boolean;
  rejectReason?: string;
  confidenceScore: number;
}

// 1. Definite Non-Transaction Disqualifiers (Blacklist)
const NON_TRANSACTION_PATTERNS: { pattern: RegExp; reason: string }[] = [
  // OTP & Authentication
  {
    pattern:
      /(?:kode\s+(?:otp|verifikasi|rahasia|keamanan)|otp\s+(?:code|verification|anda)|verification\s+code|one-time\s+password|jangan\s+berikan\s+kode|rahasia\s+anda|two-factor|2-step|2fa\b)/i,
    reason: 'Security OTP / Verification Code',
  },
  // Account Security & Login Alerts
  {
    pattern:
      /(?:login\s+(?:baru|dari\s+perangkat|berhasil\s+dari)|new\s+login\s+detected|perangkat\s+baru\s+terdeteksi|device\s+baru|ubah\s+kata\s+sandi|reset\s+password|ganti\s+pin|lupa\s+password|keamanan\s+akun\s+anda|security\s+alert)/i,
    reason: 'Account Security / Login Alert',
  },
  // Pure Marketing / Promos / Newsletters / Discounts (without actual payment)
  {
    pattern:
      /(?:diskon\s+(?:hingga|s\/d|s\.d|up\s+to)|cashback\s+(?:hingga|s\/d|s\.d|up\s+to)|dapatkan\s+cashback|klaim\s+voucher|voucher\s+diskon\s+kamu|promo\s+(?:spesial|gajian|akhir\s+pekan|weekend|terbatas)|flash\s+sale|special\s+offer\s+for\s+you|newsletter\s+edisi|rekomendasi\s+produk|penawaran\s+(?:pinjaman|kartu\s+kredit)|ajukan\s+(?:pinjaman|kartu\s+kredit)|bunga\s+0%|serbu\s+promo|buruan\s+checkout)/i,
    reason: 'Marketing / Promotional Newsletter',
  },
  // Informational Reports & Balance Updates (Not a deduction)
  {
    pattern:
      /(?:sisa\s+saldo\s+anda\s+saat\s+ini|saldo\s+rekening\s+anda\s+adalah|balance\s+summary|ringkasan\s+informasi\s+saldo|perubahan\s+syarat\s+dan\s+ketentuan|kebijakan\s+privasi\s+baru|privacy\s+policy\s+update|jadwal\s+maintenance|pemeliharaan\s+sistem)/i,
    reason: 'Informational / Balance Summary / Terms Update',
  },
  // Shipping / Logistics Only (when there is no receipt / payment confirmation)
  {
    pattern:
      /(?:pesanan(?:mu)?\s+sedang\s+(?:dikirim|dalam\s+perjalanan)|kurir\s+sedang\s+(?:mengantar|menuju)|driver\s+(?:sedang\s+menuju|telah\s+sampai)|paket\s+telah\s+diterima\s+oleh|lacak\s+paket\s+anda)/i,
    reason: 'Shipping / Logistics Status Update',
  },
];

// 2. Definite Positive Financial Confirmation Indicators
const POSITIVE_TRANSACTION_INDICATORS = [
  /transaksi\s+(?:berhasil|sukses)/i,
  /pembayaran\s+(?:berhasil|sukses|telah\s+diterima|selesai)/i,
  /transfer\s+(?:berhasil|sukses|dana\s+berhasil)/i,
  /pembelian\s+(?:berhasil|sukses|langganan)/i,
  /langganan\s+(?:anda\s+akan\s+otomatis|aktif|diperpanjang)/i,
  /debet\s+rekening|rekening\s+telah\s+didebet|telah\s+berhasil\s+didebit/i,
  /bukti\s+(?:transaksi|transfer|pembayaran)/i,
  /tanda\s+terima\s+(?:pesanan|pembayaran|google\s+play|apple)?/i,
  /struk\s+(?:pembelian|pembayaran|transaksi)/i,
  /notifikasi\s+transaksi/i,
  /total\s*(?:pembayaran|bayar|tagihan|belanja|biaya|pesanan)?\s*[:=]/i,
  /nominal\s+transaksi\s*[:=]/i,
  /jumlah\s+(?:transaksi|transfer|pembayaran)\s*[:=]/i,
  /uang\s+keluar|kamu\s+berhasil\s+transfer|kamu\s+berhasil\s+bayar/i,
  /payment\s+(?:successful|completed|confirmed|received|processed)/i,
  /transaction\s+(?:successful|completed|approved)/i,
  /order\s+confirmation|purchase\s+confirmation/i,
  /receipt\s+for|your\s+receipt|e-receipt/i,
  /invoice\s+(?:is\s+available|ready|for|receipt)/i,
  /amount\s+(?:charged|debited|paid)\s*[:=]/i,
  /total\s+(?:amount\s+paid|charged|due)\s*[:=]/i,
  /billed\s+to|charged\s+to\s+your/i,
  /subscription\s+(?:renewed|renewal|receipt|confirmation|payment)/i,
  /membership\s+(?:renewed|renewal|confirmation)/i,
  /autodebet\s+(?:berhasil|sukses)/i,
  /lunas|status:\s*lunas/i,
  /google\s*(?:play|cloud|workspace|one|ads).*(?:tanda\s+terima|nomor\s+pesanan|total|invoice|receipt|statement)/i,
  /aws\s*(?:billing|invoice|payment)/i,
  /amazon\s+web\s+services.*(?:invoice|charged|payment)/i,
  /microsoft\s*(?:azure|365).*(?:invoice|payment|receipt)/i,
  /(?:openai|chatgpt|anthropic|claude|midjourney|github|cursor|vercel|supabase|cloudflare|digitalocean).*(?:receipt|invoice|payment|charged)/i,
];

/**
 * Classifies whether an email represents a legitimate financial transaction.
 */
export function classifyEmailIntent(
  subject: string,
  from: string,
  bodyText: string
): IntentClassificationResult {
  const cleanSubject = (subject || '').trim();
  const cleanFrom = (from || '').trim();
  const cleanBody = (bodyText || '').trim();
  const fullText = `${cleanSubject} ${cleanFrom} ${cleanBody}`;

  // Subject is the strongest indicator for fast-rejection of OTPs & Security alerts
  for (const item of NON_TRANSACTION_PATTERNS) {
    if (item.pattern.test(cleanSubject)) {
      return {
        isTransaction: false,
        rejectReason: item.reason,
        confidenceScore: 0.95,
      };
    }
  }

  // Count positive transaction indicators
  let positiveScore = 0;
  for (const posPattern of POSITIVE_TRANSACTION_INDICATORS) {
    if (posPattern.test(fullText)) {
      positiveScore += 1;
    }
  }

  // Check body for non-transaction patterns
  for (const item of NON_TRANSACTION_PATTERNS) {
    if (item.pattern.test(fullText)) {
      if (positiveScore === 0) {
        return {
          isTransaction: false,
          rejectReason: item.reason,
          confidenceScore: 0.9,
        };
      }
      if (item.reason.includes('OTP') || item.reason.includes('Security')) {
        return {
          isTransaction: false,
          rejectReason: item.reason,
          confidenceScore: 0.99,
        };
      }
    }
  }

  if (positiveScore === 0) {
    return {
      isTransaction: false,
      rejectReason: 'No financial transaction confirmation indicators found',
      confidenceScore: 0.8,
    };
  }

  return {
    isTransaction: true,
    confidenceScore: Math.min(0.5 + positiveScore * 0.15, 0.99),
  };
}

/**
 * Robust context-anchored amount extraction handling Indonesian & International currencies:
 * - Handles: "Rp 150.000,-", "Rp 45.500,00", "Rp. 1.250.000", "IDR 350.000", "Total Bayar: Rp 78.500"
 * - Disqualifies promotional discounts, maximum cashback, and account balance statements
 */
export function extractAnchoredAmount(
  text: string
): { amount: number; currency: string } | null {
  // 1. Prioritize explicit "Total / Nominal / Bayar / Jumlah" payment anchors in IDR
  const anchoredIdrPatterns = [
    // Total / Total Bayar / Nominal / Jumlah Transaksi: Rp 85.470/bulan or Rp 150.000,-
    /(?:total\s*(?:pembayaran|bayar|tagihan|belanja|biaya|pesanan|amount)?|nominal\s+transaksi|nominal|jumlah\s+(?:transfer|transaksi|pembayaran|bayar)|sebesar|didebet|uang\s+keluar|dibayar)\s*:?\s*(?:rp\.?|idr)\s*([0-9]{1,3}(?:[\.\s][0-9]{3})+(?:,[0-9]{2}|,-)?)/i,
    // "Rp 150.000,- berhasil didebet"
    /(?:rp\.?|idr)\s*([0-9]{1,3}(?:[\.\s][0-9]{3})+(?:,[0-9]{2}|,-)?)\s*(?:berhasil|sukses|lunas|telah\s+didebet|telah\s+dibayarkan)/i,
    // International standard "Amount Charged: Rp 150.000"
    /(?:total|amount\s+paid|amount\s+charged|debited)\s*:?\s*(?:rp\.?|idr)\s*([0-9]{1,3}(?:[\.\s][0-9]{3})+(?:,[0-9]{2}|,-)?)/i,
    // Formatted "Rp 150.000,-"
    /(?:rp\.?|idr)\s*([0-9]{1,3}(?:[\.\s][0-9]{3})+(?:,[0-9]{2}|,-)?)/i,
    // Raw numeric "Rp 150000"
    /(?:rp\.?|idr)\s*([0-9]{4,10}(?:,[0-9]{2}|,-)?)/i,
  ];

  for (const pattern of anchoredIdrPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const matchIndex = match.index || 0;
      const precedingContext = text
        .substring(Math.max(0, matchIndex - 35), matchIndex)
        .toLowerCase();

      const isDisqualifiedPrefix =
        precedingContext.includes('hingga') ||
        precedingContext.includes('s/d') ||
        precedingContext.includes('s.d') ||
        precedingContext.includes('up to') ||
        precedingContext.includes('maksimal') ||
        precedingContext.includes('maks') ||
        precedingContext.includes('sisa saldo') ||
        precedingContext.includes('saldo akhir') ||
        precedingContext.includes('limit kartu') ||
        precedingContext.includes('limit kredit') ||
        precedingContext.includes('cashback hingga');

      if (!isDisqualifiedPrefix) {
        // Clean trailing hyphen/commas e.g. "150.000,-" => "150000"
        let rawAmountStr = match[1].replace(/,-$/, '').replace(/\s+/g, '');
        let cleanStr = rawAmountStr.replace(/\./g, '').replace(/,/g, '.');
        if (cleanStr.includes('.')) {
          const parts = cleanStr.split('.');
          if (parts[1] && (parts[1] === '00' || parts[1].length === 2)) {
            cleanStr = parts[0];
          }
        }
        const val = parseFloat(cleanStr);
        if (val > 0) {
          return { amount: val, currency: 'IDR' };
        }
      }
    }
  }

  // 2. USD matching ($ or USD)
  const usdMatch =
    text.match(
      /(?:total\s*(?:amount|charged|paid|due)?|amount\s+charged|amount\s+paid|price)\s*:?\s*(?:usd|\$)\s*([0-9]+(?:\.[0-9]{2})?)/i
    ) ||
    text.match(/(?:usd|\$)\s*([0-9]+(?:\.[0-9]{2})?)/i) ||
    text.match(/([0-9]+(?:\.[0-9]{2})?)\s*usd/i);

  if (usdMatch && usdMatch[1]) {
    const val = parseFloat(usdMatch[1]);
    if (val > 0) return { amount: val, currency: 'USD' };
  }

  // 3. EUR matching (€ or EUR)
  const eurMatch =
    text.match(
      /(?:total|amount|charged|paid|price)\s*:?\s*(?:eur|€)\s*([0-9]+(?:[\.,][0-9]{2})?)/i
    ) ||
    text.match(/(?:eur|€)\s*([0-9]+(?:[\.,][0-9]{2})?)/i) ||
    text.match(/([0-9]+(?:[\.,][0-9]{2})?)\s*(?:eur|€)/i);

  if (eurMatch && eurMatch[1]) {
    const cleanStr = eurMatch[1].replace(',', '.');
    const val = parseFloat(cleanStr);
    if (val > 0) return { amount: val, currency: 'EUR' };
  }

  // 4. GBP matching (£ or GBP)
  const gbpMatch =
    text.match(
      /(?:total|amount|charged|paid|price)\s*:?\s*(?:gbp|£)\s*([0-9]+(?:\.[0-9]{2})?)/i
    ) || text.match(/(?:gbp|£)\s*([0-9]+(?:\.[0-9]{2})?)/i);

  if (gbpMatch && gbpMatch[1]) {
    const val = parseFloat(gbpMatch[1]);
    if (val > 0) return { amount: val, currency: 'GBP' };
  }

  // 5. SGD matching (S$ or SGD)
  const sgdMatch =
    text.match(
      /(?:total|amount|charged|paid)\s*:?\s*(?:s\$|sgd)\s*([0-9]+(?:\.[0-9]{2})?)/i
    ) || text.match(/(?:s\$|sgd)\s*([0-9]+(?:\.[0-9]{2})?)/i);

  if (sgdMatch && sgdMatch[1]) {
    const val = parseFloat(sgdMatch[1]);
    if (val > 0) return { amount: val, currency: 'SGD' };
  }

  // 6. JPY matching (¥ or JPY)
  const jpyMatch =
    text.match(
      /(?:total|amount|charged)\s*:?\s*(?:jpy|¥)\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)/i
    ) || text.match(/(?:jpy|¥)\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)/i);

  if (jpyMatch && jpyMatch[1]) {
    const val = parseFloat(jpyMatch[1].replace(/,/g, ''));
    if (val > 0) return { amount: val, currency: 'JPY' };
  }

  // 7. AUD matching (A$ or AUD)
  const audMatch =
    text.match(
      /(?:total|amount|charged)\s*:?\s*(?:a\$|au\$|aud)\s*([0-9]+(?:\.[0-9]{2})?)/i
    ) || text.match(/(?:a\$|au\$|aud)\s*([0-9]+(?:\.[0-9]{2})?)/i);

  if (audMatch && audMatch[1]) {
    const val = parseFloat(audMatch[1]);
    if (val > 0) return { amount: val, currency: 'AUD' };
  }

  // 8. MYR matching (RM or MYR)
  const myrMatch =
    text.match(
      /(?:total|amount|charged)\s*:?\s*(?:rm|myr)\s*([0-9]+(?:\.[0-9]{2})?)/i
    ) || text.match(/(?:rm|myr)\s*([0-9]+(?:\.[0-9]{2})?)/i);

  if (myrMatch && myrMatch[1]) {
    const val = parseFloat(myrMatch[1]);
    if (val > 0) return { amount: val, currency: 'MYR' };
  }

  return null;
}

export function parseEmailReceiptClient(
  email: {
    id: string;
    subject?: string;
    from?: string;
    date?: string;
    snippet?: string;
    bodyText?: string;
    headers?: Record<string, string>;
  },
  knownAccounts: BankAccount[] = [],
  userTrustedRules: UserTrustedDomainRule[] = []
): Expense | null {
  const subject = email.headers?.subject || email.subject || '';
  const from = email.headers?.from || email.from || '';
  const snippet = email.snippet || '';
  const bodyText = email.bodyText || '';
  const fullText = `${subject} ${from} ${snippet} ${bodyText}`;
  const lowerText = fullText.toLowerCase();

  // Tier 1: SENDER PROVENANCE HARD GATE
  // Verify sender domain against the verified merchant / bank allowlist.
  // Unverified or spoofed sender domains are rejected immediately.
  const provenance = verifySenderProvenance(from, userTrustedRules);
  if (!provenance.isVerified) {
    return null;
  }

  // Tier 2: Intent & Negative Disqualification Gate (Noise reduction)
  const intent = classifyEmailIntent(subject, from, `${snippet} ${bodyText}`);
  if (!intent.isTransaction) {
    return null;
  }

  // Tier 3: Anchored Amount Extraction
  const amountRes = extractAnchoredAmount(fullText);
  if (!amountRes || amountRes.amount <= 0) {
    return null;
  }

  const amount = amountRes.amount;
  const detectedCurrency = amountRes.currency;

  // Indonesian & Global Bank / Payment Method Detection
  let bankSource = 'Bank Account';
  let paymentMethod = 'Bank Transfer';
  let matchedBankAccountId: string | undefined = undefined;

  if (
    /mybca|m-bca|mbca|klikbca|bca\s+mobile|bca\s+tahapan|paspor\s+bca|kartu\s+kredit\s+bca|ebanking@bca|alert@bca|\bbca\b/i.test(
      lowerText
    )
  ) {
    const isMyBCA = /mybca|my\s+bca/i.test(lowerText);
    const isBCAMobile = /bca\s+mobile|m-bca/i.test(lowerText);
    bankSource = 'Bank Central Asia (BCA)';
    paymentMethod = /qris/i.test(lowerText)
      ? `BCA QRIS (${isMyBCA ? 'myBCA' : isBCAMobile ? 'BCA mobile' : 'BCA'})`
      : /kartu kredit|credit card/i.test(lowerText)
        ? 'BCA Credit Card'
        : /paspor bca|debit/i.test(lowerText)
          ? 'BCA Paspor Debit'
          : isMyBCA
            ? 'myBCA Transfer / VA'
            : 'BCA Virtual Account / Transfer';
  } else if (
    /blu\s+by\s+bca|bcadigital|haloblu|\bblu\b|bluaccount|bludebit/i.test(
      lowerText
    )
  ) {
    bankSource = 'blu by BCA Digital (BCA Group)';
    paymentMethod = /qris/i.test(lowerText) ? 'blu QRIS' : 'blu by BCA Digital';
  } else if (
    /wondr|wonder|bnicall|bni\.co\.id|bank\s+negara\s+indonesia|\bbni\b|taplus\s+bni|bni\s+mobile/i.test(
      lowerText
    )
  ) {
    bankSource = 'Bank Negara Indonesia (BNI)';
    paymentMethod = /wondr|wonder/i.test(lowerText)
      ? 'wondr by BNI'
      : /qris/i.test(lowerText)
        ? 'BNI QRIS'
        : 'BNI Taplus Debit';
  } else if (
    /mandiricare|bankmandiri|livin|mandiri\s+tabungan|mandiri\s+everyday|kopra|\bmandiri\b/i.test(
      lowerText
    )
  ) {
    bankSource = 'Bank Mandiri';
    paymentMethod = /livin/i.test(lowerText)
      ? "Livin' by Mandiri"
      : /kartu kredit|credit card/i.test(lowerText)
        ? 'Mandiri Credit Card'
        : /bi-fast/i.test(lowerText)
          ? "Mandiri BI-FAST (Livin')"
          : 'Mandiri Debit / Transfer';
  } else if (
    /brimo|bank\s+rakyat\s+indonesia|bri\.co\.id|\bbri\b|britama|simpedes|ceria\s+bri/i.test(
      lowerText
    )
  ) {
    bankSource = 'Bank Rakyat Indonesia (BRI)';
    paymentMethod = /brimo/i.test(lowerText)
      ? 'BRImo (Bank BRI)'
      : /qris/i.test(lowerText)
        ? 'BRImo QRIS'
        : 'BRI BritAma Debit';
  } else if (
    /byond|bsi\s+mobile|bankbsi|\bbsi\b|hasanah|syariah\s+indonesia/i.test(
      lowerText
    )
  ) {
    bankSource = 'Bank Syariah Indonesia (BSI)';
    paymentMethod = /byond/i.test(lowerText)
      ? 'BYOND by BSI'
      : 'BSI Mobile Hasanah';
  } else if (
    /bal[eé]|btn\s+mobile|bank\s+btn|\bbtn\b|btncontactcenter|tabungan\s+batara/i.test(
      lowerText
    )
  ) {
    bankSource = 'Bank Tabungan Negara (BTN)';
    paymentMethod = /bal[eé]/i.test(lowerText) ? 'balé by BTN' : 'BTN Mobile';
  } else if (
    /jenius|btpn\.com|\bbtpn\b|cashtag|m-card|e-card|x-card|flexi\s+saver/i.test(
      lowerText
    )
  ) {
    bankSource = 'Bank BTPN (Jenius)';
    paymentMethod = /m-card/i.test(lowerText)
      ? 'Jenius m-Card (BTPN)'
      : /e-card/i.test(lowerText)
        ? 'Jenius e-Card (BTPN)'
        : 'Jenius (Bank BTPN)';
  } else if (
    /cimb|octo\s*mobile|octo\s*clicks|octo\s*pay|cimbniaga/i.test(lowerText)
  ) {
    bankSource = 'Bank CIMB Niaga';
    paymentMethod = /octo/i.test(lowerText)
      ? 'OCTO Mobile CIMB'
      : 'CIMB Niaga Transfer';
  } else if (
    /jago\.com|bank\s+jago|\bjago\b|kantong\s+utama|jago\s+pocket/i.test(
      lowerText
    )
  ) {
    bankSource = 'Bank Jago';
    paymentMethod = /visa|kartu debit/i.test(lowerText)
      ? 'Jago Visa Debit'
      : 'Bank Jago Kantong';
  } else if (/permata|permatame|permatamobile/i.test(lowerText)) {
    bankSource = 'PermataBank';
    paymentMethod = /permatame/i.test(lowerText)
      ? 'PermataME'
      : 'PermataMobile X';
  } else if (/d-bank|dbank|bank\s+danamon|\bdanamon\b/i.test(lowerText)) {
    bankSource = 'Bank Danamon';
    paymentMethod = 'D-Bank PRO (Danamon)';
  } else if (/m-smile|msmile|bank\s+mega|\bmega\b/i.test(lowerText)) {
    bankSource = 'Bank Mega';
    paymentMethod = 'M-Smile (Bank Mega)';
  } else if (
    /ocbc\s*mobile|one\s*mobile|ocbc\s*nisp|\bocbc\b/i.test(lowerText)
  ) {
    bankSource = 'Bank OCBC NISP';
    paymentMethod = 'OCBC mobile';
  } else if (
    /panin\s*mobile|panin\s*digital|bank\s+panin|\bpanin\b/i.test(lowerText)
  ) {
    bankSource = 'Bank Panin';
    paymentMethod = 'Panin Mobile';
  } else if (/superbank/i.test(lowerText)) {
    bankSource = 'Superbank Indonesia';
    paymentMethod = 'Superbank';
  } else if (/seabank/i.test(lowerText)) {
    bankSource = 'SeaBank Indonesia';
    paymentMethod = 'SeaBank Transfer';
  } else if (/neobank|bank\s+neo\s+commerce|\bbnc\b/i.test(lowerText)) {
    bankSource = 'Bank Neo Commerce';
    paymentMethod = 'Neobank (BNC)';
  } else if (/allobank|\ballo\b/i.test(lowerText)) {
    bankSource = 'Allo Bank Indonesia';
    paymentMethod = 'Allo Bank';
  } else if (/line\s*bank|keb\s*hana/i.test(lowerText)) {
    bankSource = 'LINE Bank (Hana Bank)';
    paymentMethod = 'LINE Bank';
  } else if (/tmrw|uob\s+indonesia|\buob\b/i.test(lowerText)) {
    bankSource = 'Bank UOB Indonesia (TMRW)';
    paymentMethod = 'TMRW by UOB';
  } else if (/digibank|dbs\s+indonesia|\bdbs\b/i.test(lowerText)) {
    bankSource = 'Bank DBS Indonesia (digibank)';
    paymentMethod = 'digibank by DBS';
  } else if (/simobi|sinarmas/i.test(lowerText)) {
    bankSource = 'Bank Sinarmas';
    paymentMethod = 'SimobiPlus';
  } else if (/muamalat/i.test(lowerText)) {
    bankSource = 'Bank Muamalat Indonesia';
    paymentMethod = 'Muamalat DIN';
  } else if (/maybank|m2u/i.test(lowerText)) {
    bankSource = 'Bank Maybank Indonesia';
    paymentMethod = 'M2U ID (Maybank)';
  } else if (/bank\s+raya|\braya\b/i.test(lowerText)) {
    bankSource = 'Bank Raya (BRI Group)';
    paymentMethod = 'Raya App';
  } else if (/gopay|gojek|goto/i.test(lowerText)) {
    bankSource = 'GoPay Indonesia (GoTo / Bank Jago)';
    paymentMethod = 'GoPay Balance';
  } else if (/ovo\.id|\bovo\b/i.test(lowerText)) {
    bankSource = 'OVO (PT Visionet)';
    paymentMethod = 'OVO Cash';
  } else if (/dana\.id|\bdana\b/i.test(lowerText)) {
    bankSource = 'DANA (PT Espay)';
    paymentMethod = 'DANA Saldo';
  } else if (/shopeepay|shopee/i.test(lowerText)) {
    bankSource = 'ShopeePay';
    paymentMethod = /spaylater/i.test(lowerText)
      ? 'SPayLater'
      : 'ShopeePay Balance';
  } else if (/linkaja/i.test(lowerText)) {
    bankSource = 'LinkAja';
    paymentMethod = 'LinkAja Saldo';
  } else if (/astrapay/i.test(lowerText)) {
    bankSource = 'AstraPay (Astra Group)';
    paymentMethod = 'AstraPay Saldo';
  } else if (/chase/i.test(lowerText)) {
    bankSource = 'Chase Bank';
    paymentMethod = 'Chase Visa';
  } else if (/bank of america|boa/i.test(lowerText)) {
    bankSource = 'Bank of America';
    paymentMethod = 'BoA Debit';
  } else if (/paypal/i.test(lowerText)) {
    bankSource = 'PayPal';
    paymentMethod = 'PayPal Balance';
  } else if (/apple card|apple pay/i.test(lowerText)) {
    bankSource = 'Apple Card';
    paymentMethod = 'Apple Pay';
  }

  // Extract card/account mask
  const maskMatch =
    fullText.match(
      /(?:mastercard|visa|jcb|amex|card|kartu|rekening|ending in|ending with|\*{3,4}|••••|\.\.\.)[-\s:]*([0-9]{4})\b/i
    ) || fullText.match(/([0-9]{4})\s*(?:berhasil|sukses|pada)/i);
  if (maskMatch) {
    if (/mastercard/i.test(fullText) && bankSource === 'Bank Account') {
      bankSource = 'Mastercard';
      paymentMethod = `Mastercard •••• ${maskMatch[1]}`;
    } else if (/visa/i.test(fullText) && bankSource === 'Bank Account') {
      bankSource = 'Visa';
      paymentMethod = `Visa •••• ${maskMatch[1]}`;
    } else if (!paymentMethod.includes('••••')) {
      paymentMethod += ` •••• ${maskMatch[1]}`;
    }
  }

  // Match against known accounts
  if (knownAccounts.length > 0) {
    const matched = knownAccounts.find((acc) => {
      const inst = acc.institution.toLowerCase();
      const accName = acc.name.toLowerCase();
      const bSource = bankSource.toLowerCase();
      const pMethod = paymentMethod.toLowerCase();
      return (
        bSource.includes(inst) ||
        inst.includes(bSource) ||
        pMethod.includes(inst) ||
        pMethod.includes(accName) ||
        (maskMatch && acc.accountNumberMask.includes(maskMatch[1]))
      );
    });
    if (matched) {
      matchedBankAccountId = matched.id;
      bankSource = matched.name;
    }
  }

  // Extract Order / Reference Number if present
  const orderMatch = fullText.match(
    /(?:nomor\s+pesanan|order\s+id|no\.\s*pesanan|reference\s*no|nomor\s+transaksi)\s*:?\s*([A-Za-z0-9\.\-_]{6,30})/i
  );
  const notes = orderMatch ? `Nomor Pesanan: ${orderMatch[1]}` : undefined;

  // Merchant & Specific Service Detection
  let merchant = 'Unknown Merchant';
  let detectedTitle: string | undefined = undefined;
  let items: { name: string; qty?: number; price?: number }[] | undefined =
    undefined;

  // 1. Google Suite & Cloud Products
  if (/google\s*ai\s*pro/i.test(lowerText)) {
    merchant = 'Google Play';
    detectedTitle = 'Google AI Pro (5 TB) - Google One';
    items = [
      { name: 'Google AI Pro (5 TB) (Google One)', qty: 1, price: 77000 },
      { name: 'Pajak (VAT / PPN)', qty: 1, price: 8470 },
    ];
  } else if (/google\s*cloud|gcp|google\s*cloud\s*platform/i.test(lowerText)) {
    merchant = 'Google Cloud Platform';
    detectedTitle = 'Google Cloud Platform (GCP) Services';
  } else if (/google\s*workspace|g\s*suite/i.test(lowerText)) {
    merchant = 'Google Workspace';
    detectedTitle = 'Google Workspace Subscription';
  } else if (/google\s*ads|adwords/i.test(lowerText)) {
    merchant = 'Google Ads';
    detectedTitle = 'Google Ads Campaign Billing';
  } else if (/google\s*one/i.test(lowerText)) {
    merchant = 'Google One';
    if (/2\s*tb/i.test(lowerText)) {
      detectedTitle = 'Google One (2 TB Storage Plan)';
    } else if (/100\s*gb/i.test(lowerText)) {
      detectedTitle = 'Google One (100 GB Storage Plan)';
    } else if (/200\s*gb/i.test(lowerText)) {
      detectedTitle = 'Google One (200 GB Storage Plan)';
    } else {
      detectedTitle = 'Google One Cloud Storage';
    }
  } else if (/youtube\s*premium|youtube\s*music/i.test(lowerText)) {
    merchant = 'YouTube';
    detectedTitle = /family/i.test(lowerText)
      ? 'YouTube Premium Family Plan'
      : 'YouTube Premium Membership';
  } else if (/google\s*play/i.test(lowerText)) {
    merchant = 'Google Play';
    detectedTitle = 'Google Play Digital Services';
  }

  // 2. Cloud Infrastructure & Developer Tools
  else if (
    /amazon\s*web\s*services|aws\s*billing|aws\s*notification|\baws\b/i.test(
      lowerText
    )
  ) {
    merchant = 'Amazon Web Services (AWS)';
    detectedTitle = 'AWS Cloud Infrastructure & Compute';
  } else if (/microsoft\s*azure|azure\s*cloud|\bazure\b/i.test(lowerText)) {
    merchant = 'Microsoft Azure';
    detectedTitle = 'Microsoft Azure Cloud Services';
  } else if (/microsoft\s*365|office\s*365/i.test(lowerText)) {
    merchant = 'Microsoft';
    detectedTitle = 'Microsoft 365 Subscription';
  } else if (/chatgpt|openai/i.test(lowerText)) {
    merchant = 'OpenAI';
    detectedTitle = /team/i.test(lowerText)
      ? 'ChatGPT Team Subscription'
      : 'ChatGPT Plus Subscription';
  } else if (/claude\s*pro|anthropic/i.test(lowerText)) {
    merchant = 'Anthropic';
    detectedTitle = 'Claude Pro AI Subscription';
  } else if (/github\s*copilot|github/i.test(lowerText)) {
    merchant = 'GitHub';
    detectedTitle = /copilot/i.test(lowerText)
      ? 'GitHub Copilot Subscription'
      : 'GitHub Subscription';
  } else if (/cursor\s*(?:ai|pro)|anysphere/i.test(lowerText)) {
    merchant = 'Cursor AI';
    detectedTitle = 'Cursor Pro Subscription';
  } else if (/midjourney/i.test(lowerText)) {
    merchant = 'Midjourney';
    detectedTitle = 'Midjourney AI Subscription';
  } else if (/vercel/i.test(lowerText)) {
    merchant = 'Vercel';
    detectedTitle = 'Vercel Pro Plan';
  } else if (/supabase/i.test(lowerText)) {
    merchant = 'Supabase';
    detectedTitle = 'Supabase Pro Cloud Database';
  } else if (/cloudflare/i.test(lowerText)) {
    merchant = 'Cloudflare';
    detectedTitle = 'Cloudflare Pro & Domain Services';
  } else if (/digitalocean/i.test(lowerText)) {
    merchant = 'DigitalOcean';
    detectedTitle = 'DigitalOcean Cloud Droplets';
  } else if (/docker/i.test(lowerText)) {
    merchant = 'Docker';
    detectedTitle = 'Docker Pro Subscription';
  }

  // 3. SaaS, Productivity & Creative Tools
  else if (/notion/i.test(lowerText)) {
    merchant = 'Notion';
    detectedTitle = 'Notion Plus Workspace';
  } else if (/figma/i.test(lowerText)) {
    merchant = 'Figma';
    detectedTitle = 'Figma Professional Plan';
  } else if (/canva/i.test(lowerText)) {
    merchant = 'Canva';
    detectedTitle = 'Canva Pro Subscription';
  } else if (/adobe/i.test(lowerText)) {
    merchant = 'Adobe';
    detectedTitle = 'Adobe Creative Cloud';
  } else if (/zoom\s*(?:video|\.us)/i.test(lowerText)) {
    merchant = 'Zoom';
    detectedTitle = 'Zoom Pro Communications';
  } else if (/slack\s*technologies|\bslack\b/i.test(lowerText)) {
    merchant = 'Slack';
    detectedTitle = 'Slack Pro Workspace';
  } else if (/atlassian|jira|confluence|trello/i.test(lowerText)) {
    merchant = 'Atlassian';
    detectedTitle = 'Atlassian Cloud Services (Jira / Confluence)';
  } else if (/grammarly/i.test(lowerText)) {
    merchant = 'Grammarly';
    detectedTitle = 'Grammarly Premium';
  } else if (/dropbox/i.test(lowerText)) {
    merchant = 'Dropbox';
    detectedTitle = 'Dropbox Plus Storage';
  } else if (/1password|agilebits/i.test(lowerText)) {
    merchant = '1Password';
    detectedTitle = '1Password Family / Individual';
  } else if (/hostinger|niagahoster|namecheap|godaddy/i.test(lowerText)) {
    merchant = /hostinger/i.test(lowerText)
      ? 'Hostinger'
      : /niagahoster/i.test(lowerText)
        ? 'Niagahoster'
        : /namecheap/i.test(lowerText)
          ? 'Namecheap'
          : 'GoDaddy';
    detectedTitle = 'Domain & Web Hosting Services';
  }

  // 4. Indonesian & Regional Superapps & Merchant Ecosystem
  else if (/gofood|gojek|goride|gocar|gosend|gomart/i.test(lowerText)) {
    merchant = /gofood/i.test(lowerText)
      ? 'GoFood Indonesia'
      : 'Gojek Ride & Delivery';
  } else if (/grabfood|grabcar|grabbike|grab/i.test(lowerText)) {
    merchant = /grabfood/i.test(lowerText)
      ? 'GrabFood Indonesia'
      : 'Grab Transport';
  } else if (/tokopedia/i.test(lowerText)) {
    merchant = 'Tokopedia';
  } else if (/shopee/i.test(lowerText)) {
    merchant = 'Shopee Indonesia';
  } else if (/blibli/i.test(lowerText)) {
    merchant = 'Blibli';
  } else if (/indomaret|klikindomaret/i.test(lowerText)) {
    merchant = 'Indomaret';
  } else if (/alfamart|alfagift/i.test(lowerText)) {
    merchant = 'Alfamart';
  } else if (/pertamina|spbu/i.test(lowerText)) {
    merchant = 'SPBU Pertamina';
  } else if (/shell/i.test(lowerText)) {
    merchant = 'Shell Station';
  } else if (/pln|token listrik|stroom/i.test(lowerText)) {
    merchant = 'PLN Listrik';
  } else if (/telkomsel|mytelkomsel|halo\+/i.test(lowerText)) {
    merchant = 'Telkomsel';
  } else if (/indosat|myim3/i.test(lowerText)) {
    merchant = 'Indosat Ooredoo';
  } else if (/xl axiata|myxl/i.test(lowerText)) {
    merchant = 'XL Axiata';
  } else if (/kopi kenangan/i.test(lowerText)) {
    merchant = 'Kopi Kenangan';
  } else if (/janji jiwa/i.test(lowerText)) {
    merchant = 'Kopi Janji Jiwa';
  } else if (/fore coffee/i.test(lowerText)) {
    merchant = 'Fore Coffee';
  } else if (/starbucks/i.test(lowerText)) {
    merchant = 'Starbucks Coffee';
  } else if (/mcdonald|mcd/i.test(lowerText)) {
    merchant = "McDonald's Indonesia";
  } else if (/kfc/i.test(lowerText)) {
    merchant = 'KFC Indonesia';
  } else if (/cinema 21|cinema xxi|tix id|cgv/i.test(lowerText)) {
    merchant = 'Cinema XXI / TIX ID';
  } else if (/traveloka/i.test(lowerText)) {
    merchant = 'Traveloka';
  } else if (/tiket\.com/i.test(lowerText)) {
    merchant = 'Tiket.com';
  }

  // 5. Streaming & Media
  else if (/spotify/i.test(lowerText)) {
    merchant = 'Spotify';
    detectedTitle = /family/i.test(lowerText)
      ? 'Spotify Premium Family'
      : 'Spotify Premium';
  } else if (/netflix/i.test(lowerText)) {
    merchant = 'Netflix';
    detectedTitle = /premium|4k/i.test(lowerText)
      ? 'Netflix Premium (4K Ultra HD)'
      : 'Netflix Subscription';
  } else if (/disney\+?\s*hotstar|disney/i.test(lowerText)) {
    merchant = 'Disney+ Hotstar';
    detectedTitle = 'Disney+ Hotstar Subscription';
  } else if (/vidio/i.test(lowerText)) {
    merchant = 'Vidio';
    detectedTitle = /diamond/i.test(lowerText)
      ? 'Vidio Premier Diamond'
      : 'Vidio Premier Platinum';
  } else if (/prime\s*video|amazon\s*prime/i.test(lowerText)) {
    merchant = 'Amazon Prime Video';
    detectedTitle = 'Amazon Prime Video Subscription';
  } else if (/hbo\s*(?:go|max)/i.test(lowerText)) {
    merchant = 'HBO Max / HBO GO';
    detectedTitle = 'HBO Subscription';
  } else if (/steam|valve/i.test(lowerText)) {
    merchant = 'Steam Games';
    detectedTitle = 'Steam Game Purchase';
  } else if (/playstation|sony\s*interactive/i.test(lowerText)) {
    merchant = 'PlayStation Network';
    detectedTitle = /plus/i.test(lowerText)
      ? 'PlayStation Plus Membership'
      : 'PlayStation Store Purchase';
  } else if (/apple|itunes|icloud/i.test(lowerText)) {
    merchant = 'Apple Services';
    detectedTitle = /icloud/i.test(lowerText)
      ? 'iCloud+ Storage Subscription'
      : /apple\s*one/i.test(lowerText)
        ? 'Apple One Plan'
        : 'Apple Media Services';
  } else if (/amazon/i.test(lowerText)) {
    merchant = 'Amazon';
  } else if (/uber/i.test(lowerText)) {
    merchant = 'Uber';
  } else if (subject) {
    const cleanSub = subject
      .replace(
        /notifikasi|transaksi|rekening|bukti|transfer|resi|pembayaran|struk|invoice|receipt|alert|your/gi,
        ''
      )
      .trim();
    if (cleanSub) merchant = cleanSub.slice(0, 32);
  }

  // Category detection
  let category: ExpenseCategory = 'Shopping & Retail';
  if (
    /gofood|grabfood|restaurant|resto|makan|food|dining|cafe|coffee|kopi|starbucks|mcdonald|kfc|pizza|bakso|sederhana|sate/i.test(
      lowerText
    )
  ) {
    category = 'Dining & Food';
  } else if (
    /indomaret|alfamart|supermarket|groceries|hypermart|superindo|sayurbox|pasar|sembako|beras|minyak/i.test(
      lowerText
    )
  ) {
    category = 'Groceries';
  } else if (
    /google\s*cloud|aws|amazon\s*web\s*services|azure|cloudflare|digitalocean|supabase|vercel|docker|hostinger|niagahoster|namecheap|godaddy/i.test(
      lowerText
    )
  ) {
    category = 'Utilities & Bills';
  } else if (
    /google\s*ai|google\s*one|google\s*play|chatgpt|openai|claude|anthropic|github|copilot|cursor|midjourney|notion|figma|canva|adobe|zoom|slack|atlassian|grammarly|dropbox|1password|netflix|spotify|youtube|disney|vidio|prime video|steam|playstation|game|bioskop|xxi|cgv|tix id|langganan|subscription/i.test(
      lowerText
    )
  ) {
    category = 'Entertainment & Subscriptions';
  } else if (
    /tokopedia|shopee|blibli|lazada|retail|mall|uniqlo|zara|h&m|ace hardware|informa|belanja/i.test(
      lowerText
    )
  ) {
    category = 'Shopping & Retail';
  } else if (
    /pln|listrik|telkomsel|indosat|pulsa|paket data|wifi|indihome|biznet|pdam|air|iuran|tagihan|utility|bills/i.test(
      lowerText
    )
  ) {
    category = 'Utilities & Bills';
  } else if (
    /goride|gocar|grab|grabcar|grabbike|spbu|pertamina|shell|bensin|bbm|tol|etoll|taxi|kereta|kai|pesawat|tiket|traveloka|flight|uber/i.test(
      lowerText
    )
  ) {
    category = 'Travel & Transportation';
  } else if (
    /apotek|kimia farma|k24|dokter|klinik|rumah sakit|gym|fitness|halodoc|alodokter|obat|vitamin/i.test(
      lowerText
    )
  ) {
    category = 'Health & Wellness';
  } else if (
    /biaya admin|bunga|fee|transfer fee|pajak|tax|denda/i.test(lowerText)
  ) {
    category = 'Financial & Fees';
  } else if (
    /kost|sewa|kontrak|apartemen|ipl|maintenance fee|rent|housing/i.test(
      lowerText
    )
  ) {
    category = 'Housing & Rent';
  }

  const isRecurring =
    /subscription|monthly|renewal|recurring|billing cycle|langganan|tiap bulan|bulanan|autodebet|\/bulan|\/month|\/mo|\/yr|\/year/i.test(
      lowerText
    );
  const isAnnual = /annual|yearly|\/tahun|\/thn|\/year|\/yr|12 months/i.test(
    lowerText
  );

  // Tier 4: Merchant-Domain Consistency Cross-Check
  const crossCheck = crossCheckMerchantWithDomain(
    merchant,
    provenance.senderDomain
  );
  if (!crossCheck.isConsistent) {
    return null;
  }

  return {
    id: `exp_mail_${email.id}`,
    emailId: email.id,
    title:
      detectedTitle ||
      subject ||
      `${merchant} (${detectedCurrency === 'IDR' ? 'Pengeluaran' : 'Expense'})`,
    merchant,
    amount,
    currency: detectedCurrency,
    category,
    date: email.date
      ? new Date(email.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    type: 'debit',
    bankAccountId: matchedBankAccountId,
    paymentMethod,
    bankAccountName: bankSource,
    confidenceScore: 0.98,
    isRecurring,
    recurringFrequency: isRecurring
      ? isAnnual
        ? 'yearly'
        : 'monthly'
      : undefined,
    notes,
    items,
    source: 'gmail_sync',
    senderDomain: provenance.senderDomain,
    isDomainVerified: true,
    claimedMerchant: merchant,
    provenanceStatus: 'verified_allowlist',
    emailMetadata: {
      subject: subject || 'Bukti Transaksi',
      sender: from || 'Bank Notification',
      senderDomain: provenance.senderDomain,
      dateReceived: email.date || new Date().toISOString(),
      snippet: snippet || '',
    },
    tags: [
      category.toLowerCase().split(' ')[0],
      merchant.toLowerCase().replace(/[^a-z0-9]/g, ''),
    ],
  };
}
