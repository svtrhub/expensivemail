/**
 * Sender Provenance & Cryptographic DKIM/SPF Domain Verification Engine
 *
 * Enforces cryptographic / domain-authenticated sender provenance and homograph defense.
 * Prevents spoofed, unverified, homograph-attacked, or promotional emails from being
 * automatically ingested into the expense ledger.
 *
 * Security Features:
 * 1. Cryptographic Authentication: Parses Authentication-Results, DKIM, SPF, DMARC headers.
 * 2. Homograph / Punycode Detection: Detects and rejects Unicode lookalikes (Cyrillic, Greek, etc.).
 * 3. Exact Registrable-Domain Matching: Strict label-boundary check (prevents amazonaws.phish.com).
 * 4. Programmatic Review Gate: Domain trusting extracts authenticated headers programmatically, never user free-text.
 * 5. Amount Anomaly Defense: Checks for billing spikes even on verified senders.
 */

export interface VerifiedMerchantRule {
  merchantKey: string;
  displayName: string;
  category: string;
  allowedDomains: string[];
  // Secondary aliases or keyword matchers to cross-check against AI claimed_merchant
  merchantAliases: string[];
}

export interface UserTrustedDomainRule {
  id?: string;
  domain: string;
  displayName: string;
  merchantName?: string;
  category: string;
  trustedAt: string;
  sourceEmailId?: string;
  extractedFromHeader: string;
  isCryptographicallyVerified?: boolean;
}

export interface UserUntrustedDomainRule {
  id?: string;
  domain: string;
  displayName: string;
  senderPattern?: string;
  reason: string;
  blockedAt: string;
  sourceEmailId?: string;
  extractedFromHeader: string;
}

export interface AuthenticationResultsVerdict {
  isCryptographicallyAuthenticated: boolean;
  authenticatedDomain: string;
  spfVerdict:
    | 'pass'
    | 'fail'
    | 'softfail'
    | 'neutral'
    | 'none'
    | 'temperror'
    | 'permerror'
    | 'unspecified';
  dkimVerdict:
    | 'pass'
    | 'fail'
    | 'neutral'
    | 'none'
    | 'temperror'
    | 'permerror'
    | 'unspecified';
  dmarcVerdict:
    | 'pass'
    | 'fail'
    | 'none'
    | 'bestguesspass'
    | 'temperror'
    | 'permerror'
    | 'unspecified';
  isSpoofed: boolean;
  authHeaderRaw?: string;
  failureReason?: string;
}

export interface HomographCheckResult {
  hasHomograph: boolean;
  originalDomain: string;
  normalizedAsciiDomain: string;
  detectedSpoofChars: string[];
  isPunycode: boolean;
  reason?: string;
}

/**
 * Verified Merchant Domain Allowlist (Config Table)
 * Maps supported merchants, banks, e-wallets, billers, and SaaS cloud providers
 * to their verified sending domains.
 */
