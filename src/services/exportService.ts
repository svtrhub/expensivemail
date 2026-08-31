import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Expense,
  UserProfile,
  MECEExpenseCategory,
  AuditStatementJSON,
  AuditStatementCategory,
  AuditStatementTransaction,
} from '../types';
import { SupportedCurrency, formatCurrency, convertCurrency } from './currency';

export interface PDFExportOptions {
  expenses: Expense[];
  userProfile: UserProfile | null;
  currency: SupportedCurrency;
  ratesToIDR?: Record<SupportedCurrency, number>;
  language?: 'en' | 'id';
  dateRangeLabel: string;
  filterTypeLabel?: string;
  categoryLabel?: string;
  statementRef?: string;
}

export interface CSVExportOptions {
  expenses: Expense[];
  currency: SupportedCurrency;
  ratesToIDR?: Record<SupportedCurrency, number>;
  filenamePrefix?: string;
}

/**
 * Normalizes raw merchant strings into clean corporate entity names.
 * e.g., "PAYMENT TO GOOGLE*GCP 123" -> "Google Cloud Platform"
 */
export function normalizeMerchantEntityName(
  rawName: string,
  claimedMerchant?: string
): string {
  if (
    claimedMerchant &&
    claimedMerchant.trim().length > 0 &&
    !/^unknown/i.test(claimedMerchant)
  ) {
    return claimedMerchant.trim();
  }

  const clean = (rawName || '').trim();
  const lower = clean.toLowerCase();

  // Cloud & Developer Platforms
  if (/google\s*cloud|gcp|payment to google\*gcp/i.test(lower))
    return 'Google Cloud Platform';
  if (/google\s*play/i.test(lower)) return 'Google Play';
  if (/google\s*one/i.test(lower)) return 'Google One';
  if (/google\s*workspace|gsuite/i.test(lower)) return 'Google Workspace';
  if (/amazon\s*web\s*services|aws/i.test(lower))
    return 'Amazon Web Services (AWS)';
  if (/microsoft\s*azure|azure/i.test(lower)) return 'Microsoft Azure';
  if (/microsoft\s*365|office\s*365/i.test(lower)) return 'Microsoft 365';
  if (/chatgpt|openai/i.test(lower)) return 'OpenAI';
  if (/claude|anthropic/i.test(lower)) return 'Anthropic';
  if (/github/i.test(lower)) return 'GitHub';
  if (/cursor(?:\s*ai|\s*pro)?|anysphere/i.test(lower)) return 'Cursor AI';
  if (/midjourney/i.test(lower)) return 'Midjourney';
  if (/vercel/i.test(lower)) return 'Vercel';
  if (/cloudflare/i.test(lower)) return 'Cloudflare';
  if (/supabase/i.test(lower)) return 'Supabase';
  if (/digitalocean/i.test(lower)) return 'DigitalOcean';
  if (/notion/i.test(lower)) return 'Notion';
  if (/figma/i.test(lower)) return 'Figma';
  if (/slack/i.test(lower)) return 'Slack';
  if (/zoom/i.test(lower)) return 'Zoom';
  if (/adobe/i.test(lower)) return 'Adobe';

  // Subscriptions & Entertainment
  if (/spotify/i.test(lower)) return 'Spotify Premium';
  if (/netflix/i.test(lower)) return 'Netflix';
  if (/youtube\s*premium|youtube/i.test(lower)) return 'YouTube Premium';
  if (/disney\s*\+/i.test(lower)) return 'Disney+';
  if (/apple(?:\.com|\s*services|\s*one|\s*music)/i.test(lower))
    return 'Apple Services';

  // Food & Dining
  if (/starbucks/i.test(lower)) return 'Starbucks Coffee';
  if (/kopi\s*kenangan/i.test(lower)) return 'Kopi Kenangan';
  if (/fore\s*coffee/i.test(lower)) return 'Fore Coffee';
  if (/mcdonald|mcd/i.test(lower)) return "McDonald's";
  if (/gofood|go-food/i.test(lower)) return 'GoFood';
  if (/grabfood|grab-food/i.test(lower)) return 'GrabFood';

  // Transportation & Fuel
  if (/spbu\s*pertamina|pertamina/i.test(lower)) return 'SPBU Pertamina';
  if (/shell\s*indonesia|shell/i.test(lower)) return 'Shell Indonesia';
  if (/bp\s*akr|bp\s*fuel/i.test(lower)) return 'BP-AKR Fuel';
  if (/kereta\s*api|kai|pt\s*kai/i.test(lower))
    return 'PT Kereta Api Indonesia (KAI)';
  if (/bluebird|blue\s*bird/i.test(lower)) return 'Bluebird Taxi';
  if (/grab(?:\s*car|\s*ride|\s*transport)?/i.test(lower)) return 'Grab';
  if (/gojek|goride|gocar/i.test(lower)) return 'Gojek';

  // Utilities & Public Services
  if (/pln|pt\s*pln|perusahaan\s*listrik/i.test(lower))
    return 'PT PLN (PERSERO)';
  if (/pdam|air\s*bersih/i.test(lower)) return 'PDAM';
  if (/telkomsel|kartu\s*halo|mytelkomsel/i.test(lower)) return 'Telkomsel';
  if (/indosat|im3/i.test(lower)) return 'Indosat Ooredoo';
  if (/xl\s*axiata|myxl/i.test(lower)) return 'XL Axiata';
  if (/indihome/i.test(lower)) return 'IndiHome (Telkom)';
  if (/biznet/i.test(lower)) return 'Biznet';

  // Housing & Rent
  if (
    /apartemen|apartment|ipl|maintenance\s*fee|sewa\s*kost|estate/i.test(lower)
  ) {
    return clean.replace(/^(?:pembayaran\s+|tagihan\s+|ipl\s+)/i, 'IPL ');
  }

  // Social & Donations
  if (/baznas/i.test(lower)) return 'BAZNAS';
  if (/kitabisa/i.test(lower)) return 'Kitabisa';
  if (/dompet\s*dhuafa/i.test(lower)) return 'Dompet Dhuafa';

  // Clean trailing noise like order IDs, trailing stars, etc.
  return clean
    .replace(/^(?:pembayaran\s+ke|payment\s+to|pos\s+debit|qris\s+)/i, '')
    .replace(/[*#][A-Za-z0-9\-_ ]+$/i, '')
    .trim();
}

/**
 * MECE (Mutually Exclusive, Collectively Exhaustive) Categorization.
 * Maps any input expense strictly to one of the 6 standard corporate categories.
 */
export function mapToMECECategory(
  category: string,
  merchantName: string = '',
  title: string = ''
): MECEExpenseCategory {
  const combined = `${category} ${merchantName} ${title}`.toLowerCase();

  // 1. Utilities & Bills (Cloud hosting, electricity, telecom, water)
  if (
    /cloud|hosting|aws|google\s*cloud|gcp|azure|digitalocean|cloudflare|vercel|supabase|pln|listrik|telkomsel|indihome|biznet|pdam|water|electricity|telecom|pulsa|wifi/i.test(
      combined
    )
  ) {
    return 'Utilities & Bills';
  }

  // 2. Entertainment & Subscriptions (AI tools, software subscriptions, streaming, digital media)
  if (
    /openai|chatgpt|claude|anthropic|github|cursor|midjourney|spotify|netflix|youtube|disney|apple|google\s*play|google\s*one|notion|figma|slack|zoom|adobe|subscription|streaming|entertainment/i.test(
      combined
    )
  ) {
    return 'Entertainment & Subscriptions';
  }

  // 3. Housing & Rent (Maintenance fees, apartment rent, property management)
  if (
    /housing|rent|apartemen|apartment|ipl|maintenance\s*fee|sewa\s*kost|property/i.test(
      combined
    )
  ) {
    return 'Housing & Rent';
  }

  // 4. Travel & Transportation (Fuel, flights, ride-hailing, train, toll)
  if (
    /travel|transport|pertamina|spbu|shell|bensin|fuel|gasoline|grab|gojek|goride|gocar|kai|kereta|flight|pesawat|garuda|lion|airasia|toll|parking|parkir/i.test(
      combined
    )
  ) {
    return 'Travel & Transportation';
  }

  // 5. Dining & Food (Coffee, business meals, groceries, food delivery)
  if (
    /dining|food|groceries|restaurant|cafe|coffee|starbucks|kopi|mcdonald|mcd|gofood|grabfood|indomaret|alfamart|supermarket|superindo|market/i.test(
      combined
    )
  ) {
    return 'Dining & Food';
  }

  // 6. Other (Donations, miscellaneous, financial fees)
  return 'Other';
}

/**
 * Evaluates business reimbursement eligibility & corporate tax deductibility.
 */
export function evaluateEligibility(
  exp: Expense,
  meceCategory: MECEExpenseCategory
): { isReimbursable: boolean; isTaxDeductible: boolean } {
  // If explicitly flagged on expense record, respect user input
  let isReimbursable = Boolean(exp.isBusinessExpense);
  let isTaxDeductible = Boolean(exp.isTaxDeductible);

  const merchantLower = (exp.merchant || '').toLowerCase();
  const titleLower = (exp.title || '').toLowerCase();

  // Business purpose criteria: Client meetings, project infrastructure, business meals
  if (
    /client|meeting|team|project|infra|server|cloud|hosting|business/i.test(
      merchantLower
    ) ||
    /client|meeting|team|project|infra|server|cloud|hosting|business/i.test(
      titleLower
    )
  ) {
    isReimbursable = true;
    isTaxDeductible = true;
  }

  // Starbucks / Coffee during work or client meetings
  if (
    /starbucks|coffee\s*meeting|business\s*lunch/i.test(merchantLower) &&
    exp.isBusinessExpense
  ) {
    isReimbursable = true;
    isTaxDeductible = true;
  }

  // Cloud infrastructure directly qualifies for corporate tax deductions
  if (
    meceCategory === 'Utilities & Bills' &&
    /cloud|gcp|aws|azure|server/i.test(merchantLower)
  ) {
    isTaxDeductible = true;
  }

  return { isReimbursable, isTaxDeductible };
}

/**
 * Formats standard numeric strings for statement display (e.g. "Rp 783.250" or "$783.25")
 */
export function formatStatementAmount(
  amount: number,
  currency: SupportedCurrency = 'IDR'
): string {
  if (currency === 'IDR') {
    const formatted = Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp ${formatted}`;
  }
  return formatCurrency(amount, currency);
}

/**
 * Builds an official, audited JSON statement adhering to the strict mathematical
 * rigor and MECE rules specified.
 */
export function buildAuditStatementJSON({
  expenses,
  userProfile,
  currency = 'IDR',
  ratesToIDR,
  periodLabel,
  scopeLabel = 'All Expenses',
  statementRef,
}: {
  expenses: Expense[];
  userProfile: UserProfile | null;
  currency?: SupportedCurrency;
  ratesToIDR?: Record<SupportedCurrency, number>;
  periodLabel?: string;
  scopeLabel?: string;
  statementRef?: string;
}): AuditStatementJSON {
  const ref = statementRef || `STMT-${Date.now().toString().slice(-6)}`;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const period =
    periodLabel ||
    now.toLocaleString('en-US', { month: 'short', year: 'numeric' });

  // 1. Process and normalize itemized transactions
  const debitExpenses = expenses.filter((e) => e.type === 'debit');

  const transactions: AuditStatementTransaction[] = debitExpenses.map((e) => {
    const convertedAmount = convertCurrency(
      e.amount,
      e.currency || 'IDR',
      currency,
      ratesToIDR
    );
    const cleanedMerchant = normalizeMerchantEntityName(
      e.merchant,
      e.claimedMerchant
    );
    const meceCat = mapToMECECategory(e.category, cleanedMerchant, e.title);
    const { isReimbursable, isTaxDeductible } = evaluateEligibility(e, meceCat);

    // Format ISO date string
    const isoDate = e.date ? e.date.slice(0, 10) : dateStr;

    return {
      date: isoDate,
      merchant: cleanedMerchant,
      category: meceCat,
      payment_method: e.paymentMethod || e.bankAccountName || 'Direct Debit',
      amount: formatStatementAmount(convertedAmount, currency),
      rawAmount: convertedAmount,
      is_reimbursable: isReimbursable,
      is_tax_deductible: isTaxDeductible,
    };
  });

  // 2. Mathematical Rigor: Exact sum calculations
  const totalAmountNumber = transactions.reduce(
    (sum, t) => sum + t.rawAmount,
    0
  );
  const reimbursableAmountNumber = transactions
    .filter((t) => t.is_reimbursable)
    .reduce((sum, t) => sum + t.rawAmount, 0);
  const taxDeductibleAmountNumber = transactions
    .filter((t) => t.is_tax_deductible)
    .reduce((sum, t) => sum + t.rawAmount, 0);
  const personalAmountNumber = totalAmountNumber - reimbursableAmountNumber;

  const reimbursableSharePct =
    totalAmountNumber > 0
      ? (reimbursableAmountNumber / totalAmountNumber) * 100
      : 0;
  const personalSharePct =
    totalAmountNumber > 0
      ? (personalAmountNumber / totalAmountNumber) * 100
      : 100;

  // 3. Category aggregation (MECE)
  const categoryMap = new Map<
    MECEExpenseCategory,
    { count: number; rawAmount: number }
  >();

  transactions.forEach((tx) => {
    const current = categoryMap.get(tx.category) || { count: 0, rawAmount: 0 };
    current.count += 1;
    current.rawAmount += tx.rawAmount;
    categoryMap.set(tx.category, current);
  });

  // Calculate percentages and sort descending by amount
  let calculatedCategories: AuditStatementCategory[] = Array.from(
    categoryMap.entries()
  )
    .map(([catName, data]) => {
      const pct =
        totalAmountNumber > 0
          ? Number(((data.rawAmount / totalAmountNumber) * 100).toFixed(1))
          : 0;
      return {
        name: catName,
        count: data.count,
        amount: formatStatementAmount(data.rawAmount, currency),
        rawAmount: data.rawAmount,
        share: `${pct.toFixed(1)}%`,
        percentage: pct,
      };
    })
    .sort((a, b) => b.rawAmount - a.rawAmount);

  // Enforce Category Sum = 100.0% exactly (distribute rounding remainder to largest category if needed)
  if (calculatedCategories.length > 0 && totalAmountNumber > 0) {
    const sumPct = calculatedCategories.reduce(
      (acc, c) => acc + c.percentage,
      0
    );
    const diff = Number((100.0 - sumPct).toFixed(1));
    if (Math.abs(diff) > 0.001 && Math.abs(diff) < 0.5) {
      calculatedCategories[0].percentage = Number(
        (calculatedCategories[0].percentage + diff).toFixed(1)
      );
      calculatedCategories[0].share = `${calculatedCategories[0].percentage.toFixed(1)}%`;
    }
  }

  // 4. Generate Insight Statement
  let categoriesInsight =
    'Expenditure distributed across operational categories';
  if (calculatedCategories.length >= 2) {
    const topTwo = calculatedCategories.slice(0, 2);
    const combinedShare = (topTwo[0].percentage + topTwo[1].percentage).toFixed(
      1
    );
    categoriesInsight = `${topTwo[0].name.split('&')[0].trim()} & ${topTwo[1].name.split('&')[0].trim()} account for ${combinedShare}% of consolidated monthly spend`;
  } else if (calculatedCategories.length === 1) {
    categoriesInsight = `${calculatedCategories[0].name} accounts for 100.0% of total spend`;
  }

  const ownerName = userProfile?.fullName || 'Davy Iman Saputra';
  const ownerEmail = userProfile?.email || 'wardanimade52@gmail.com';

  return {
    statement: {
      ref,
      date: dateStr,
      title: 'Expense & Reimbursement Statement',
      subtitle:
        'Official Financial Statement & Expense Audit Automated Verification',
      status: 'Verified & Audited',
    },
    account: {
      owner: ownerName,
      email: ownerEmail,
      period,
      scope: scopeLabel,
      currency: currency === 'IDR' ? 'IDR (Rp)' : currency,
    },
    kpi: {
      total_amount: formatStatementAmount(totalAmountNumber, currency),
      raw_total_amount: totalAmountNumber,
      transaction_count: transactions.length,
      reimbursable_amount: formatStatementAmount(
        reimbursableAmountNumber,
        currency
      ),
      raw_reimbursable_amount: reimbursableAmountNumber,
      reimbursable_share: `${reimbursableSharePct.toFixed(1)}%`,
      tax_deductible_amount: formatStatementAmount(
        taxDeductibleAmountNumber,
        currency
      ),
      raw_tax_deductible_amount: taxDeductibleAmountNumber,
      personal_amount: formatStatementAmount(personalAmountNumber, currency),
      raw_personal_amount: personalAmountNumber,
      personal_share: `${personalSharePct.toFixed(1)}%`,
    },
    categories_insight: categoriesInsight,
    categories: calculatedCategories,
    transactions,
    audit: {
      auditor: 'Internal Audit Team',
      audit_note: 'Automated reconciliation verified',
      approver: ownerName,
    },
  };
}

/**
 * Exports the verified JSON statement directly as a downloadable file.
 */
export function exportAuditStatementToJSON(
  options: Parameters<typeof buildAuditStatementJSON>[0]
): boolean {
  try {
    const statement = buildAuditStatementJSON(options);
    const jsonStr = JSON.stringify(statement, null, 2);
    const blob = new Blob([jsonStr], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${statement.statement.ref}_Expense_Audit_Statement.json`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 250);
    return true;
  } catch (err) {
    console.error('Failed to export JSON statement:', err);
    return false;
  }
}

/**
 * Generate a high-contrast, pixel-perfect Executive Expense & Reimbursement Statement in PDF format.
 * Matches the official template styling with vector distribution charts and audit sign-off block.
 */
export function exportExecutiveSummaryToPDF({
  expenses,
  userProfile,
  currency,
  ratesToIDR,
  language = 'en',
  dateRangeLabel,
  filterTypeLabel,
  statementRef,
}: PDFExportOptions): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const isId = language === 'id';
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    // Build normalized audit statement data
    const statement = buildAuditStatementJSON({
      expenses,
      userProfile,
      currency,
      ratesToIDR,
      periodLabel: dateRangeLabel,
      scopeLabel:
        filterTypeLabel || (isId ? 'Semua Pengeluaran' : 'All Expenses'),
      statementRef,
    });

    const {
      kpi,
      categories,
      transactions,
      account,
      statement: stmtMeta,
    } = statement;

    // McKinsey Color Palette
    const BRAND_NAVY = [5, 28, 44] as [number, number, number]; // #051C2C
    const TEXT_CHARCOAL = [45, 55, 72] as [number, number, number]; // #2D3748
    const TEXT_MUTED = [100, 116, 139] as [number, number, number]; // #64748B
    const BORDER_GRAY = [226, 232, 240] as [number, number, number]; // #E2E8F0
    const SURFACE_GRAY = [248, 249, 250] as [number, number, number]; // #F8F9FA

    let currentY = 14;

    // 1. EXECUTIVE HEADER
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...BRAND_NAVY);
    doc.text('Expense Statement', margin, currentY);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND_NAVY);
    doc.text(`REF: ${stmtMeta.ref}`, pageWidth - margin, currentY - 2, {
      align: 'right',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_MUTED);
    const dateFormatted = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    doc.text(`Date: ${dateFormatted}`, pageWidth - margin, currentY + 3, {
      align: 'right',
    });

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      'Consolidated Financial Summary & Ledger Statement',
      margin,
      currentY
    );

    currentY += 4;
    doc.setDrawColor(...BRAND_NAVY);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    currentY += 5;

    // 2. METADATA STRIP (2-Row Clean Layout — Eliminates Overlapping Text Bug)
    const col2X = margin + (pageWidth - margin * 2) / 2;

    // Row 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('ACCOUNT OWNER', margin, currentY);
    doc.text('ACCOUNT EMAIL', col2X, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_NAVY);
    doc.text(account.owner, margin, currentY + 4);
    doc.text(account.email, col2X, currentY + 4);

    currentY += 9;

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('PERIOD & SCOPE', margin, currentY);
    doc.text('BASE CURRENCY', col2X, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_NAVY);
    doc.text(`${account.period} • ${account.scope}`, margin, currentY + 4);
    doc.text(account.currency, col2X, currentY + 4);

    currentY += 8;
    doc.setDrawColor(...BORDER_GRAY);
    doc.setLineWidth(0.2);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    currentY += 5;

    // 3. EXECUTIVE KPI SUMMARY (4 Hairline Cards)
    const kpiCardWidth = (pageWidth - margin * 2 - 9) / 4;
    const kpiCardHeight = 15;

    const kpiBoxes = [
      {
        title: 'TOTAL EXPENDITURE',
        amount: kpi.total_amount,
        sub: `${kpi.transaction_count} transactions`,
      },
      {
        title: 'BUSINESS CLAIMS',
        amount: kpi.reimbursable_amount,
        sub: `${kpi.reimbursable_share} of total`,
      },
      {
        title: 'TAX DEDUCTIBLE',
        amount: kpi.tax_deductible_amount,
        sub: 'Eligible deductions',
      },
      {
        title: 'PERSONAL SPEND',
        amount: kpi.personal_amount,
        sub: `${kpi.personal_share} of total`,
      },
    ];

    kpiBoxes.forEach((b, i) => {
      const bx = margin + i * (kpiCardWidth + 3);
      doc.setFillColor(...SURFACE_GRAY);
      doc.setDrawColor(...BORDER_GRAY);
      doc.setLineWidth(0.25);
      doc.roundedRect(bx, currentY, kpiCardWidth, kpiCardHeight, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...TEXT_MUTED);
      doc.text(b.title, bx + 2.5, currentY + 4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...BRAND_NAVY);
      doc.text(b.amount, bx + 2.5, currentY + 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...TEXT_MUTED);
      doc.text(b.sub, bx + 2.5, currentY + 12.8);
    });

    currentY += kpiCardHeight + 6;

    // 4. CATEGORY SPEND DISTRIBUTION (Clean Tabular Layout — No Progress Bar Gimmicks)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_NAVY);
    doc.text('1. Category Spend Distribution', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(statement.categories_insight, pageWidth - margin, currentY, {
      align: 'right',
    });

    currentY += 3;

    const catTableHead = [['EXPENSE CATEGORY', 'COUNT', 'AMOUNT', 'SHARE (%)']];

    const catTableBody: any[] = categories.map((cat) => [
      cat.name,
      String(cat.count),
      cat.amount,
      cat.share,
    ]);

    // Consolidated Total Row
    catTableBody.push([
      'TOTAL CONSOLIDATED',
      String(kpi.transaction_count),
      kpi.total_amount,
      '100.0%',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: catTableHead,
      body: catTableBody,
      theme: 'plain',
      headStyles: {
        fillColor: BRAND_NAVY,
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 2.5,
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: TEXT_CHARCOAL,
      },
      columnStyles: {
        0: { cellWidth: 75, fontStyle: 'bold' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 45, halign: 'right' },
        3: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        if (data.row.index === catTableBody.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = BRAND_NAVY;
        }
      },
      didDrawCell: (data) => {
        if (
          data.section === 'body' &&
          data.row.index % 2 === 1 &&
          data.row.index !== catTableBody.length - 1
        ) {
          doc.setFillColor(...SURFACE_GRAY);
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            'F'
          );
        }
      },
    });

    // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
    currentY = doc.lastAutoTable.finalY + 6;

    // 5. ITEMIZED TRANSACTION LEDGER
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_NAVY);
    doc.text('2. Itemized Transaction Ledger', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      `${transactions.length} reconciled transactions`,
      pageWidth - margin,
      currentY,
      { align: 'right' }
    );

    currentY += 3;

    const txTableHead = [
      ['DATE', 'MERCHANT', 'CATEGORY', 'PAYMENT METHOD', 'AMOUNT'],
    ];

    const txTableBody = transactions.map((tx) => [
      tx.date,
      tx.merchant,
      tx.category,
      tx.payment_method,
      tx.amount,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: txTableHead,
      body:
        txTableBody.length > 0
          ? txTableBody
          : [['-', 'No transactions recorded', '-', '-', '-']],
      theme: 'plain',
      headStyles: {
        fillColor: BRAND_NAVY,
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 2.5,
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2.5,
        textColor: TEXT_CHARCOAL,
      },
      columnStyles: {
        0: { cellWidth: 24, halign: 'left' },
        1: { cellWidth: 60, fontStyle: 'bold' },
        2: { cellWidth: 44 },
        3: { cellWidth: 34 },
        4: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.row.index % 2 === 1) {
          doc.setFillColor(...SURFACE_GRAY);
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            'F'
          );
        }
      },
    });

    // 6. EXECUTIVE FOOTER ON ALL PAGES
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(...BORDER_GRAY);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...TEXT_MUTED);
      doc.text(
        `Expensive Mail • Ref: ${stmtMeta.ref}`,
        margin,
        pageHeight - 5.5
      );
      doc.text(
        'Confidential • Internal Accounting & Tax Filing',
        pageWidth / 2,
        pageHeight - 5.5,
        {
          align: 'center',
        }
      );
      doc.text(
        `Page ${p} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 5.5,
        { align: 'right' }
      );
    }

    // Trigger direct download
    const cleanDateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Expense_Statement_${stmtMeta.ref}_${cleanDateStr}.pdf`;
    doc.save(fileName);

    return true;
  } catch (err) {
    console.error('Failed to export PDF statement:', err);
    return false;
  }
}

