import crypto from 'crypto';
import { Expense } from '../types';
import { verifySenderProvenance } from './senderProvenance';

export type ProvenanceCheckResult = ReturnType<typeof verifySenderProvenance>;

export interface RawEmailPayload {
  senderEmail: string;
  senderDomain?: string;
  subject: string;
  body: string;
  headers?: Record<string, string>;
  receivedDate?: string;
}

export interface IngestionResult {
  expense: Partial<Expense>;
  provenance: ProvenanceCheckResult;
  fingerprint: string;
  confidenceScore: number;
  isAnomaly: boolean;
}

/**
 * Generate a deterministic SHA256 transaction fingerprint to prevent duplicates.
 */
export function generateTransactionFingerprint(
  merchant: string,
  amount: number,
  currency: string,
  date: string,
  paymentMethod: string = ''
): string {
  const normalizedKey = `${merchant.trim().toLowerCase()}_${amount}_${currency.toUpperCase()}_${date}_${paymentMethod.trim().toLowerCase()}`;
  return crypto.createHash('sha256').update(normalizedKey).digest('hex');
}

/**
 * IngestionPipeline Module
 * Deep interface encapsulating email verification, SHA256 fingerprinting,
 * and AI/heuristic extraction behind a single seam.
 */
export class IngestionPipeline {
  static processEmail(
    email: RawEmailPayload,
    parsedData: {
      merchant: string;
      amount: number;
      currency?: string;
      category?: Expense['category'];
      date?: string;
      taxAmount?: number;
      feeAmount?: number;
    }
  ): IngestionResult {
    const provenance = verifySenderProvenance(email.senderEmail);

    const currency = parsedData.currency || 'IDR';
    const date = parsedData.date || new Date().toISOString().split('T')[0];
    const fingerprint = generateTransactionFingerprint(
      parsedData.merchant,
      parsedData.amount,
      currency,
      date
    );

    const expense: Partial<Expense> = {
      merchant: parsedData.merchant,
      amount: parsedData.amount,
      currency: currency as any,
      category: parsedData.category || 'Other',
      date,
      taxAmount: parsedData.taxAmount || 0,
      feeAmount: parsedData.feeAmount || 0,
      fingerprint,
      senderDomain: email.senderDomain || provenance.senderDomain,
      isDomainVerified: provenance.isVerified,
    };

    return {
      expense,
      provenance,
      fingerprint,
      confidenceScore: provenance.isVerified ? 0.98 : 0.75,
      isAnomaly: parsedData.amount > 5000000,
    };
  }
}