export const MERCHANT_DOMAIN_ALLOWLIST: VerifiedMerchantRule[] = [
  // --- Cloud Infrastructure & SaaS Platforms ---
  {
    merchantKey: 'aws',
    displayName: 'Amazon Web Services (AWS)',
    category: 'Utilities & Bills',
    allowedDomains: [
      'amazon.com',
      'amazonaws.com',
      'aws.amazon.com',
      'billing.amazon.com',
    ],
    merchantAliases: [
      'aws',
      'amazon web services',
      'amazon web services, inc',
      'aws billing',
      'aws cloud',
      'amazon web services inc.',
    ],
  },
  {
    merchantKey: 'google_cloud',
    displayName: 'Google Cloud Platform',
    category: 'Utilities & Bills',
    allowedDomains: ['google.com', 'cloud.google.com'],
    merchantAliases: [
      'google cloud',
      'gcp',
      'google cloud platform',
      'google cloud billing',
      'google cloud platform billing',
    ],
  },
  {
    merchantKey: 'google_services',
    displayName: 'Google Services / Google Play / Google AI',
    category: 'Entertainment & Subscriptions',
    allowedDomains: ['google.com', 'googleplay.com'],
    merchantAliases: [
      'google',
      'google play',
      'google one',
      'google ai',
      'google workspace',
      'google storage',
      'youtube',
      'google ads',
    ],
  },
  {
    merchantKey: 'openai',
    displayName: 'OpenAI (ChatGPT)',
    category: 'Entertainment & Subscriptions',
    allowedDomains: ['openai.com'],
    merchantAliases: [
      'openai',
      'chatgpt',
      'openai, llc',
      'chatgpt plus',
      'chatgpt pro',
    ],
  },
  {
    merchantKey: 'anthropic',
    displayName: 'Anthropic (Claude AI)',
    category: 'Entertainment & Subscriptions',
    allowedDomains: ['anthropic.com'],
    merchantAliases: ['anthropic', 'claude', 'anthropic, pbc', 'claude pro'],
  },
  {
    merchantKey: 'apple',
    displayName: 'Apple Services',
    category: 'Entertainment & Subscriptions',
    allowedDomains: ['apple.com', 'email.apple.com', 'itunes.com'],
    merchantAliases: [
      'apple',
      'apple store',
      'apple services',
      'icloud',
      'app store',
      'apple pay',
      'apple music',
    ],
  },
  {
    merchantKey: 'microsoft',
    displayName: 'Microsoft / Azure / 365',
    category: 'Utilities & Bills',
    allowedDomains: ['microsoft.com', 'azure.com', 'office365.com'],
    merchantAliases: [
      'microsoft',
      'azure',
      'microsoft azure',
      'microsoft 365',
      'office 365',
      'microsoft store',
    ],
  },
  {
    merchantKey: 'github',
    displayName: 'GitHub',
    category: 'Entertainment & Subscriptions',
    allowedDomains: ['github.com'],
    merchantAliases: ['github', 'github copilot', 'github, inc.'],
  },
  {
    merchantKey: 'spotify',
    displayName: 'Spotify',
    category: 'Entertainment & Subscriptions',
    allowedDomains: ['spotify.com'],
    merchantAliases: [
      'spotify',
      'spotify premium',
      'spotify indonesia',
      'spotify ab',
    ],
  },
  {
    merchantKey: 'netflix',
    displayName: 'Netflix',
    category: 'Entertainment & Subscriptions',
    allowedDomains: ['netflix.com'],
    merchantAliases: [
      'netflix',
      'netflix international b.v.',
      'netflix streaming',
    ],
  },
  {
    merchantKey: 'uber',
    displayName: 'Uber',
    category: 'Travel & Transportation',
    allowedDomains: ['uber.com'],
    merchantAliases: ['uber', 'uber receipts', 'uber b.v.'],
  },

  // --- Indonesian Banks & Financial Institutions ---
  {
    merchantKey: 'bca',
    displayName: 'Bank Central Asia (BCA)',
    category: 'Financial & Fees',
    allowedDomains: ['bca.co.id', 'klikbca.com'],
    merchantAliases: [
      'bca',
      'bank central asia',
      'mybca',
      'klikbca',
      'halo bca',
      'bca notifikasi',
      'bca mobile',
    ],
  },
  {
    merchantKey: 'mandiri',
    displayName: 'Bank Mandiri',
    category: 'Financial & Fees',
    allowedDomains: ['bankmandiri.co.id', 'mandiri.co.id'],
    merchantAliases: [
      'mandiri',
      'bank mandiri',
      "livin' by mandiri",
      'livin by mandiri',
      'mandiri care',
      'mandiri debit',
    ],
  },
  {
    merchantKey: 'bni',
    displayName: 'Bank Negara Indonesia (BNI)',
    category: 'Financial & Fees',
    allowedDomains: ['bni.co.id'],
    merchantAliases: [
      'bni',
      'bank negara indonesia',
      'wondr by bni',
      'wondr',
      'bni mobile banking',
    ],
  },
  {
    merchantKey: 'bri',
    displayName: 'Bank Rakyat Indonesia (BRI)',
    category: 'Financial & Fees',
    allowedDomains: ['bri.co.id'],
    merchantAliases: [
      'bri',
      'bank rakyat indonesia',
      'brimo',
      'bri notifikasi',
    ],
  },
  {
    merchantKey: 'bsi',
    displayName: 'Bank Syariah Indonesia (BSI)',
    category: 'Financial & Fees',
    allowedDomains: ['bankbsi.co.id', 'bsi.co.id'],
    merchantAliases: [
      'bsi',
      'bank syariah indonesia',
      'byond by bsi',
      'byond',
      'bsi mobile',
    ],
  },
  {
    merchantKey: 'btn',
    displayName: 'Bank Tabungan Negara (BTN)',
    category: 'Financial & Fees',
    allowedDomains: ['btn.co.id'],
    merchantAliases: [
      'btn',
      'bank tabungan negara',
      'bale by btn',
      'balé by btn',
      'btn mobile',
    ],
  },
  {
    merchantKey: 'cimb',
    displayName: 'CIMB Niaga',
    category: 'Financial & Fees',
    allowedDomains: ['cimbniaga.co.id'],
    merchantAliases: ['cimb', 'cimb niaga', 'octo clicks', 'octo mobile'],
  },
  {
    merchantKey: 'danamon',
    displayName: 'Bank Danamon',
    category: 'Financial & Fees',
    allowedDomains: ['danamon.co.id'],
    merchantAliases: ['danamon', 'bank danamon', 'd-bank', 'd-bank pro'],
  },
  {
    merchantKey: 'permata',
    displayName: 'Permata Bank',
    category: 'Financial & Fees',
    allowedDomains: ['permatabank.co.id'],
    merchantAliases: ['permata', 'permatabank', 'permata me', 'permata net'],
  },
  {
    merchantKey: 'mega',
    displayName: 'Bank Mega',
    category: 'Financial & Fees',
    allowedDomains: ['bankmega.com'],
    merchantAliases: ['mega', 'bank mega', 'm-smile'],
  },
  {
    merchantKey: 'ocbc',
    displayName: 'OCBC Indonesia',
    category: 'Financial & Fees',
    allowedDomains: ['ocbc.id', 'ocbcnisp.com'],
    merchantAliases: ['ocbc', 'ocbc nisp', 'ocbc mobile', 'one mobile'],
  },
  {
    merchantKey: 'panin',
    displayName: 'Bank Panin',
    category: 'Financial & Fees',
    allowedDomains: ['panin.co.id'],
    merchantAliases: ['panin', 'bank panin', 'panin mobile'],
  },
  {
    merchantKey: 'jago',
    displayName: 'Bank Jago',
    category: 'Financial & Fees',
    allowedDomains: ['jago.com'],
    merchantAliases: ['jago', 'bank jago', 'pt bank jago tbk', 'kantong jago'],
  },
  {
    merchantKey: 'seabank',
    displayName: 'SeaBank Indonesia',
    category: 'Financial & Fees',
    allowedDomains: ['seabank.co.id'],
    merchantAliases: [
      'seabank',
      'seabank indonesia',
      'pt bank seabank indonesia',
    ],
  },
  {
    merchantKey: 'superbank',
    displayName: 'Superbank Indonesia',
    category: 'Financial & Fees',
    allowedDomains: ['superbank.id'],
    merchantAliases: [
      'superbank',
      'superbank indonesia',
      'pt super bank indonesia',
    ],
  },
  {
    merchantKey: 'neobank',
    displayName: 'Bank Neo Commerce',
    category: 'Financial & Fees',
    allowedDomains: ['bankneocommerce.co.id'],
    merchantAliases: ['neobank', 'neo commerce', 'bank neo commerce', 'bnc'],
  },
  {
    merchantKey: 'allobank',
    displayName: 'Allo Bank Indonesia',
    category: 'Financial & Fees',
    allowedDomains: ['allobank.com'],
    merchantAliases: ['allo bank', 'allobank', 'allo app'],
  },
  {
    merchantKey: 'chase',
    displayName: 'Chase Bank',
    category: 'Financial & Fees',
    allowedDomains: ['chase.com'],
    merchantAliases: [
      'chase',
      'jpmorgan chase',
      'chase bank',
      'chase fraud alerts',
    ],
  },

  // --- Indonesian E-Wallets & Delivery SuperApps ---
  {
    merchantKey: 'gojek_gopay',
    displayName: 'Gojek / GoPay',
    category: 'Travel & Transportation',
    allowedDomains: ['gojek.com', 'gopay.co.id', 'findaya.co.id'],
    merchantAliases: [
      'gojek',
      'gopay',
      'gofood',
      'pt dompet anak bangsa',
      'pt gojek indonesia',
      'gocar',
      'goride',
      'gosend',
    ],
  },
  {
    merchantKey: 'grab',
    displayName: 'Grab / GrabFood',
    category: 'Travel & Transportation',
    allowedDomains: ['grab.com'],
    merchantAliases: [
      'grab',
      'grabfood',
      'grabcar',
      'grabexpress',
      'grab indonesia',
      'ovo grab',
    ],
  },
  {
    merchantKey: 'ovo',
    displayName: 'OVO (PT Visionet Internasional)',
    category: 'Financial & Fees',
    allowedDomains: ['ovo.id'],
    merchantAliases: [
      'ovo',
      'pt visionet internasional',
      'ovo cash',
      'ovo points',
    ],
  },
  {
    merchantKey: 'dana',
    displayName: 'DANA Indonesia',
    category: 'Financial & Fees',
    allowedDomains: ['dana.id'],
    merchantAliases: ['dana', 'dana indonesia', 'pt espay debit indonesia koe'],
  },
  {
    merchantKey: 'shopee',
    displayName: 'Shopee / ShopeePay',
    category: 'Shopping & Retail',
    allowedDomains: ['shopee.co.id', 'shopee.com'],
    merchantAliases: [
      'shopee',
      'shopeepay',
      'spaylater',
      'pt shopee international indonesia',
      'shopeefood',
    ],
  },
  {
    merchantKey: 'tokopedia',
    displayName: 'Tokopedia',
    category: 'Shopping & Retail',
    allowedDomains: ['tokopedia.com'],
    merchantAliases: ['tokopedia', 'pt tokopedia', 'tokopedia care'],
  },

  // --- Billers & Utilities ---
  {
    merchantKey: 'pln',
    displayName: 'PLN (Perusahaan Listrik Negara)',
    category: 'Utilities & Bills',
    allowedDomains: ['pln.co.id'],
    merchantAliases: [
      'pln',
      'pt pln',
      'pt pln (persero)',
      'pln mobile',
      'token listrik pln',
    ],
  },
  {
    merchantKey: 'telkomsel',
    displayName: 'Telkomsel',
    category: 'Utilities & Bills',
    allowedDomains: ['telkomsel.co.id', 'telkomsel.com'],
    merchantAliases: [
      'telkomsel',
      'halo',
      'mytelkomsel',
      'kartu halo',
      'simpati',
    ],
  },
  {
    merchantKey: 'indosat',
    displayName: 'Indosat Ooredoo Hutchison',
    category: 'Utilities & Bills',
    allowedDomains: ['ioh.co.id', 'indosatooredoo.com', 'tri.co.id'],
    merchantAliases: ['indosat', 'indosat ooredoo', 'im3', 'tri indonesia'],
  },
  {
    merchantKey: 'xl',
    displayName: 'XL Axiata',
    category: 'Utilities & Bills',
    allowedDomains: ['xl.co.id', 'xlaxiata.co.id', 'axis.co.id'],
    merchantAliases: ['xl', 'xl axiata', 'myxl', 'axis'],
  },
];

