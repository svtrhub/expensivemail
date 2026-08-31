import { BankAccount, Expense } from '../types';

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'acc_bca_mybca',
    name: 'myBCA / BCA Tahapan Gold',
    institution: 'Bank Central Asia (BCA)',
    accountNumberMask: '•••• 8821',
    type: 'checking',
    balance: 18450000,
    currency: 'IDR',
    color: '#005EB8',
    iconName: 'Smartphone',
    lastSyncedAt: new Date().toISOString(),
    active: true,
  },
  {
    id: 'acc_bni_wondr',
    name: 'wondr by BNI Taplus',
    institution: 'Bank Negara Indonesia (BNI)',
    accountNumberMask: '•••• 7812',
    type: 'checking',
    balance: 9240000,
    currency: 'IDR',
    color: '#005E54',
    iconName: 'Smartphone',
    lastSyncedAt: new Date().toISOString(),
    active: true,
  },
  {
    id: 'acc_mandiri_livin',
    name: "Livin' by Mandiri Tabungan",
    institution: 'Bank Mandiri',
    accountNumberMask: '•••• 4190',
    type: 'checking',
    balance: 12500000,
    currency: 'IDR',
    color: '#003D79',
    iconName: 'Smartphone',
    lastSyncedAt: new Date().toISOString(),
    active: true,
  },
  {
    id: 'acc_bri_brimo',
    name: 'BRImo BritAma',
    institution: 'Bank Rakyat Indonesia (BRI)',
    accountNumberMask: '•••• 8901',
    type: 'checking',
    balance: 6420000,
    currency: 'IDR',
    color: '#00529C',
    iconName: 'Smartphone',
    lastSyncedAt: new Date().toISOString(),
    active: true,
  },
  {
    id: 'acc_bsi_byond',
    name: 'BYOND by BSI Hasanah',
    institution: 'Bank Syariah Indonesia (BSI)',
    accountNumberMask: '•••• 3091',
    type: 'checking',
    balance: 5120000,
    currency: 'IDR',
    color: '#00A39D',
    iconName: 'Smartphone',
    lastSyncedAt: new Date().toISOString(),
    active: true,
  },
  {
    id: 'acc_btn_bale',
    name: 'balé by BTN Batara',
    institution: 'Bank Tabungan Negara (BTN)',
    accountNumberMask: '•••• 2108',
    type: 'checking',
    balance: 3890000,
    currency: 'IDR',
    color: '#F58220',
    iconName: 'Smartphone',
    lastSyncedAt: new Date().toISOString(),
    active: true,
  },
  {
    id: 'acc_jago_pocket',
    name: 'Bank Jago Main Pocket',
    institution: 'Bank Jago',
    accountNumberMask: '•••• 6301',
    type: 'checking',
    balance: 7850000,
    currency: 'IDR',
    color: '#8B5CF6',
    iconName: 'Smartphone',
    lastSyncedAt: new Date().toISOString(),
    active: true,
  },
  {
    id: 'acc_gopay_wallet',
    name: 'GoPay / GoTo Wallet',
    institution: 'GoPay Indonesia (GoTo / Bank Jago)',
    accountNumberMask: '0812••••9910',
    type: 'digital_wallet',
    balance: 850000,
    currency: 'IDR',
    color: '#00AA13',
    iconName: 'Wallet',
    lastSyncedAt: new Date().toISOString(),
    active: true,
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_google_ai_pro_01',
    emailId: 'msg_google_ai_pro_01',
    title: 'Google AI Pro (5 TB) - Google One',
    merchant: 'Google Play',
    amount: 85470,
    currency: 'IDR',
    category: 'Entertainment & Subscriptions',
    date: '2026-08-22',
    time: '09:51 AM',
    type: 'debit',
    paymentMethod: 'Mastercard •••• 8725',
    bankAccountName: 'Mastercard (•••• 8725)',
    confidenceScore: 0.99,
    isRecurring: true,
    recurringFrequency: 'monthly',
    notes:
      'Nomor Pesanan: SOP.3332-2701-9347-75727 (Langganan Google AI Pro 5 TB Google One)',
    tags: ['google', 'ai', 'subscription', 'googleone'],
    items: [
      { name: 'Google AI Pro (5 TB) (Google One)', qty: 1, price: 77000 },
      { name: 'Pajak (VAT / PPN)', qty: 1, price: 8470 },
    ],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'Tanda Terima Pesanan Google Play Anda dari 22 Agu 2026',
      sender: 'Google Play <googleplay-noreply@google.com>',
      dateReceived: '2026-08-21T19:52:00-07:00',
      snippet:
        'Google Play: Pembelian langganan Google AI Pro (5 TB) (Google One) Rp 77.000 + Pajak Rp 8.470. Total: Rp 85.470/bulan.',
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_google_cloud_01',
    emailId: 'msg_gcp_01',
    title: 'Google Cloud Platform (GCP) Services',
    merchant: 'Google Cloud Platform',
    amount: 48.2,
    currency: 'USD',
    category: 'Utilities & Bills',
    date: '2026-08-20',
    time: '03:15 AM',
    type: 'debit',
    paymentMethod: 'Visa •••• 4921',
    bankAccountName: 'Visa (•••• 4921)',
    confidenceScore: 0.99,
    isRecurring: true,
    recurringFrequency: 'monthly',
    notes:
      'Google Cloud Billing Account #01A4B2-990812 (Compute Engine & Cloud Run)',
    tags: ['google', 'cloud', 'gcp', 'developer'],
    items: [
      { name: 'Google Cloud Run & Cloud SQL Usage', qty: 1, price: 35.5 },
      { name: 'Cloud Storage & Networking Bandwidth', qty: 1, price: 12.7 },
    ],
    source: 'gmail_sync',
    emailMetadata: {
      subject:
        'Google Cloud: Your invoice is available for Account #01A4B2-990812',
      sender: 'Google Cloud Billing <google-cloud-compliance@google.com>',
      dateReceived: '2026-08-20T03:15:00-07:00',
      snippet:
        'Automatic payment succeeded: Google Cloud Platform charge of $48.20 has been charged to your Visa ending in 4921.',
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_aws_cloud_01',
    emailId: 'msg_aws_01',
    title: 'AWS Cloud Infrastructure & Compute',
    merchant: 'Amazon Web Services (AWS)',
    amount: 124.5,
    currency: 'USD',
    category: 'Utilities & Bills',
    date: '2026-08-19',
    time: '07:30 AM',
    type: 'debit',
    paymentMethod: 'Mastercard •••• 8725',
    bankAccountName: 'Mastercard (•••• 8725)',
    confidenceScore: 0.98,
    isRecurring: true,
    recurringFrequency: 'monthly',
    notes: 'Amazon Web Services Invoice #INV-8821098 (AWS EC2 & S3)',
    tags: ['aws', 'cloud', 'infrastructure', 'server'],
    items: [
      { name: 'Amazon Elastic Compute Cloud (EC2)', qty: 1, price: 89.2 },
      { name: 'Amazon Simple Storage Service (S3)', qty: 1, price: 35.3 },
    ],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'Amazon Web Services: Invoice is Available for Account 99281048',
      sender: 'AWS Billing <no-reply-aws@amazon.com>',
      dateReceived: '2026-08-19T07:30:00-07:00',
      snippet:
        'Your AWS monthly statement is available. Total amount charged: $124.50 to Mastercard ending in 8725.',
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_openai_chatgpt_01',
    emailId: 'msg_openai_01',
    title: 'ChatGPT Plus Subscription',
    merchant: 'OpenAI',
    amount: 20.0,
    currency: 'USD',
    category: 'Entertainment & Subscriptions',
    date: '2026-08-17',
    time: '11:00 AM',
    type: 'debit',
    paymentMethod: 'Mastercard •••• 8725',
    bankAccountName: 'Mastercard (•••• 8725)',
    confidenceScore: 0.99,
    isRecurring: true,
    recurringFrequency: 'monthly',
    notes: 'Invoice #INV-OAI-98124 (ChatGPT Plus Monthly Subscription)',
    tags: ['openai', 'chatgpt', 'ai', 'subscription'],
    items: [{ name: 'ChatGPT Plus (1 Month Access)', qty: 1, price: 20.0 }],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'Your receipt from OpenAI #INV-OAI-98124',
      sender: 'OpenAI <receipts@openai.com>',
      dateReceived: '2026-08-17T11:00:00-07:00',
      snippet:
        'Thank you for subscribing to ChatGPT Plus. Total amount paid: $20.00 billed to Mastercard 8725.',
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_anthropic_claude_01',
    emailId: 'msg_claude_01',
    title: 'Claude Pro AI Subscription',
    merchant: 'Anthropic',
    amount: 20.0,
    currency: 'USD',
    category: 'Entertainment & Subscriptions',
    date: '2026-08-15',
    time: '02:45 PM',
    type: 'debit',
    paymentMethod: 'Visa •••• 4921',
    bankAccountName: 'Visa (•••• 4921)',
    confidenceScore: 0.99,
    isRecurring: true,
    recurringFrequency: 'monthly',
    notes: 'Anthropic Claude Pro Subscription - Invoice #INV-ANT-7712',
    tags: ['anthropic', 'claude', 'ai', 'subscription'],
    items: [
      { name: 'Claude Pro Plan Access (Sonnet & Opus)', qty: 1, price: 20.0 },
    ],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'Your receipt from Anthropic #INV-ANT-7712',
      sender: 'Anthropic <receipts@anthropic.com>',
      dateReceived: '2026-08-15T14:45:00-07:00',
      snippet: 'Payment receipt for Claude Pro. Total amount charged: $20.00.',
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_github_copilot_01',
    emailId: 'msg_github_01',
    title: 'GitHub Copilot Subscription',
    merchant: 'GitHub',
    amount: 10.0,
    currency: 'USD',
    category: 'Entertainment & Subscriptions',
    date: '2026-08-14',
    time: '08:00 AM',
    type: 'debit',
    paymentMethod: 'Mastercard •••• 8725',
    bankAccountName: 'Mastercard (•••• 8725)',
    confidenceScore: 0.99,
    isRecurring: true,
    recurringFrequency: 'monthly',
    notes: 'GitHub Copilot Individual Monthly Subscription',
    tags: ['github', 'copilot', 'developer', 'ai'],
    items: [{ name: 'GitHub Copilot for Individuals', qty: 1, price: 10.0 }],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'Receipt for your GitHub payment',
      sender: 'GitHub <billing@github.com>',
      dateReceived: '2026-08-14T08:00:00-07:00',
      snippet: 'Payment confirmed for GitHub Copilot. Total charged: $10.00.',
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_netflix_4k_01',
    emailId: 'msg_netflix_01',
    title: 'Netflix Premium (4K Ultra HD)',
    merchant: 'Netflix',
    amount: 186000,
    currency: 'IDR',
    category: 'Entertainment & Subscriptions',
    date: '2026-08-10',
    time: '01:10 PM',
    type: 'debit',
    paymentMethod: 'Mastercard •••• 8725',
    bankAccountName: 'Mastercard (•••• 8725)',
    confidenceScore: 0.99,
    isRecurring: true,
    recurringFrequency: 'monthly',
    notes: 'Netflix Paket Premium (4 Perangkat 4K HDR)',
    tags: ['netflix', 'streaming', 'entertainment', 'movies'],
    items: [
      { name: 'Netflix Premium Plan (4 Screens 4K)', qty: 1, price: 186000 },
    ],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'Pembaruan Langganan Netflix Anda: Rp 186.000',
      sender: 'Netflix <info@mailer.netflix.com>',
      dateReceived: '2026-08-10T13:10:00-07:00',
      snippet:
        'Langganan bulanan Netflix Anda berhasil diperpanjang. Total bayar: Rp 186.000 via Mastercard 8725.',
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_id_01',
    emailId: 'msg_wondr_01',
    title: 'Starbucks Coffee Indonesia',
    merchant: 'Starbucks Coffee Indonesia',
    amount: 58000,
    currency: 'IDR',
    category: 'Dining & Food',
    date: new Date(Date.now() - 1 * 3600 * 1000).toISOString().split('T')[0],
    time: '04:20 PM',
    type: 'debit',
    bankAccountId: 'acc_bni_wondr',
    bankAccountName: 'Bank Negara Indonesia (BNI) - wondr by BNI (•••• 7812)',
    paymentMethod: 'wondr by BNI QRIS',
    confidenceScore: 0.99,
    isRecurring: false,
    notes: 'Iced Caffe Latte venti via wondr by BNI',
    tags: ['coffee', 'wondr', 'bni'],
    items: [{ name: 'Iced Caffe Latte Venti', qty: 1, price: 58000 }],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'Notifikasi Transaksi wondr by BNI: QRIS Rp 58.000',
      sender: 'wondr by BNI <wondr@bni.co.id>',
      dateReceived: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      snippet:
        'Pembayaran QRIS via wondr by BNI sebesar Rp 58.000 di Starbucks sukses diproses.',
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_id_02',
    emailId: 'msg_mybca_01',
    title: 'SPBU Pertamina Kuningan',
    merchant: 'SPBU Pertamina Kuningan',
    amount: 175000,
    currency: 'IDR',
    category: 'Travel & Transportation',
    date: new Date(Date.now() - 3 * 3600 * 1000).toISOString().split('T')[0],
    time: '02:15 PM',
    type: 'debit',
    bankAccountId: 'acc_bca_mybca',
    bankAccountName: 'Bank Central Asia (BCA) - myBCA (•••• 8821)',
    paymentMethod: 'BCA QRIS (myBCA)',
    confidenceScore: 0.99,
    isRecurring: false,
    notes: 'Bensin Pertamax via myBCA',
    tags: ['pertamina', 'mybca', 'fuel'],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'Notifikasi Transaksi Rekening Tahapan BCA (myBCA)',
      sender: 'BCA Notifikasi <ebanking@bca.co.id>',
      dateReceived: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      snippet:
        'Transaksi Debit / QRIS myBCA senilai IDR 175.000,00 di SPBU PERTAMINA KUNINGAN berhasil.',
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_id_03',
    emailId: 'msg_mandiri_livin_01',
    title: 'PLN Listrik Prepaid Token',
    merchant: 'PLN Mobile / PT PLN (PERSERO)',
    amount: 350000,
    currency: 'IDR',
    category: 'Utilities & Bills',
    date: new Date(Date.now() - 18 * 3600 * 1000).toISOString().split('T')[0],
    time: '11:24 AM',
    type: 'debit',
    bankAccountId: 'acc_mandiri_livin',
    bankAccountName: "Bank Mandiri - Livin' by Mandiri (•••• 4190)",
    paymentMethod: "Livin' by Mandiri Resi",
    confidenceScore: 0.99,
    isRecurring: true,
    recurringFrequency: 'monthly',
    notes: 'Token Listrik Rumah 3500VA via Livin',
    tags: ['pln', 'livin', 'electricity'],
    source: 'gmail_sync',
    emailMetadata: {
      subject: "Resi Pembayaran Livin' by Mandiri - PT PLN (PERSERO)",
      sender: 'Mandiri Care <mandiricare@bankmandiri.co.id>',
      dateReceived: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      snippet:
        "Pembelian Stroom Listrik PLN Rp 350.000 sukses di Livin' by Mandiri.",
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_id_04',
    emailId: 'msg_brimo_01',
    title: 'Indomaret Point Jakarta',
    merchant: 'Indomaret Point',
    amount: 68500,
    currency: 'IDR',
    category: 'Groceries',
    date: new Date(Date.now() - 26 * 3600 * 1000).toISOString().split('T')[0],
    time: '09:42 AM',
    type: 'debit',
    bankAccountId: 'acc_bri_brimo',
    bankAccountName: 'Bank Rakyat Indonesia (BRI) - BRImo (•••• 8901)',
    paymentMethod: 'BRImo QRIS',
    confidenceScore: 0.98,
    isRecurring: false,
    tags: ['indomaret', 'brimo', 'groceries'],
    items: [
      { name: 'Kopi Kenangan Mantan Can', qty: 2, price: 24000 },
      { name: 'Roti Gandum Sari Roti', qty: 1, price: 22000 },
      { name: 'Air Mineral 600ml', qty: 3, price: 22500 },
    ],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'Bukti Transaksi BRImo QRIS Pembayaran Berhasil',
      sender: 'BRImo Info <brimo@bri.co.id>',
      dateReceived: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
      snippet:
        'Pembayaran QRIS Belanja Indomaret Rp 68.500 berhasil melalui BRImo.',
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_id_05',
    emailId: 'msg_gofood_01',
    title: 'GoFood Nasi Padang Sederhana',
    merchant: 'GoFood - RM Padang Sederhana',
    amount: 78000,
    currency: 'IDR',
    category: 'Dining & Food',
    date: new Date(Date.now() - 48 * 3600 * 1000).toISOString().split('T')[0],
    time: '12:30 PM',
    type: 'debit',
    bankAccountId: 'acc_gopay_wallet',
    bankAccountName: 'GoPay / GoTo Wallet (0812••••9910)',
    paymentMethod: 'GoPay Balance',
    confidenceScore: 0.98,
    isRecurring: false,
    notes: 'Makan siang Rendang & Es Teh',
    tags: ['lunch', 'gofood', 'gopay'],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'Struk Pemesanan GoFood Anda #GF-992014',
      sender: 'GoTo Receipts <no-reply@receipts.gojek.com>',
      dateReceived: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      snippet: 'Total pembayaran Rp 78.000 menggunakan Saldo GoPay.',
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_id_06',
    emailId: 'msg_jago_spotify',
    title: 'Netflix Indonesia Premium',
    merchant: 'Netflix Indonesia',
    amount: 186000,
    currency: 'IDR',
    category: 'Entertainment & Subscriptions',
    date: new Date(Date.now() - 3 * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0],
    time: '09:00 AM',
    type: 'debit',
    bankAccountId: 'acc_jago_pocket',
    bankAccountName: 'Bank Jago Main Pocket (•••• 6301)',
    paymentMethod: 'Jago Visa Debit (•••• 6301)',
    confidenceScore: 0.99,
    isRecurring: true,
    recurringFrequency: 'monthly',
    notes: 'Paket Langganan 4K Ultra HD',
    tags: ['streaming', 'subscription', 'jago'],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'Tanda Terima Pembaruan Langganan Netflix Anda',
      sender: 'Netflix <info@mailer.netflix.com>',
      dateReceived: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      snippet:
        'Pembayaran sebesar Rp 186.000 dipotong dari kartu debit Jago Visa ending 6301.',
    },
  },
  {
    id: 'exp_id_07',
    emailId: 'msg_bca_akiraback',
    title: 'Akira Back Jakarta - Client Executive Dinner',
    merchant: 'Akira Back Jakarta',
    amount: 2450000,
    currency: 'IDR',
    category: 'Dining & Food',
    date: new Date(Date.now() - 4 * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0],
    time: '08:45 PM',
    type: 'debit',
    bankAccountId: 'acc_bca_mybca',
    bankAccountName: 'Bank Central Asia (BCA) - myBCA (•••• 8821)',
    paymentMethod: 'BCA Platinum Debit EDC',
    confidenceScore: 0.99,
    isRecurring: false,
    isBusinessExpense: true,
    notes: 'Dinner dengan klien strategic partnership',
    tags: ['dining', 'fine-dining', 'business', 'mybca'],
    items: [
      { name: 'Truffle Tuna Pizza & Wagyu A5', qty: 2, price: 1600000 },
      { name: 'Sashimi Platter & Ocha', qty: 1, price: 850000 },
    ],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'Notifikasi Transaksi EDC BCA - Akira Back Jakarta',
      sender: 'BCA Notifikasi <ebanking@bca.co.id>',
      dateReceived: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      snippet:
        'Transaksi Debit BCA Rp 2.450.000 di AKIRA BACK JAKARTA berhasil.',
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_id_08',
    emailId: 'msg_mandiri_garuda',
    title: 'Garuda Indonesia Jakarta - Bali (Roundtrip)',
    merchant: 'PT Garuda Indonesia (Persero) Tbk',
    amount: 3850000,
    currency: 'IDR',
    category: 'Travel & Transportation',
    date: new Date(Date.now() - 6 * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0],
    time: '10:15 AM',
    type: 'debit',
    bankAccountId: 'acc_mandiri_livin',
    bankAccountName: "Bank Mandiri - Livin' by Mandiri (•••• 4190)",
    paymentMethod: "Livin' Mandiri Virtual Account",
    confidenceScore: 0.99,
    isRecurring: false,
    isBusinessExpense: true,
    isTaxDeductible: true,
    notes: 'Tiket penerbangan dinas kerja ke Denpasar',
    tags: ['flight', 'garuda', 'livin', 'business'],
    items: [{ name: 'Flight Ticket CGK-DPS-CGK', qty: 1, price: 3850000 }],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'E-Ticket Confirmation Garuda Indonesia #GA-77291',
      sender: 'Garuda Indonesia <e-booking@garuda-indonesia.com>',
      dateReceived: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
      snippet:
        'Pemesanan tiket penerbangan Rp 3.850.000 telah lunas via Mandiri Virtual Account.',
    },
    verifiedByUser: true,
  },
  {
    id: 'exp_id_09',
    emailId: 'msg_bni_ibox',
    title: 'iBox Senayan City - Apple Device Upgrade',
    merchant: 'iBox Senayan City',
    amount: 16999000,
    currency: 'IDR',
    category: 'Shopping & Retail',
    date: new Date(Date.now() - 10 * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0],
    time: '03:30 PM',
    type: 'debit',
    bankAccountId: 'acc_bni_wondr',
    bankAccountName: 'Bank Negara Indonesia (BNI) - wondr by BNI (•••• 7812)',
    paymentMethod: 'BNI Emerald Debit EDC',
    confidenceScore: 0.99,
    isRecurring: false,
    isBusinessExpense: true,
    notes: 'Pengadaan workstation laptop kerja',
    tags: ['apple', 'ibox', 'laptop', 'wondr'],
    items: [{ name: 'MacBook Air M3 16GB 512GB', qty: 1, price: 16999000 }],
    source: 'gmail_sync',
    emailMetadata: {
      subject: 'Struk Pembelian iBox Senayan City #IBX-99014',
      sender: 'iBox Receipts <sales@ibox.co.id>',
      dateReceived: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      snippet:
        'Pembayaran Debit BNI Rp 16.999.000 di iBox Senayan City sukses diproses.',
    },
    verifiedByUser: true,
  },
];