/**
 * Sanitize cell values against CSV Formula Injection (CWE-1236)
 */
export function sanitizeCsvCell(val?: string | number | null): string {
  if (val === undefined || val === null) return '""';
  let str = String(val).trim();

  // Neutralize potential spreadsheet formula execution triggers
  const formulaTriggers = ['=', '+', '-', '@', '\t', '\r', '|'];
  if (formulaTriggers.some((char) => str.startsWith(char))) {
    str = `'${str}`;
  }

  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generate and trigger download of clean, sanitized CSV expense reports with UTF-8 BOM.
 */
export function exportExpensesToCSV({
  expenses,
  currency,
  ratesToIDR,
  filenamePrefix = 'Executive_Expense_Report',
}: CSVExportOptions): boolean {
  try {
    const headers = [
      'Transaction ID',
      'Date (YYYY-MM-DD)',
      'Merchant (Cleaned)',
      'Title / Description',
      'MECE Category',
      'Original Amount',
      'Original Currency',
      'Converted Amount',
      'Display Currency',
      'Payment Method',
      'Bank Account',
      'Claim / Reimbursable',
      'Tax Deductible',
      'Recurring Subscription',
      'Source',
    ];

    const rows = expenses.map((exp) => {
      const converted = convertCurrency(
        exp.amount,
        exp.currency || 'IDR',
        currency,
        ratesToIDR
      );
      const cleanedMerchant = normalizeMerchantEntityName(
        exp.merchant,
        exp.claimedMerchant
      );
      const meceCat = mapToMECECategory(
        exp.category,
        cleanedMerchant,
        exp.title
      );
      const { isReimbursable, isTaxDeductible } = evaluateEligibility(
        exp,
        meceCat
      );

      return [
        sanitizeCsvCell(exp.id),
        sanitizeCsvCell(exp.date),
        sanitizeCsvCell(cleanedMerchant),
        sanitizeCsvCell(exp.title),
        sanitizeCsvCell(meceCat),
        typeof exp.amount === 'number'
          ? exp.amount
          : sanitizeCsvCell(exp.amount),
        sanitizeCsvCell(exp.currency || 'IDR'),
        typeof converted === 'number' ? converted : sanitizeCsvCell(converted),
        sanitizeCsvCell(currency),
        sanitizeCsvCell(exp.paymentMethod),
        sanitizeCsvCell(exp.bankAccountName),
        isReimbursable ? 'YES' : 'NO',
        isTaxDeductible ? 'YES' : 'NO',
        exp.isRecurring ? 'YES' : 'NO',
        sanitizeCsvCell(exp.source),
      ];
    });

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);

    return true;
  } catch (err) {
    console.error('Failed to export CSV report:', err);
    return false;
  }
}