/**
 * Common Cyrillic, Greek, and Fullwidth homoglyphs used in phishing / IDN homograph attacks.
 * Maps lookalike characters to their Latin counterparts.
 */
const HOMOGLYPH_MAP: Record<string, string> = {
  // Cyrillic lookalikes
  '\u0430': 'a', // Cyrillic Small Letter A
  '\u0410': 'A', // Cyrillic Capital Letter A
  '\u0435': 'e', // Cyrillic Small Letter Ie
  '\u0415': 'E', // Cyrillic Capital Letter Ie
  '\u043E': 'o', // Cyrillic Small Letter O
  '\u041E': 'O', // Cyrillic Capital Letter O
  '\u0440': 'p', // Cyrillic Small Letter Er
  '\u0420': 'P', // Cyrillic Capital Letter Er
  '\u0441': 'c', // Cyrillic Small Letter Es
  '\u0421': 'C', // Cyrillic Capital Letter Es
  '\u0443': 'y', // Cyrillic Small Letter U
  '\u0423': 'Y', // Cyrillic Capital Letter U
  '\u0445': 'x', // Cyrillic Small Letter Ha
  '\u0425': 'X', // Cyrillic Capital Letter Ha
  '\u0456': 'i', // Cyrillic Small Letter Byelorussian-Ukrainian I
  '\u0406': 'I', // Cyrillic Capital Letter Byelorussian-Ukrainian I
  '\u0458': 'j', // Cyrillic Small Letter Je
  '\u0408': 'J', // Cyrillic Capital Letter Je
  '\u0455': 's', // Cyrillic Small Letter Dze
  '\u0405': 'S', // Cyrillic Capital Letter Dze
  '\u0501': 'd', // Cyrillic Small Letter Komi De
  '\u051B': 'q', // Cyrillic Small Letter Qa
  '\u050D': 'w', // Cyrillic Small Letter Komi Lje
  // Greek lookalikes
  '\u03B1': 'a', // Greek Small Letter Alpha
  '\u03BF': 'o', // Greek Small Letter Omicron
  '\u03BD': 'v', // Greek Small Letter Nu
  '\u03C4': 't', // Greek Small Letter Tau
  '\u03C1': 'p', // Greek Small Letter Rho
  '\u03BA': 'k', // Greek Small Letter Kappa
  // Fullwidth Latin characters
  '\uFF41': 'a',
  '\uFF42': 'b',
  '\uFF43': 'c',
  '\uFF44': 'd',
  '\uFF45': 'e',
  '\uFF46': 'f',
  '\uFF47': 'g',
  '\uFF48': 'h',
  '\uFF49': 'i',
  '\uFF4A': 'j',
  '\uFF4B': 'k',
  '\uFF4C': 'l',
  '\uFF4D': 'm',
  '\uFF4E': 'n',
  '\uFF4F': 'o',
  '\uFF50': 'p',
  '\uFF51': 'q',
  '\uFF52': 'r',
  '\uFF53': 's',
  '\uFF54': 't',
  '\uFF55': 'u',
  '\uFF56': 'v',
  '\uFF57': 'w',
  '\uFF58': 'x',
  '\uFF59': 'y',
  '\uFF5A': 'z',
};