export const INDONESIAN_BANK_TEMPLATES = [
  {
    id: 'bni_wondr_alert',
    bank: 'Bank Negara Indonesia (BNI)',
    appName: 'wondr by BNI',
    label: 'wondr by BNI (QRIS / Transfer)',
    sender: 'wondr by BNI <wondr@bni.co.id>',
    subject: 'Notifikasi Transaksi wondr by BNI',
    text: `From: wondr by BNI <wondr@bni.co.id>
To: nasabah@gmail.com
Subject: Notifikasi Transaksi wondr by BNI

Notifikasi Transaksi wondr by BNI
Tanggal / Waktu: 18-08-2026 16:20:00 WIB
No. Referensi: WNDR-8819204812
Rekening Sumber: BNI Taplus (•••• 7812)
Jenis Transaksi: QRIS Payment
Merchant: Starbucks Coffee Indonesia - Grand Indonesia
Nominal Transaksi: Rp 58.000,00
Status: Sukses Berhasil

Terima kasih telah bertransaksi dengan wondr by BNI.
PT Bank Negara Indonesia (Persero) Tbk.`,
  },
  {
    id: 'bca_mybca_qris',
    bank: 'Bank Central Asia (BCA)',
    appName: 'myBCA',
    label: 'myBCA (BCA QRIS / Debit EDC)',
    sender: 'BCA Notifikasi <ebanking@bca.co.id>',
    subject: 'Notifikasi Transaksi Rekening Tahapan BCA (myBCA)',
    text: `From: BCA Notifikasi <ebanking@bca.co.id>
To: nasabah@gmail.com
Subject: Notifikasi Transaksi Rekening Tahapan BCA (myBCA)

Yth. Nasabah BCA,

Transaksi myBCA Rekening Tahapan Anda telah berhasil diproses:
No. Rekening : 8821092810 (•••• 8821)
Nama : NASABAH SETIA
Tanggal / Waktu : 18/08/2026 14:15:20 WIB
Kanal : myBCA Mobile Application
Jenis Transaksi : PEMBAYARAN QRIS / DEBET EDC
Merchant : SPBU PERTAMINA KUNINGAN
Jumlah : IDR 175.000,00
Status : BERHASIL

Terima kasih atas kepercayaan Anda menggunakan layanan myBCA.
PT Bank Central Asia Tbk.`,
  },
  {
    id: 'mandiri_livin_resi',
    bank: 'Bank Mandiri',
    appName: "Livin' by Mandiri",
    label: "Livin' by Mandiri (Resi Tagihan / Token)",
    sender: 'Mandiri Care <mandiricare@bankmandiri.co.id>',
    subject: "Resi Pembayaran Livin' by Mandiri",
    text: `From: Mandiri Care <mandiricare@bankmandiri.co.id>
Subject: Resi Pembayaran Livin' by Mandiri - Sukses

Resi Pembayaran Livin' by Mandiri
Status Transaksi : Berhasil
No. Referensi : LVN2026081899120
Tanggal : 18 Agu 2026, 11:24 WIB
Sumber Dana : Mandiri Tabungan NOW •••• 4190
Nama Biller/Tujuan : PT PLN (PERSERO) / PLN PREPAID
Nominal : Rp 350.000
Biaya Admin : Rp 0
Total Transaksi : Rp 350.000
Nomor Stroom Token : 3910-8201-9921-3810-1049

Terima kasih telah menggunakan Livin' by Mandiri.
PT Bank Mandiri (Persero) Tbk.`,
  },
  {
    id: 'bri_brimo_qris',
    bank: 'Bank Rakyat Indonesia (BRI)',
    appName: 'BRImo',
    label: 'BRImo (Bukti Transaksi QRIS / Debit)',
    sender: 'BRImo Info <brimo@bri.co.id>',
    subject: 'Bukti Transaksi BRImo QRIS Pembayaran Berhasil',
    text: `From: BRImo Info <brimo@bri.co.id>
Subject: Bukti Transaksi BRImo QRIS Pembayaran Berhasil

BUKTI TRANSAKSI BRIMO
Status : Transaksi Berhasil
No. Referensi : BRIMO-889102481
Waktu : 18/08/2026 09:42:11 WIB
Dari Rekening : BRI BritAma •••• 8901
Aplikasi : BRImo Mobile Banking
Merchant / Penerima : Indomaret Point Jakarta
Nominal Transaksi : Rp 68.500
Total Bayar : Rp 68.500
Keterangan : Pembayaran QRIS Belanja Indomaret

PT Bank Rakyat Indonesia (Persero) Tbk.`,
  },
  {
    id: 'bsi_byond_zakat',
    bank: 'Bank Syariah Indonesia (BSI)',
    appName: 'BYOND by BSI',
    label: 'BYOND by BSI (QRIS / Zakat / Donasi)',
    sender: 'BYOND by BSI <byond@bankbsi.co.id>',
    subject: 'Bukti Pembayaran BYOND by BSI - Transaksi Berhasil',
    text: `From: BYOND by BSI <byond@bankbsi.co.id>
Subject: Bukti Pembayaran BYOND by BSI - Transaksi Berhasil

BUKTI TRANSAKSI BYOND by BSI
No. Ref: BYD-20260818-8812
Tanggal: 18 Agu 2026, 13:10 WIB
Rekening Sumber: BSI Tabungan Easy Wadiah (•••• 3091)
Transaksi: Pembayaran QRIS / Donasi
Tujuan / Merchant: BAZNAS Zakat & Infaq Nasional
Nominal: Rp 100.000
Status: Berhasil

Alhamdulillah, terima kasih telah bertransaksi menggunakan BYOND by BSI.
PT Bank Syariah Indonesia Tbk.`,
  },
  {
    id: 'btn_bale_alert',
    bank: 'Bank Tabungan Negara (BTN)',
    appName: 'balé by BTN',
    label: 'balé by BTN (Tagihan / QRIS)',
    sender: 'balé by BTN <bale@btn.co.id>',
    subject: 'Notifikasi Pembayaran balé by BTN Berhasil',
    text: `From: balé by BTN <bale@btn.co.id>
Subject: Notifikasi Pembayaran balé by BTN Berhasil

NOTIFIKASI TRANSAKSI balé by BTN
No. Transaksi : BALE-20260818-9120
Waktu : 18/08/2026 10:15 WIB
Dari Rekening : BTN Batara •••• 2108
Layanan : balé by BTN Super App
Merchant / Biller : IPL Apartemen Mediterania
Jumlah Tagihan : Rp 450.000,00
Status : Transaksi Berhasil

PT Bank Tabungan Negara (Persero) Tbk.`,
  },
  {
    id: 'blu_bca_digital',
    bank: 'blu by BCA Digital (BCA Group)',
    appName: 'blu by BCA Digital',
    label: 'blu by BCA Digital (bluDebit / QRIS)',
    sender: 'HaloBlu BCA Digital <haloblu@bcadigital.co.id>',
    subject: 'Notifikasi Transaksi bluAccount BCA Digital',
    text: `From: HaloBlu BCA Digital <haloblu@bcadigital.co.id>
Subject: Notifikasi Transaksi bluAccount BCA Digital

Hai sobat blu!
Transaksi bluAccount kamu berhasil diproses:
Nominal: Rp 85.000
Merchant: Fore Coffee Senopati
Metode: blu QRIS
Tanggal: 18 Agu 2026, 15:30 WIB
Sisa Saldo bluAccount: Rp 3.250.000

PT Bank Digital BCA (BCA Group)`,
  },
  {
    id: 'jenius_mcard',
    bank: 'Bank BTPN (Jenius)',
    appName: 'Jenius (Bank BTPN)',
    label: 'Jenius m-Card Alert',
    sender: 'Jenius Help <jenius-help@btpn.com>',
    subject: 'Money Out alert from Jenius: IDR 125.000',
    text: `From: Jenius Help <jenius-help@btpn.com>
Subject: Money Out alert from Jenius: IDR 125.000

Jenius Money Out Notification
You have made a successful transaction:
Amount: IDR 125.000
Merchant: Farmers Market Grand Indonesia
Payment Method: Jenius m-Card (•••• 4921)
Date & Time: 18 Aug 2026, 17:15 WIB
Your account balance has been updated.
PT Bank BTPN Tbk.`,
  },
  {
    id: 'cimb_octo_receipt',
    bank: 'Bank CIMB Niaga',
    appName: 'OCTO Mobile',
    label: 'OCTO Mobile CIMB (QRIS / Tiket)',
    sender: 'CIMB Niaga <14041@cimbniaga.co.id>',
    subject: 'Notifikasi Transaksi OCTO Mobile CIMB Niaga',
    text: `From: CIMB Niaga <14041@cimbniaga.co.id>
Subject: Notifikasi Transaksi OCTO Mobile CIMB Niaga

CIMB NIAGA OCTO MOBILE
No. Transaksi : OCTO-9912048
Tanggal : 18/08/2026 13:45 WIB
Dari Rekening : OCTO Savers (•••• 5520)
Merchant / Biller : Cinema XXI / TIX ID
Jumlah : Rp 100.000,00
Keterangan : Pembelian 2 Tiket Bioskop
Status : Berhasil

PT Bank CIMB Niaga Tbk.`,
  },
  {
    id: 'jago_money_out',
    bank: 'Bank Jago',
    appName: 'Bank Jago',
    label: 'Bank Jago (Kantong Utama / Visa)',
    sender: 'Bank Jago <tanya@jago.com>',
    subject: 'Uang keluar sebesar Rp 54.990 dari Kantong Utama',
    text: `From: Bank Jago <tanya@jago.com>
Subject: Uang keluar sebesar Rp 54.990 dari Kantong Utama

Hai! Transaksi kamu berhasil.
Uang Keluar : Rp 54.990
Ke : Spotify Premium Indonesia
Dari Kantong : Kantong Utama (•••• 6301)
Metode Pembayaran : Kartu Debit Jago Visa
Waktu : 18 Agustus 2026, 08:30 WIB
Kategori : Entertainment & Subscriptions
PT Bank Jago Tbk.`,
  },
  {
    id: 'superbank_receipt',
    bank: 'Superbank Indonesia',
    appName: 'Superbank',
    label: 'Superbank (Grab / QRIS Payment)',
    sender: 'Superbank Care <care@superbank.id>',
    subject: 'Transaksi Superbank Berhasil: Rp 45.000',
    text: `From: Superbank Care <care@superbank.id>
Subject: Transaksi Superbank Berhasil: Rp 45.000

SUPERBANK NOTIFIKASI TRANSAKSI
No. Ref: SPB-9910284
Tanggal: 18-08-2026 19:20 WIB
Sumber Dana: Rekening Utama Superbank (•••• 9941)
Merchant: GrabBike Transport
Nominal: Rp 45.000
Status: Berhasil Terbayar

PT Super Bank Indonesia`,
  },
  {
    id: 'seabank_receipt',
    bank: 'SeaBank Indonesia',
    appName: 'SeaBank',
    label: 'SeaBank (Transfer / Shopee)',
    sender: 'SeaBank Care <cs@seabank.co.id>',
    subject: 'Bukti Transfer SeaBank Berhasil',
    text: `From: SeaBank Care <cs@seabank.co.id>
Subject: Bukti Transfer SeaBank Berhasil

BUKTI TRANSAKSI SEABANK
Tanggal: 18/08/2026 20:15 WIB
Pengirim: Rekening SeaBank Tabungan •••• 1102
Penerima: ShopeePay Top Up
Nominal: Rp 150.000
Biaya Transfer: Rp 0 (Gratis)
Total: Rp 150.000
Status: Sukses

PT Bank SeaBank Indonesia`,
  },
  {
    id: 'gofood_receipt',
    bank: 'GoPay Indonesia (GoTo / Bank Jago)',
    appName: 'GoPay / Gojek',
    label: 'GoFood & GoPay Struk',
    sender: 'Gojek Receipts <receipt@go-jek.com>',
    subject: 'Struk Pemesanan GoFood Anda #GF-992014',
    text: `From: Gojek Receipts <receipt@go-jek.com>
Subject: Struk Pemesanan GoFood Anda #GF-992014

Terima kasih telah memesan di GoFood!
Restoran: RM Nasi Padang Sederhana Juanda
Tanggal: 18 Agu 2026, 12:30 WIB
Metode Pembayaran: Saldo GoPay (0812••••9910)

Rincian Pesanan:
1x Paket Nasi Rendang Daging - Rp 45.000
1x Ayam Gulai - Rp 23.000
1x Es Teh Manis - Rp 7.000
Biaya Pengiriman & Kemasan - Rp 10.000
Diskon Voucher - -Rp 10.000
----------------------------------------
Total Pembayaran: Rp 75.000`,
  },
  {
    id: 'shopee_pay_receipt',
    bank: 'ShopeePay',
    appName: 'ShopeePay',
    label: 'ShopeePay Struk',
    sender: 'Shopee Indonesia <notifikasi@shopee.co.id>',
    subject: 'Rincian Pembayaran ShopeePay: Rp 145.000',
    text: `From: Shopee Indonesia <notifikasi@shopee.co.id>
Subject: Rincian Pembayaran ShopeePay: Rp 145.000

RINCIAN PEMBAYARAN SHOPEEPAY
No. Transaksi : SP-991204812
Waktu : 18-08-2026 18:10 WIB
Merchant : Kopi Kenangan Mall Kelapa Gading
Nominal : Rp 145.000
Metode : Saldo ShopeePay
Status : Berhasil`,
  },
  {
    id: 'google_cloud_invoice',
    bank: 'Google Cloud Platform',
    appName: 'Google Cloud Billing',
    label: 'Google Cloud (GCP) Invoice',
    sender: 'Google Cloud Billing <google-cloud-compliance@google.com>',
    subject:
      'Google Cloud: Your invoice is available for Account #01A4B2-990812',
    text: `From: Google Cloud Billing <google-cloud-compliance@google.com>
Subject: Google Cloud: Your invoice is available for Account #01A4B2-990812

Google Cloud Platform
Invoice Summary

Billing Account ID: 01A4B2-990812
Invoice Date: Aug 20, 2026
Payment method: Automatic payment (Visa •••• 4921)

Items:
- Google Cloud Run (Compute) : $ 28.50
- Google Cloud Storage : $ 7.00
- Google Cloud SQL Database : $ 12.70

Total Amount Charged: $ 48.20
Payment status: Paid in full`,
  },
  {
    id: 'aws_monthly_invoice',
    bank: 'Amazon Web Services (AWS)',
    appName: 'AWS Billing',
    label: 'AWS Cloud Invoice',
    sender: 'AWS Billing <no-reply-aws@amazon.com>',
    subject: 'Amazon Web Services: Invoice is Available for Account 99281048',
    text: `From: AWS Billing <no-reply-aws@amazon.com>
Subject: Amazon Web Services: Invoice is Available for Account 99281048

Amazon Web Services Invoice
Account Number: 99281048
Invoice Number: INV-8821098
Billing Period: July 2026 - August 2026

Summary of Charges:
- Amazon Elastic Compute Cloud (EC2): $ 89.20
- Amazon Simple Storage Service (S3): $ 35.30

Total Amount Charged: $ 124.50
Payment Method: Mastercard ending in 8725
Payment Status: Completed`,
  },
  {
    id: 'spoofed_aws_promo',
    bank: 'Untrusted / Spoofed Sender',
    appName: 'Third-Party Deals',
    label: '⚠️ Spoofed AWS Promo (Provenance Gate Test)',
    sender: 'AWS Partner Deals <deals@marketing-partner-cloud.org>',
    subject:
      'Special Offer: AWS Cloud Statement $124.50 Mastercard ...8725 with $100 Voucher',
    text: `From: AWS Partner Deals <deals@marketing-partner-cloud.org>
Subject: Special Offer: AWS Cloud Statement $124.50 Mastercard ...8725 with $100 Voucher

Amazon Web Services Promo Notification
Account Number: 99281048
Summary of Charges:
- Amazon Elastic Compute Cloud (EC2): $ 89.20
- Amazon Simple Storage Service (S3): $ 35.30
Total Amount Charged: $ 124.50
Payment Method: Mastercard ending in 8725

Claim your promotional cloud credits today by clicking this partner link!`,
  },
  {
    id: 'openai_chatgpt_receipt',
    bank: 'OpenAI',
    appName: 'ChatGPT Plus',
    label: 'OpenAI (ChatGPT Plus Receipt)',
    sender: 'OpenAI <receipts@openai.com>',
    subject: 'Your receipt from OpenAI #INV-OAI-98124',
    text: `From: OpenAI <receipts@openai.com>
Subject: Your receipt from OpenAI #INV-OAI-98124

Receipt from OpenAI, LLC
Receipt #: INV-OAI-98124
Date: August 17, 2026

Description:
ChatGPT Plus Subscription (1 Month) - $ 20.00

Amount Charged: $ 20.00
Billed to: Mastercard •••• 8725
Thank you for supporting AI innovation!`,
  },
  {
    id: 'anthropic_claude_receipt',
    bank: 'Anthropic',
    appName: 'Claude Pro',
    label: 'Anthropic (Claude Pro Receipt)',
    sender: 'Anthropic <receipts@anthropic.com>',
    subject: 'Your receipt from Anthropic #INV-ANT-7712',
    text: `From: Anthropic <receipts@anthropic.com>
Subject: Your receipt from Anthropic #INV-ANT-7712

Anthropic, PBC
Receipt for Claude Pro Subscription
Invoice ID: INV-ANT-7712
Date: Aug 15, 2026

Plan: Claude Pro Monthly
Price: $ 20.00

Total Amount Paid: $ 20.00
Payment Method: Visa ending in 4921`,
  },
  {
    id: 'google_ai_pro_receipt',
    bank: 'Google Play',
    appName: 'Google One / Google AI Pro',
    label: 'Google AI Pro (5 TB) Play Receipt',
    sender: 'Google Play <googleplay-noreply@google.com>',
    subject: 'Tanda terima pesanan Google Play Anda dari 22 Agu 2026',
    text: `Delivered-To: wardanimade52@gmail.com
From: Google Play <googleplay-noreply@google.com>
Subject: Tanda terima pesanan Google Play Anda dari 22 Agu 2026
Date: Sat, 22 Aug 2026 09:52:00 +0700

Google Play
Tanda terima pesanan Anda
Nomor pesanan: SOP.3332-2701-9347-75727
Tanggal pesanan: 22 Agu 2026 09.51.59 WIB

Item: Google AI Pro (5 TB) (Google One)
Harga: Rp 77.000/bulan
Pajak: Rp 8.470
Total: Rp 85.470/bulan
Termasuk PPN sebesar Rp 8.470
Metode pembayaran: Mastercard-8725

Jika kelayakan Anda berakhir, langganan Anda akan diperpanjang secara otomatis dengan harga standar bulanan (saat ini Rp 309.000/bulan ditambah pajak yang berlaku).`,
  },
];

