export type LanguageCode = 'en' | 'id';

export interface Translations {
  appName: string;
  appTagline: string;
  tabs: {
    expenseStream: string;
    analytics: string;
    budgets: string;
    inboxParser: string;
  };
  menu: {
    account: string;
    settings: string;
    languages: string;
    currency: string;
    dashboard: string;
    analytics: string;
    budgets: string;
    syncInbox: string;
    addExpense: string;
    exportCsv: string;
    profile: string;
    logout: string;
    loginWithGoogle: string;
    connectedGmail: string;
    notConnected: string;
  };
  metrics: {
    totalSpending: string;
    activeInboxSync: string;
    totalCaptured: string;
    monthlySubscriptions: string;
    fromInbox: string;
    activeFeeds: string;
    manageSubscriptions: string;
    recurringServices: string;
    projectedMonthEnd: string;
    verified: string;
    dailyVelocity: string;
    perDay: string;
    billingCycle: string;
    active: string;
  };
  accounts: {
    title: string;
    subtitle: string;
    allAccounts: string;
    addAccount: string;
    activeSync: string;
    currentBalance: string;
    lastSynced: string;
    linkBank: string;
    unlink: string;
    filtered: string;
  };
  feed: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allCategories: string;
    allTypes: string;
    expensesOnly: string;
    incomeOnly: string;
    subscriptionsOnly: string;
    totalFiltered: string;
    noExpensesFound: string;
    noExpensesDesc: string;
    runSyncNow: string;
    addManualExpense: string;
    viewReceipt: string;
    edit: string;
    delete: string;
    aiConfidence: string;
    sourceEmail: string;
    moreTools: string;
    pullNewEmails: string;
    ingestionRules: string;
    statementSummary: string;
    selectAll: string;
    deselectAll: string;
    selectedCount: string;
    deleteSelected: string;
    changeCategory: string;
    markBusiness: string;
    markTax: string;
    showingEntries: string;
    subscriptionTag: string;
    businessTag: string;
    taxTag: string;
    filterAnomaliesOnly: string;
    noAnomaliesFound: string;
    noAnomaliesDesc: string;
    viewAllExpenses: string;
  };
  analytics: {
    title: string;
    subtitle: string;
    spendingByCategory: string;
    topMerchants: string;
    recurringSubscriptions: string;
    aiInsights: string;
    refreshInsights: string;
    totalTracked: string;
    categoryDistributionDesc: string;
    topMerchantsDesc: string;
    recurringDesc: string;
    noSubscriptionsYet: string;
    orders: string;
    perMonth: string;
  };
  budgets: {
    title: string;
    subtitle: string;
    totalBudget: string;
    spent: string;
    limit: string;
    remaining: string;
    overBudget: string;
    onTrack: string;
    adjustLimit: string;
    save: string;
    cap: string;
    noBudgetsTitle: string;
    noBudgetsDesc: string;
    setupDefaults: string;
  };
  categories: Record<string, string>;
  currencyModal: {
    title: string;
    subtitle: string;
    tabSwitcher: string;
    tabRates: string;
    tabCalculator: string;
    activeCurrency: string;
    ratesTitle: string;
    refreshRatesNow: string;
    updatingRates: string;
    lastUpdated: string;
    rateSource: string;
    autoUpdateEvery: string;
    enabled: string;
    paused: string;
    ratesMatrix: string;
    calcTitle: string;
    calcSubtitle: string;
    fromLabel: string;
    toLabel: string;
    amountLabel: string;
    convertedResultLabel: string;
    rateQuote: string;
    quickPresets: string;
    allCurrenciesTitle: string;
    syncInterval: string;
    close: string;
    swap: string;
  };
  modals: {
    addExpenseTitle: string;
    addExpenseSubtitle: string;
    editExpenseTitle: string;
    chooseAmount: string;
    expenseDebit: string;
    incomeCredit: string;
    merchantLabel: string;
    merchantPlaceholder: string;
    categoryLabel: string;
    bankAccountLabel: string;
    dateLabel: string;
    notesLabel: string;
    recurringCheck: string;
    businessCheck: string;
    taxCheck: string;
    save: string;
    saveExpense: string;
    cancel: string;
    pasteTab: string;
    manualTab: string;
    settingsTitle: string;
    settingsSubtitle: string;
    autoSyncInterval: string;
    emailAlerts: string;
    defaultCurrency: string;
    defaultLanguage: string;
    themeLabel: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    resetDemoData: string;
    resetDesc: string;
    done: string;
    close: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    appName: 'Expensive Mail',
    appTagline: 'Real-Time Mail & Bank Expense Sync',
    tabs: {
      expenseStream: 'Expense Stream',
      analytics: 'Analytics',
      budgets: 'Budgets',
      inboxParser: 'Inbox Feed & Parser',
    },
    menu: {
      account: 'Account',
      settings: 'Settings',
      languages: 'Languages',
      currency: 'Currency',
      dashboard: 'Expense Stream',
      analytics: 'Analytics & Insights',
      budgets: 'Category Budgets',
      syncInbox: 'Sync Mail',
      addExpense: 'Add Expense',
      exportCsv: 'Export CSV',
      profile: 'User Profile',
      logout: 'Sign Out',
      loginWithGoogle: 'Connect Gmail',
      connectedGmail: 'Gmail Connected',
      notConnected: 'Demo / Unlinked',
    },
    metrics: {
      totalSpending: 'Total Spending',
      activeInboxSync: 'Active Inbox Sync',
      totalCaptured: 'Total Expenses Tracked',
      monthlySubscriptions: 'Monthly Subscriptions',
      fromInbox: 'auto-captured from inbox',
      activeFeeds: 'connected bank feeds',
      manageSubscriptions: 'View & Manage',
      recurringServices: 'recurring monthly items',
      projectedMonthEnd: 'Projected month-end',
      verified: 'Verified',
      dailyVelocity: 'Daily Burn Velocity',
      perDay: '/ day',
      billingCycle: 'Billing Cycle',
      active: 'active',
    },
    accounts: {
      title: 'Linked Bank Feeds & Cards',
      subtitle: 'Real-time synchronization across accounts',
      allAccounts: 'All Accounts',
      addAccount: 'Link Bank / Card',
      activeSync: 'Active Sync',
      currentBalance: 'Balance',
      lastSynced: 'Last synced',
      linkBank: 'Link New Bank Feed',
      unlink: 'Remove',
      filtered: 'Filtered',
    },
    feed: {
      title: 'Real-Time Transaction Stream',
      subtitle:
        'Expenses automatically ingested from inbox notices & bank alerts',
      searchPlaceholder: 'Search merchant, item, note, or amount…',
      allCategories: 'All Categories',
      allTypes: 'All Types',
      expensesOnly: 'Expenses (Debits)',
      incomeOnly: 'Income / Refunds',
      subscriptionsOnly: 'Subscriptions Only',
      totalFiltered: 'Total Filtered:',
      noExpensesFound: 'No transactions found',
      noExpensesDesc:
        'Try adjusting your search filters or click "Sync Mail" to scan for incoming bank notices and e-receipts.',
      runSyncNow: 'Run Inbox Sync Now',
      addManualExpense: 'Add Manual Expense',
      viewReceipt: 'View Source Receipt',
      edit: 'Edit',
      delete: 'Delete',
      aiConfidence: 'AI Match Confidence',
      sourceEmail: 'Email Receipt',
      moreTools: 'Tools & Actions',
      pullNewEmails: 'Sync Mail Receipts',
      ingestionRules: 'Auto-Categorization Rules',
      statementSummary: 'Summary & Claim Report',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      selectedCount: 'selected',
      deleteSelected: 'Delete',
      changeCategory: 'Change Category',
      markBusiness: 'Mark as Business',
      markTax: 'Mark Tax-Deductible',
      showingEntries: 'Showing',
      subscriptionTag: 'Subscription',
      businessTag: 'Business',
      taxTag: 'Tax-Deductible',
      filterAnomaliesOnly: 'Filter Anomalies Only',
      noAnomaliesFound: 'No Anomaly Transactions Found',
      noAnomaliesDesc:
        'There are no transactions with extreme spending spikes exceeding the historical baseline.',
      viewAllExpenses: 'View All Expenses',
    },
    analytics: {
      title: 'Spending Intelligence & Analytics',
      subtitle: 'AI-assisted financial breakdown from mail receipts',
      spendingByCategory: 'Spending by Category',
      topMerchants: 'Top Merchants',
      recurringSubscriptions: 'Active Subscriptions',
      aiInsights: 'Gemini AI Insights',
      refreshInsights: 'Refresh AI Insights',
      totalTracked: 'Total Tracked',
      categoryDistributionDesc: 'Distribution across all tracked receipts',
      topMerchantsDesc: 'Highest volume spend destinations',
      recurringDesc: 'Auto-detected recurring memberships',
      noSubscriptionsYet: 'No subscriptions detected yet',
      orders: 'orders',
      perMonth: '/mo',
    },
    budgets: {
      title: 'Monthly budgets',
      subtitle: 'Set and track monthly spending targets across categories',
      totalBudget: 'Total Allocated Budget',
      spent: 'Spent',
      limit: 'Limit',
      remaining: 'Remaining',
      overBudget: 'Over Budget',
      onTrack: 'On Track',
      adjustLimit: 'Adjust Monthly Target',
      save: 'Save Target',
      cap: 'Cap:',
      noBudgetsTitle: 'No Category Budgets Set',
      noBudgetsDesc:
        'Establish monthly category caps to track spending velocity and receive real-time alerts before overspending.',
      setupDefaults: 'Set Up Default Category Budgets',
    },
    categories: {
      'Dining & Food': 'Dining & Food',
      Groceries: 'Groceries',
      'Shopping & Retail': 'Shopping & Retail',
      'Utilities & Bills': 'Utilities & Bills',
      'Travel & Transportation': 'Travel & Transportation',
      'Entertainment & Subscriptions': 'Entertainment & Subscriptions',
      'Health & Wellness': 'Health & Wellness',
      'Housing & Rent': 'Housing & Rent',
      'Financial & Fees': 'Financial & Fees',
      Other: 'Other',
    },
    currencyModal: {
      title: 'Currency & Exchange Rates',
      subtitle:
        'Real-time foreign exchange database & multi-currency converter',
      tabSwitcher: 'Select Currency',
      tabRates: 'Live Exchange Rates',
      tabCalculator: 'Currency Calculator',
      activeCurrency: 'Current Active Currency:',
      ratesTitle: 'Latest Market Exchange Rates',
      refreshRatesNow: 'Refresh Rates Now',
      updatingRates: 'Updating…',
      lastUpdated: 'Last Updated:',
      rateSource: 'Rate Source:',
      autoUpdateEvery: 'Auto-Update Rates Every:',
      enabled: 'ENABLED',
      paused: 'PAUSED',
      ratesMatrix: 'Market Exchange Rates against IDR (Rupiah):',
      calcTitle: 'Simple Currency Converter',
      calcSubtitle: 'Convert instantly between any supported currencies',
      fromLabel: 'From Currency',
      toLabel: 'To Currency',
      amountLabel: 'Enter Amount:',
      convertedResultLabel: 'Converted Result:',
      rateQuote: 'Exchange Rate:',
      quickPresets: 'Quick Amount Presets:',
      allCurrenciesTitle: 'Converted Value in Other Currencies:',
      syncInterval: 'Sync Interval:',
      close: 'Close',
      swap: 'Swap currencies',
    },
    modals: {
      addExpenseTitle: 'Add Manual Expense',
      addExpenseSubtitle: 'Choose amount & log transaction to your ledger',
      editExpenseTitle: 'Edit Expense Entry',
      chooseAmount: 'How Much Money?',
      expenseDebit: 'Expense (Debit)',
      incomeCredit: 'Income / Refund (Credit)',
      merchantLabel: 'Merchant or Description:',
      merchantPlaceholder: 'e.g. Starbucks, Tokopedia, Indomaret, PLN Listrik',
      categoryLabel: 'Category:',
      bankAccountLabel: 'Linked Bank Account / Card:',
      dateLabel: 'Transaction Date:',
      notesLabel: 'Notes (Optional):',
      recurringCheck: 'Mark as recurring monthly subscription / bill',
      businessCheck: 'Mark as business / corporate expense',
      taxCheck: 'Mark as tax deductible expense',
      save: 'Save',
      saveExpense: 'Add Expense',
      cancel: 'Cancel',
      pasteTab: 'Paste Email Receipt (AI)',
      manualTab: 'Manual Amount Form',
      settingsTitle: 'Application Settings',
      settingsSubtitle:
        'Configure sync intervals, currency, language, and notifications',
      autoSyncInterval: 'Auto-Sync Mail Interval',
      emailAlerts: 'Smart Expense Alerts',
      defaultCurrency: 'Default Currency',
      defaultLanguage: 'Display Language',
      themeLabel: 'App Theme & Interface Mode',
      themeLight: 'Light Mode',
      themeDark: 'Dark Mode',
      themeSystem: 'System Auto',
      resetDemoData: 'Reset Demo Data',
      resetDesc: 'Restore fresh bank accounts & receipts dataset',
      done: 'Done',
      close: 'Close',
    },
  },
  id: {
    appName: 'Expensive Mail',
    appTagline: 'Sinkronisasi Pengeluaran Email & Bank Real-Time',
    tabs: {
      expenseStream: 'Arus Pengeluaran',
      analytics: 'Analitik',
      budgets: 'Target Anggaran',
      inboxParser: 'Feed & Parser Email',
    },
    menu: {
      account: 'Akun',
      settings: 'Pengaturan',
      languages: 'Bahasa',
      currency: 'Mata Uang',
      dashboard: 'Arus Pengeluaran',
      analytics: 'Analitik & Wawasan',
      budgets: 'Anggaran Kategori',
      syncInbox: 'Sinkronkan Email',
      addExpense: 'Catat Pengeluaran',
      exportCsv: 'Ekspor CSV',
      profile: 'Profil Pengguna',
      logout: 'Keluar',
      loginWithGoogle: 'Hubungkan Gmail',
      connectedGmail: 'Gmail Terhubung',
      notConnected: 'Mode Demo / Belum Terhubung',
    },
    metrics: {
      totalSpending: 'Total Pengeluaran',
      activeInboxSync: 'Sinkronisasi Email Aktif',
      totalCaptured: 'Total Transaksi Tercatat',
      monthlySubscriptions: 'Langganan Bulanan',
      fromInbox: 'otomatis dari kotak masuk',
      activeFeeds: 'akun bank terhubung',
      manageSubscriptions: 'Lihat & Kelola',
      recurringServices: 'layanan berulang per bulan',
      projectedMonthEnd: 'Proyeksi akhir bulan',
      verified: 'Terverifikasi',
      dailyVelocity: 'Kecepatan Pengeluaran Harian',
      perDay: '/ hari',
      billingCycle: 'Siklus Tagihan',
      active: 'aktif',
    },
    accounts: {
      title: 'Akun Bank & Kartu Terhubung',
      subtitle: 'Sinkronisasi saldo dan transaksi real-time',
      allAccounts: 'Semua Akun',
      addAccount: 'Tambah Akun / Kartu',
      activeSync: 'Sinkron Aktif',
      currentBalance: 'Saldo',
      lastSynced: 'Terakhir disinkronkan',
      linkBank: 'Hubungkan Bank Baru',
      unlink: 'Hapus',
      filtered: 'Terfilter',
    },
    feed: {
      title: 'Arus Transaksi Real-Time',
      subtitle:
        'Pengeluaran otomatis dipindai dari struk email & notifikasi bank',
      searchPlaceholder: 'Cari nama toko, item, catatan, atau nominal…',
      allCategories: 'Semua Kategori',
      allTypes: 'Semua Tipe',
      expensesOnly: 'Pengeluaran (Debit)',
      incomeOnly: 'Pemasukan / Refund (Kredit)',
      subscriptionsOnly: 'Hanya Langganan',
      totalFiltered: 'Total Terfilter:',
      noExpensesFound: 'Tidak ada transaksi ditemukan',
      noExpensesDesc:
        'Coba ubah filter pencarian atau klik "Sinkronkan Email" untuk memindai struk baru.',
      runSyncNow: 'Sinkronkan Email Sekarang',
      addManualExpense: 'Tambah Pengeluaran Manual',
      viewReceipt: 'Lihat Struk Asli',
      edit: 'Ubah',
      delete: 'Hapus',
      aiConfidence: 'Akurasi AI',
      sourceEmail: 'Struk Email',
      moreTools: 'Fitur Tambahan',
      pullNewEmails: 'Tarik Data Email Baru',
      ingestionRules: 'Aturan Auto-Kategori',
      statementSummary: 'Buat Rekap & Klaim',
      selectAll: 'Pilih Semua Transaksi',
      deselectAll: 'Batalkan Pilih Semua',
      selectedCount: 'dipilih',
      deleteSelected: 'Hapus',
      changeCategory: 'Ganti Kategori',
      markBusiness: 'Tandai Bisnis',
      markTax: 'Tandai Potongan Pajak',
      showingEntries: 'Menampilkan',
      subscriptionTag: 'Langganan',
      businessTag: 'Bisnis',
      taxTag: 'Pajak Deductible',
      filterAnomaliesOnly: 'Hanya Tampilkan Anomali',
      noAnomaliesFound: 'Tidak Ada Transaksi Anomali',
      noAnomaliesDesc:
        'Tidak ada transaksi dengan lonjakan ekstrem yang melampaui batas wajar rata-rata historis.',
      viewAllExpenses: 'Lihat Semua Pengeluaran',
    },
    analytics: {
      title: 'Analitik & Wawasan Pengeluaran',
      subtitle: 'Analisis keuangan berbasis AI dari struk email',
      spendingByCategory: 'Pengeluaran per Kategori',
      topMerchants: 'Merchant / Toko Teratas',
      recurringSubscriptions: 'Langganan Aktif',
      aiInsights: 'Wawasan Cerdas Gemini AI',
      refreshInsights: 'Perbarui Wawasan AI',
      totalTracked: 'Total Terlacak',
      categoryDistributionDesc:
        'Distribusi pengeluaran dari seluruh struk email',
      topMerchantsDesc: 'Destinasi belanja dengan total nominal terbesar',
      recurringDesc: 'Layanan langganan rutin yang terdeteksi otomatis',
      noSubscriptionsYet: 'Belum ada transaksi langganan terdeteksi',
      orders: 'pesanan',
      perMonth: '/bln',
    },
    budgets: {
      title: 'Anggaran bulanan',
      subtitle: 'Atur dan pantau batas pengeluaran bulanan di setiap kategori',
      totalBudget: 'Total Target Anggaran',
      spent: 'Terpakai',
      limit: 'Batas',
      remaining: 'Sisa Anggaran',
      overBudget: 'Melebihi Anggaran',
      onTrack: 'Terkendali',
      adjustLimit: 'Ubah Target Bulanan',
      save: 'Simpan Anggaran',
      cap: 'Batas:',
      noBudgetsTitle: 'Belum Ada Target Anggaran Kategori',
      noBudgetsDesc:
        'Atur batas anggaran bulanan per kategori untuk memantau kecepatan pengeluaran dan mendapat peringatan.',
      setupDefaults: 'Aktifkan Target Anggaran Default',
    },
    categories: {
      'Dining & Food': 'Makanan & Restoran',
      Groceries: 'Belanja Kebutuhan / Supermarket',
      'Shopping & Retail': 'Belanja Online & Ritel',
      'Utilities & Bills': 'Tagihan Listrik & Utilitas',
      'Travel & Transportation': 'Transportasi & Bensin',
      'Entertainment & Subscriptions': 'Hiburan & Langganan',
      'Health & Wellness': 'Kesehatan & Obat',
      'Housing & Rent': 'Sewa Tempat & Properti',
      'Financial & Fees': 'Biaya Finansial & Admin',
      Other: 'Lainnya',
    },
    currencyModal: {
      title: 'Mata Uang & Database Kurs',
      subtitle: 'Konversi multi-valuta & database kurs real-time',
      tabSwitcher: 'Pilih Mata Uang',
      tabRates: 'Live Kurs Feed',
      tabCalculator: 'Kalkulator Kurs',
      activeCurrency: 'Mata uang aktif saat ini:',
      ratesTitle: 'Database Kurs Pasar Terkini',
      refreshRatesNow: 'Perbarui Kurs Sekarang',
      updatingRates: 'Memperbarui…',
      lastUpdated: 'Terakhir Diperbarui:',
      rateSource: 'Sumber Kurs:',
      autoUpdateEvery: 'Otomatis Perbarui Kurs Setiap:',
      enabled: 'AKTIF',
      paused: 'NONAKTIF',
      ratesMatrix: 'Nilai Tukar Pasar Terhadap IDR (Rupiah):',
      calcTitle: 'Kalkulator Kurs Sederhana',
      calcSubtitle: 'Konversi instan antar mata uang dunia',
      fromLabel: 'Dari Mata Uang',
      toLabel: 'Ke Mata Uang',
      amountLabel: 'Masukkan Nominal:',
      convertedResultLabel: 'Hasil Konversi:',
      rateQuote: 'Kurs Acuan:',
      quickPresets: 'Pilihan Nominal Cepat:',
      allCurrenciesTitle: 'Hasil Konversi ke Mata Uang Lainnya:',
      syncInterval: 'Interval Sinkronisasi:',
      close: 'Tutup',
      swap: 'Tukar mata uang',
    },
    modals: {
      addExpenseTitle: 'Catat Pengeluaran Manual',
      addExpenseSubtitle: 'Pilih nominal uang dan catat transaksi ke buku kas',
      editExpenseTitle: 'Ubah Data Pengeluaran',
      chooseAmount: 'Berapa Jumlah Uangnya?',
      expenseDebit: 'Pengeluaran (Debit)',
      incomeCredit: 'Pemasukan / Refund (Kredit)',
      merchantLabel: 'Nama Toko / Keterangan:',
      merchantPlaceholder: 'Contoh: Indomaret, Tokopedia, GoFood, PLN Token',
      categoryLabel: 'Kategori:',
      bankAccountLabel: 'Akun Bank / Dompet Digital:',
      dateLabel: 'Tanggal Transaksi:',
      notesLabel: 'Catatan (Opsional):',
      recurringCheck: 'Tandai sebagai langganan / tagihan bulanan rutin',
      businessCheck: 'Tandai sebagai pengeluaran bisnis / kantor',
      taxCheck: 'Tandai pengeluaran dapat dipotong pajak',
      save: 'Simpan',
      saveExpense: 'Catat Transaksi',
      cancel: 'Batal',
      pasteTab: 'Tempel Teks Struk (AI)',
      manualTab: 'Formulir Nominal Manual',
      settingsTitle: 'Pengaturan Aplikasi',
      settingsSubtitle:
        'Konfigurasi interval sinkronisasi, mata uang, bahasa, dan notifikasi',
      autoSyncInterval: 'Interval Sinkronisasi Email Otomatis',
      emailAlerts: 'Notifikasi Cerdas',
      defaultCurrency: 'Mata Uang Utama',
      defaultLanguage: 'Bahasa Tampilan',
      themeLabel: 'Tema & Tampilan Aplikasi',
      themeLight: 'Mode Terang (Light)',
      themeDark: 'Mode Gelap (Dark)',
      themeSystem: 'Sesuai Sistem (Auto)',
      resetDemoData: 'Reset Data Contoh',
      resetDesc: 'Kembalikan data akun bank & struk ke setelan awal IDR',
      done: 'Selesai',
      close: 'Tutup',
    },
  },
};

export function getTranslations(lang: LanguageCode): Translations {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