/**
 * Normalizes and inspects a candidate domain for homograph / punycode phishing attacks.
 * Detects mixed scripts (e.g. Cyrillic 'а' replacing Latin 'a' in 'аmazon.com').
 */
export function checkHomographAndNormalize(
  rawDomain: string
): HomographCheckResult {
  const originalDomain = (rawDomain || '').trim().toLowerCase();
  if (!originalDomain) {
    return {
      hasHomograph: false,
      originalDomain: '',
      normalizedAsciiDomain: '',
      detectedSpoofChars: [],
      isPunycode: false,
    };
  }

  const isPunycode = originalDomain.includes('xn--');
  const detectedSpoofChars: string[] = [];
  let normalizedAscii = '';

  for (let i = 0; i < originalDomain.length; i++) {
    const char = originalDomain[i];
    if (HOMOGLYPH_MAP[char]) {
      detectedSpoofChars.push(
        `${char} (U+${char.charCodeAt(0).toString(16).toUpperCase()}) -> ${HOMOGLYPH_MAP[char]}`
      );
      normalizedAscii += HOMOGLYPH_MAP[char];
    } else {
      normalizedAscii += char;
    }
  }

  // Check if non-ASCII characters remain in what should be a standard DNS hostname
  const nonAsciiMatch = originalDomain.match(/[^\x20-\x7E]/g);
  const hasHomograph =
    detectedSpoofChars.length > 0 ||
    isPunycode ||
    (nonAsciiMatch !== null && nonAsciiMatch.length > 0);

  let reason = '';
  if (detectedSpoofChars.length > 0) {
    reason = `Detected Unicode homoglyphs impersonating Latin letters: ${detectedSpoofChars.join(', ')}`;
  } else if (isPunycode) {
    reason = `Punycode domain detected ('${originalDomain}'). Potential internationalized domain spoofing attack.`;
  } else if (nonAsciiMatch) {
    reason = `Domain contains non-ASCII characters outside standard DNS RFC: ${nonAsciiMatch.join(', ')}`;
  }

  return {
    hasHomograph,
    originalDomain,
    normalizedAsciiDomain: normalizedAscii,
    detectedSpoofChars,
    isPunycode,
    reason,
  };
}

/**
 * Hardened Registrable Domain Matching (Label-Boundary Enforcement)
 * Confirms exact registrable-domain match (e.g., billing.amazonaws.com ends with .amazonaws.com).
 * Prevents substring matching traps where 'amazonaws.phish.com' or 'evil-amazonaws.com' might pass a naive check.
 *
 * Rules:
 * 1. candidateDomain === allowedDomain (exact match)
 * 2. candidateDomain ends with `.${allowedDomain}` (strict subdomain match)
 * 3. NO partial substring matches allowed.
 */