export const DEMO_INCOMING_EMAILS = [
  {
    id: 'demo_email_google_ai_pro',
    from: 'Google Play <googleplay-noreply@google.com>',
    subject: 'Tanda terima pesanan Google Play Anda dari 22 Agu 2026',
    date: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    snippet:
      'Terima kasih. Anda telah melakukan pembelian dari Google Play. Total: Rp 85.470/bulan untuk Google AI Pro (5 TB).',
    body: 'Google Play\nTanda terima pesanan Anda\nNomor pesanan: SOP.3332-2701-9347-75727\nTanggal pesanan: 22 Agu 2026 09.51.59 WIB\nItem: Google AI Pro (5 TB) (Google One)\nHarga: Rp 77.000/bulan\nPajak: Rp 8.470\nTotal: Rp 85.470/bulan\nTermasuk PPN sebesar Rp 8.470\nMetode pembayaran: Mastercard-8725\nJika kelayakan Anda berakhir, langganan Anda akan diperpanjang secara otomatis dengan harga standar bulanan (saat ini Rp 309.000/bulan).',
  },
  {
    id: 'demo_email_gcp_cloud',
    from: 'Google Cloud Billing <google-cloud-compliance@google.com>',
    subject:
      'Google Cloud: Your invoice is available for Account #01A4B2-990812',
    date: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    snippet:
      'Automatic payment succeeded: Google Cloud Platform charge of $48.20 has been charged to your Visa ending in 4921.',
    body: 'Google Cloud Platform\nInvoice Summary\nBilling Account ID: 01A4B2-990812\nPayment method: Automatic payment (Visa •••• 4921)\nTotal Amount Charged: $ 48.20\nPayment status: Paid in full',
  },
  {
    id: 'demo_email_openai_receipt',
    from: 'OpenAI <receipts@openai.com>',
    subject: 'Your receipt from OpenAI #INV-OAI-98124',
    date: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    snippet:
      'Thank you for subscribing to ChatGPT Plus. Total amount paid: $20.00 billed to Mastercard 8725.',
    body: 'Receipt from OpenAI, LLC\nReceipt #: INV-OAI-98124\nDescription: ChatGPT Plus Subscription (1 Month)\nAmount Charged: $ 20.00\nBilled to: Mastercard •••• 8725',
  },
  {
    id: 'demo_email_wondr_bni',
    from: 'wondr by BNI <wondr@bni.co.id>',
    subject: 'Notifikasi Transaksi wondr by BNI: QRIS Rp 58.000 di Starbucks',
    date: new Date().toISOString(),
    snippet:
      'Transaksi QRIS via wondr by BNI senilai Rp 58.000 di Starbucks Coffee Indonesia berhasil.',
    body: 'NOTIFIKASI TRANSAKSI wondr by BNI\nNo. Ref: WNDR-8819204812\nRekening: BNI Taplus (•••• 7812)\nNominal: IDR 58.000,00\nKeterangan: QRIS Starbucks Coffee Grand Indonesia\nTanggal: 18-08-2026 16:20:00 WIB\nStatus: TRANSAKSI SUKSES',
  },
  {
    id: 'demo_email_mybca_alert',
    from: 'BCA Notifikasi <ebanking@bca.co.id>',
    subject:
      'Notifikasi Transaksi Rekening Tahapan BCA (myBCA): Debit Rp 175.000 di SPBU Pertamina',
    date: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    snippet:
      'Transaksi Debit / QRIS myBCA senilai Rp 175.000 di SPBU PERTAMINA KUNINGAN pada 18/08/2026 berhasil.',
    body: 'BCA NOTIFIKASI TRANSAKSI (myBCA)\nNo. Rekening : 8821092810 (•••• 8821)\nNominal: IDR 175.000,00\nKeterangan: DEBIT EDC SPBU PERTAMINA KUNINGAN\nTanggal: 18-08-2026 14:15:20 WIB\nStatus: TRANSAKSI BERHASIL',
  },
  {
    id: 'demo_email_mandiri_livin',
    from: 'Mandiri Care <mandiricare@bankmandiri.co.id>',
    subject: "Resi Pembayaran Livin' by Mandiri - PT PLN (PERSERO)",
    date: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    snippet:
      "Resi Pembayaran Livin' by Mandiri Token Listrik PLN Rp 350.000 dari Mandiri Tabungan 4190 Berhasil.",
    body: "Resi Pembayaran Livin' by Mandiri\nStatus Transaksi : Berhasil\nTanggal : 18 Agu 2026, 11:24 WIB\nSumber Dana : Mandiri Tabungan NOW •••• 4190\nNama Biller : PT PLN (PERSERO)\nNominal : Rp 350.000\nTotal Transaksi : Rp 350.000",
  },
  {
    id: 'demo_email_byond_bsi',
    from: 'BYOND by BSI <byond@bankbsi.co.id>',
    subject: 'Bukti Pembayaran BYOND by BSI - Donasi Rp 100.000 Sukses',
    date: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    snippet:
      'Pembayaran Donasi via BYOND by BSI Rp 100.000 dari Tabungan Wadiah 3091 telah berhasil.',
    body: 'BUKTI TRANSAKSI BYOND by BSI\nNo. Ref: BYD-20260818-8812\nTanggal: 18 Agu 2026, 13:10 WIB\nRekening: BSI Tabungan Easy Wadiah (•••• 3091)\nMerchant: BAZNAS Zakat & Infaq Nasional\nNominal: Rp 100.000\nStatus: Berhasil',
  },
  {
    id: 'demo_email_btn_bale',
    from: 'balé by BTN <bale@btn.co.id>',
    subject: 'Notifikasi Pembayaran balé by BTN Berhasil - IPL Apartemen',
    date: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    snippet:
      'Pembayaran tagihan IPL Apartemen Rp 450.000 melalui balé by BTN berhasil diproses.',
    body: 'NOTIFIKASI TRANSAKSI balé by BTN\nNo. Ref: BALE-20260818-9120\nRekening: BTN Batara •••• 2108\nBiller: IPL Apartemen Mediterania\nJumlah: Rp 450.000\nStatus: Berhasil',
  },
  {
    id: 'demo_email_jago_spotify',
    from: 'Bank Jago <tanya@jago.com>',
    subject: 'Uang keluar sebesar Rp 54.990 dari Kantong Utama',
    date: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    snippet:
      'Uang keluar Rp 54.990 ke Spotify Premium dari Kantong Utama (•••• 6301).',
    body: 'Hai! Transaksi kamu berhasil.\nUang Keluar : Rp 54.990\nKe : Spotify Premium Indonesia\nDari Kantong : Kantong Utama (•••• 6301)\nMetode Pembayaran : Kartu Debit Jago Visa\nWaktu : 18 Agustus 2026, 08:30 WIB',
  },
];