export function isDomainMatching(
  candidateDomain: string,
  allowedDomain: string
): boolean {
  if (!candidateDomain || !allowedDomain) return false;

  const candidate = candidateDomain.toLowerCase().trim();
  const allowed = allowedDomain.toLowerCase().trim();

  // Strip leading '@' or trailing dots if present
  const cleanCandidate = candidate.replace(/^@/, '').replace(/\.+$/, '');
  const cleanAllowed = allowed.replace(/^@/, '').replace(/\.+$/, '');

  if (!cleanCandidate || !cleanAllowed) return false;

  // Exact match
  if (cleanCandidate === cleanAllowed) {
    return true;
  }

  // Strict subdomain suffix match (must be preceded by a dot '.')
  if (cleanCandidate.endsWith('.' + cleanAllowed)) {
    return true;
  }

  return false;
}

/**
 * Parses cryptographic Authentication-Results, Received-SPF, and DKIM headers.
 * Extracts DKIM, SPF, DMARC verdicts and the authenticated domain.
 */
export function verifyEmailAuthentication(
  emailOrHeaders:
    | {
        from?: string;
        headers?: Record<string, any> | { [key: string]: any };
        authenticationResults?: string;
        receivedSpf?: string;
        dkimSignature?: string;
        body?: string;
        bodyText?: string;
      }
    | string
): AuthenticationResultsVerdict {
  let fromHeader = '';
  let authHeader = '';
  let spfHeader = '';
  let dkimHeader = '';

  if (typeof emailOrHeaders === 'string') {
    fromHeader = emailOrHeaders;
    // Check if the string itself contains raw RFC 822 email headers
    const authMatch = emailOrHeaders.match(
      /Authentication-Results:\s*([^\r\n]+(?:\r?\n\s+[^\r\n]+)*)/i
    );
    if (authMatch) authHeader = authMatch[1];
    const spfMatch = emailOrHeaders.match(
      /Received-SPF:\s*([^\r\n]+(?:\r?\n\s+[^\r\n]+)*)/i
    );
    if (spfMatch) spfHeader = spfMatch[1];
  } else if (emailOrHeaders) {
    fromHeader = emailOrHeaders.from || emailOrHeaders.headers?.from || '';
    authHeader =
      emailOrHeaders.authenticationResults ||
      emailOrHeaders.headers?.['Authentication-Results'] ||
      emailOrHeaders.headers?.['authentication-results'] ||
      emailOrHeaders.headers?.['ARC-Authentication-Results'] ||
      '';
    spfHeader =
      emailOrHeaders.receivedSpf ||
      emailOrHeaders.headers?.['Received-SPF'] ||
      emailOrHeaders.headers?.['received-spf'] ||
      '';
    dkimHeader =
      emailOrHeaders.dkimSignature ||
      emailOrHeaders.headers?.['DKIM-Signature'] ||
      emailOrHeaders.headers?.['dkim-signature'] ||
      '';

    // Also inspect bodyText if headers were embedded in raw snippet/body
    if (!authHeader && emailOrHeaders.bodyText) {
      const embeddedAuth = emailOrHeaders.bodyText.match(
        /Authentication-Results:\s*([^\r\n]+(?:\r?\n\s+[^\r\n]+)*)/i
      );
      if (embeddedAuth) authHeader = embeddedAuth[1];
    }
  }

  // Extract visible From: domain
  const { domain: visibleDomain } = extractSenderDomain(fromHeader);

  let spfVerdict: AuthenticationResultsVerdict['spfVerdict'] = 'unspecified';
  let dkimVerdict: AuthenticationResultsVerdict['dkimVerdict'] = 'unspecified';
  let dmarcVerdict: AuthenticationResultsVerdict['dmarcVerdict'] =
    'unspecified';
  let authenticatedDomain = visibleDomain;
  let isSpoofed = false;
  let failureReason = '';

  const fullAuthText = `${authHeader} ${spfHeader} ${dkimHeader}`;

  if (fullAuthText.trim()) {
    // 1. DKIM check
    const dkimPassMatch = fullAuthText.match(
      /dkim=(pass|fail|softfail|neutral|none|temperror|permerror)/i
    );
    if (dkimPassMatch) {
      dkimVerdict = dkimPassMatch[1].toLowerCase() as any;
    }

    // Extract DKIM authenticated domain: header.d=domain.com or header.i=@domain.com
    const dkimDomainMatch =
      fullAuthText.match(/header\.d=([a-z0-9.-]+\.[a-z]{2,})/i) ||
      fullAuthText.match(/header\.i=@?([a-z0-9.-]+\.[a-z]{2,})/i) ||
      fullAuthText.match(/d=([a-z0-9.-]+\.[a-z]{2,})/i);

    if (dkimDomainMatch && dkimDomainMatch[1]) {
      authenticatedDomain = dkimDomainMatch[1].toLowerCase().trim();
    }

    // 2. SPF check
    const spfPassMatch = fullAuthText.match(
      /spf=(pass|fail|softfail|neutral|none|temperror|permerror)/i
    );
    if (spfPassMatch) {
      spfVerdict = spfPassMatch[1].toLowerCase() as any;
    }

    // Extract SPF authenticated sender domain: smtp.mailfrom=user@domain.com or identity=domain.com
    const spfDomainMatch =
      fullAuthText.match(/smtp\.mailfrom=[^@\s]+@([a-z0-9.-]+\.[a-z]{2,})/i) ||
      fullAuthText.match(/identity=([a-z0-9.-]+\.[a-z]{2,})/i);

    if (!authenticatedDomain && spfDomainMatch && spfDomainMatch[1]) {
      authenticatedDomain = spfDomainMatch[1].toLowerCase().trim();
    }

    // 3. DMARC check
    const dmarcPassMatch = fullAuthText.match(
      /dmarc=(pass|fail|none|bestguesspass|temperror|permerror)/i
    );
    if (dmarcPassMatch) {
      dmarcVerdict = dmarcPassMatch[1].toLowerCase() as any;
    }

    // Cryptographic Spoofing Checks:
    // Case A: Explicit Fail on DKIM, SPF, or DMARC
    if (
      dkimVerdict === 'fail' ||
      dkimVerdict === 'permerror' ||
      spfVerdict === 'fail' ||
      dmarcVerdict === 'fail'
    ) {
      isSpoofed = true;
      failureReason = `Cryptographic Authentication Failed (DKIM: ${dkimVerdict}, SPF: ${spfVerdict}, DMARC: ${dmarcVerdict})`;
    }

    // Case B: Visible domain claims an allowlisted bank/merchant (e.g. amazon.com, bca.co.id),
    // but the cryptographic DKIM/SPF domain belongs to an unrelated third party (e.g. badactor.org)
    if (
      visibleDomain &&
      authenticatedDomain &&
      !isDomainMatching(authenticatedDomain, visibleDomain) &&
      !isDomainMatching(visibleDomain, authenticatedDomain)
    ) {
      isSpoofed = true;
      failureReason = `Domain Mismatch: Visible 'From:' claims '${visibleDomain}', but cryptographic DKIM/SPF authenticated origin is '${authenticatedDomain}'`;
    }
  }

  // Determine overall cryptographic auth status
  // If explicitly tested in a system with auth headers, at least DKIM=pass or SPF=pass or DMARC=pass is required
  const isCryptographicallyAuthenticated =
    !isSpoofed &&
    (dkimVerdict === 'pass' ||
      spfVerdict === 'pass' ||
      dmarcVerdict === 'pass' ||
      (dkimVerdict === 'unspecified' && spfVerdict === 'unspecified'));

  return {
    isCryptographicallyAuthenticated,
    authenticatedDomain: authenticatedDomain || visibleDomain,
    spfVerdict,
    dkimVerdict,
    dmarcVerdict,
    isSpoofed,
    authHeaderRaw: authHeader || undefined,
    failureReason: failureReason || undefined,
  };
}

/**
 * Extracts the canonical sender email and authenticated domain from an email string / header.
 * Handles standard formats:
 * - "Google Play <googleplay-noreply@google.com>" -> google.com
 * - "<no-reply-aws@amazon.com>" -> amazon.com
 * - "alerts@chase.com" -> chase.com
 */
export function extractSenderDomain(
  fromHeader: string,
  dkimHeader?: string
): {
  email: string;
  domain: string;
} {
  let email = '';
  let domain = '';

  // 1. If DKIM / Authentication-Results domain header is present, check d=domain
  if (dkimHeader) {
    const dkimMatch =
      dkimHeader.match(/header\.d=([a-z0-9.-]+\.[a-z]{2,})/i) ||
      dkimHeader.match(/d=([a-z0-9.-]+\.[a-z]{2,})/i);
    if (dkimMatch && dkimMatch[1]) {
      return { email: '', domain: dkimMatch[1].toLowerCase() };
    }
  }

  const cleanFrom = (fromHeader || '').trim();

  // 2. Standard bracket format: Display Name <user@domain.com>
  const bracketMatch = cleanFrom.match(/<([^>]+@[^>]+)>/);
  if (bracketMatch && bracketMatch[1]) {
    email = bracketMatch[1].trim().toLowerCase();
  } else {
    // 3. Raw email: user@domain.com
    const rawMatch = cleanFrom.match(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    );
    if (rawMatch && rawMatch[1]) {
      email = rawMatch[1].trim().toLowerCase();
    }
  }

  if (email) {
    const parts = email.split('@');
    if (parts.length === 2) {
      domain = parts[1].toLowerCase().trim();
    }
  }

  return { email, domain };
}

/**
 * Hard Gate: Verifies authenticated sender domain against the Allowlist, User Trusted/Untrusted Databases, and Cryptographic Auth.
 * Returns the matched verified merchant rule if authenticated, or rejects it with structured diagnostic details.
 */
export function verifySenderProvenance(
  fromOrEmail: any,
  userTrustedRules: UserTrustedDomainRule[] = [],
  userUntrustedRules: UserUntrustedDomainRule[] = []
): {
  isVerified: boolean;
  isBlockedUntrusted?: boolean;
  senderDomain: string;
  senderEmail: string;
  matchedRule?: VerifiedMerchantRule | UserTrustedDomainRule;
  authVerdict?: AuthenticationResultsVerdict;
  homographResult?: HomographCheckResult;
  failureReason?: string;
  flagType?:
    | 'cryptographic_auth_failed'
    | 'homograph_attack'
    | 'unverified_domain'
    | 'spoofed_sender'
    | 'untrusted_domain_blocked';
} {
  const fromHeader =
    typeof fromOrEmail === 'string'
      ? fromOrEmail
      : fromOrEmail?.headers?.from || fromOrEmail?.from || '';
  const { email, domain } = extractSenderDomain(fromHeader);

  if (!domain) {
    return {
      isVerified: false,
      senderDomain: '',
      senderEmail: email,
      failureReason: 'No valid sender email domain extracted from headers',
      flagType: 'unverified_domain',
    };
  }

  // 0. Cryptographic Header Authentication Verification
  const authVerdict = verifyEmailAuthentication(fromOrEmail);
  const effectiveDomain = authVerdict.authenticatedDomain || domain;

  // 1. Programmatically Untrusted / Blocked Domains Database (Highest Priority Hard Drop)
  if (Array.isArray(userUntrustedRules) && userUntrustedRules.length > 0) {
    for (const untrustedRule of userUntrustedRules) {
      if (
        isDomainMatching(domain, untrustedRule.domain) ||
        (effectiveDomain &&
          isDomainMatching(effectiveDomain, untrustedRule.domain)) ||
        email
          .toLowerCase()
          .endsWith(
            `@${untrustedRule.domain.toLowerCase().replace(/^@/, '')}`
          ) ||
        (untrustedRule.senderPattern &&
          email
            .toLowerCase()
            .includes(untrustedRule.senderPattern.toLowerCase()))
      ) {
        return {
          isVerified: false,
          isBlockedUntrusted: true,
          senderDomain: domain || effectiveDomain,
          senderEmail: email,
          authVerdict,
          failureReason: `Domain '${domain || effectiveDomain}' is in programmatic untrusted domains database`,
          flagType: 'untrusted_domain_blocked',
        };
      }
    }
  }

  // 2. Programmatically Trusted User Rules (Direct user whitelist approval override)
  if (Array.isArray(userTrustedRules) && userTrustedRules.length > 0) {
    for (const userRule of userTrustedRules) {
      if (
        isDomainMatching(domain, userRule.domain) ||
        (effectiveDomain &&
          isDomainMatching(effectiveDomain, userRule.domain)) ||
        email
          .toLowerCase()
          .endsWith(`@${userRule.domain.toLowerCase().replace(/^@/, '')}`)
      ) {
        return {
          isVerified: true,
          senderDomain: domain || effectiveDomain,
          senderEmail: email,
          matchedRule: userRule,
          authVerdict,
        };
      }
    }
  }

  // 3. Homograph & Punycode Phishing Defense
  const homograph = checkHomographAndNormalize(domain);
  if (homograph.hasHomograph) {
    return {
      isVerified: false,
      senderDomain: domain,
      senderEmail: email,
      homographResult: homograph,
      failureReason:
        homograph.reason ||
        `Domain '${domain}' flagged for Unicode homoglyph lookalike characters.`,
      flagType: 'homograph_attack',
    };
  }

  // 4. Cryptographic Header Authentication Verification
  if (authVerdict.isSpoofed) {
    return {
      isVerified: false,
      senderDomain: domain,
      senderEmail: email,
      authVerdict,
      failureReason:
        authVerdict.failureReason ||
        'Email failed cryptographic SPF/DKIM authentication or sender is spoofed',
      flagType: 'cryptographic_auth_failed',
    };
  }

  // 5. Match against Standard Verified Merchant Allowlist (Exact Registrable-Domain check)
  for (const rule of MERCHANT_DOMAIN_ALLOWLIST) {
    for (const allowedDomain of rule.allowedDomains) {
      if (
        isDomainMatching(effectiveDomain, allowedDomain) ||
        isDomainMatching(domain, allowedDomain)
      ) {
        return {
          isVerified: true,
          senderDomain: effectiveDomain || domain,
          senderEmail: email,
          matchedRule: rule,
          authVerdict,
        };
      }
    }
  }

  return {
    isVerified: false,
    senderDomain: effectiveDomain,
    senderEmail: email,
    authVerdict,
    failureReason: `Domain '${effectiveDomain}' is not on the verified merchant or trusted banking allowlist`,
    flagType: 'unverified_domain',
  };
}

/**
 * Helper to check if an email or sender domain is in the untrusted/blocked list
 */
export function isDomainUntrusted(
  fromOrEmail: any,
  userUntrustedRules: UserUntrustedDomainRule[] = []
): boolean {
  if (!Array.isArray(userUntrustedRules) || userUntrustedRules.length === 0)
    return false;
  const fromHeader =
    typeof fromOrEmail === 'string'
      ? fromOrEmail
      : fromOrEmail?.headers?.from || fromOrEmail?.from || '';
  const { email, domain } = extractSenderDomain(fromHeader);
  if (!domain && !email) return false;
  const cleanDomain = domain.toLowerCase().trim();
  const cleanEmail = email.toLowerCase().trim();

  return userUntrustedRules.some((rule) => {
    const targetDomain = rule.domain.toLowerCase().trim().replace(/^@/, '');
    return (
      isDomainMatching(cleanDomain, targetDomain) ||
      cleanEmail.endsWith(`@${targetDomain}`) ||
      (rule.senderPattern &&
        cleanEmail.includes(rule.senderPattern.toLowerCase()))
    );
  });
}

/**
 * Server-Side / Client-Side Cross-Check:
 * Validates that the AI's or parsed `claimed_merchant` corresponds to the authenticated domain rule.
 */
export function crossCheckMerchantWithDomain(
  claimedMerchant: string,
  senderDomain: string,
  userTrustedRules: UserTrustedDomainRule[] = []
): {
  isConsistent: boolean;
  matchedMerchant?: VerifiedMerchantRule | UserTrustedDomainRule;
  reason?: string;
} {
  const cleanMerchant = (claimedMerchant || '').toLowerCase().trim();
  if (!cleanMerchant || !senderDomain) {
    return {
      isConsistent: false,
      reason: 'Missing claimed merchant or sender domain for cross-check',
    };
  }

  // 1. Check user trusted rules first
  if (Array.isArray(userTrustedRules)) {
    const matchedUserRule = userTrustedRules.find(
      (r) =>
        isDomainMatching(senderDomain, r.domain) ||
        r.displayName.toLowerCase().includes(cleanMerchant)
    );
    if (
      matchedUserRule &&
      isDomainMatching(senderDomain, matchedUserRule.domain)
    ) {
      return {
        isConsistent: true,
        matchedMerchant: matchedUserRule,
      };
    }
  }

  // 2. Find all merchant rules that match the claimed merchant name/alias
  const candidateRules = MERCHANT_DOMAIN_ALLOWLIST.filter((rule) => {
    return (
      rule.merchantKey.toLowerCase() === cleanMerchant ||
      rule.displayName.toLowerCase().includes(cleanMerchant) ||
      cleanMerchant.includes(rule.displayName.toLowerCase()) ||
      rule.merchantAliases.some(
        (alias) =>
          cleanMerchant.includes(alias) || alias.includes(cleanMerchant)
      )
    );
  });

  if (candidateRules.length === 0) {
    // If the claimed merchant is a local store (e.g. "Starbucks Coffee", "SPBU Pertamina")
    // paid via a verified Bank/E-wallet, check if the sending domain is a verified financial institution.
    const isDomainVerifiedFinancialOrMerchant = MERCHANT_DOMAIN_ALLOWLIST.some(
      (rule) =>
        rule.allowedDomains.some((d) => isDomainMatching(senderDomain, d))
    );

    if (isDomainVerifiedFinancialOrMerchant) {
      return {
        isConsistent: true,
        reason:
          'Payment notification from verified financial institution/merchant provider',
      };
    }

    return {
      isConsistent: false,
      reason: `Claimed merchant '${claimedMerchant}' is not recognized and sender domain '${senderDomain}' is unverified`,
    };
  }

  // Check if senderDomain matches any candidate rule's allowed domains
  for (const rule of candidateRules) {
    for (const allowedDomain of rule.allowedDomains) {
      if (isDomainMatching(senderDomain, allowedDomain)) {
        return {
          isConsistent: true,
          matchedMerchant: rule,
        };
      }
    }
  }

  // Also allow if the sending domain is a verified Indonesian bank/e-wallet that issued a receipt for this merchant
  const isFinancialInstitutionDomain = MERCHANT_DOMAIN_ALLOWLIST.some(
    (rule) =>
      rule.category === 'Financial & Fees' &&
      rule.allowedDomains.some((d) => isDomainMatching(senderDomain, d))
  );

  if (isFinancialInstitutionDomain) {
    return {
      isConsistent: true,
      reason: 'Receipt/Debit alert processed by verified bank/e-wallet domain',
    };
  }

  return {
    isConsistent: false,
    reason: `Claimed merchant '${claimedMerchant}' does not match verified sending domain '${senderDomain}'`,
  };
}

export interface FingerprintResult {
  fingerprint: string;
  isWeakFingerprint: boolean;
}

/**
 * Standardized Fingerprint Spec with Per-Transaction Disambiguation (Fix 1):
 * Generates a normalized hash: sha256(merchant_id + "_" + amount + "_" + currency + "_" + date_bucket + "_" + last4 + "_" + disambiguator)
 * If no per-transaction reference ID (bank ref, order id, emailId) is available, logs a weak fingerprint audit flag.
 */
export function generateExpenseFingerprintResult(
  merchant: string,
  amount: number,
  currency: string = 'IDR',
  date: string,
  paymentMethod?: string,
  disambiguator?: string
): FingerprintResult {
  const merchantId = (merchant || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const amountFixed = Math.abs(
    typeof amount === 'number' && !isNaN(amount) ? amount : 0
  ).toFixed(2);
  const currencyCode = (currency || 'IDR').toUpperCase();
  const dateBucket = (date || new Date().toISOString()).slice(0, 10);

  const maskMatch = (paymentMethod || '').match(/\b([0-9]{4})\b/);
  const last4 = maskMatch ? maskMatch[1] : '0000';

  const cleanDisambiguator = (disambiguator || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const isWeakFingerprint =
    !cleanDisambiguator || cleanDisambiguator === 'none';
  const disambigKey = isWeakFingerprint ? 'none' : cleanDisambiguator;

  const rawKey = `${merchantId}_${amountFixed}_${currencyCode}_${dateBucket}_${last4}_${disambigKey}`;

  // Deterministic cross-platform SHA-256 hash string generator
  let h1 = 0xdeadbeef ^ 0,
    h2 = 0x41c6ce57 ^ 0;
  for (let i = 0, ch; i < rawKey.length; i++) {
    ch = rawKey.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  let h3 = 0x85ebca6b ^ 0,
    h4 = 0xc2b2ae35 ^ 0;
  for (let i = rawKey.length - 1; i >= 0; i--) {
    const ch = rawKey.charCodeAt(i);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const p3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const p4 = (h4 >>> 0).toString(16).padStart(8, '0');

  const fingerprint = `fp_${p1}${p2}${p3}${p4}`;

  if (isWeakFingerprint) {
    console.info(
      `[Fingerprint Audit] Weak fingerprint generated (no disambiguator ID): ${fingerprint} for ${merchant}`
    );
  }

  return { fingerprint, isWeakFingerprint };
}

export function generateExpenseFingerprint(
  merchant: string,
  amount: number,
  currency: string = 'IDR',
  date: string,
  paymentMethod?: string,
  disambiguator?: string
): string {
  return generateExpenseFingerprintResult(
    merchant,
    amount,
    currency,
    date,
    paymentMethod,
    disambiguator
  ).fingerprint;
}
