import { GmailRawMessage } from '../types';

export interface FetchEmailResult {
  messages: GmailRawMessage[];
  totalFound: number;
}

// Safely decode base64url encoded email body handling UTF-8 and binary quirks
function decodeBase64Url(base64UrlStr: string): string {
  if (!base64UrlStr) return '';
  try {
    let base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    try {
      return decodeURIComponent(
        Array.prototype.map
          .call(binary, (c: string) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
    } catch {
      return binary;
    }
  } catch (e) {
    try {
      return atob(base64UrlStr.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

// Deep recursive text extractor across multipart/mixed, multipart/alternative, etc.
function extractBodyFromPayload(payload: any): string {
  if (!payload) return '';

  let plainText = '';
  let htmlText = '';

  function walk(part: any) {
    if (!part) return;

    const mime = (part.mimeType || '').toLowerCase();

    if (mime === 'text/plain' && part.body?.data) {
      const decoded = decodeBase64Url(part.body.data);
      if (decoded) plainText += '\n' + decoded;
    } else if (mime === 'text/html' && part.body?.data) {
      const decoded = decodeBase64Url(part.body.data);
      if (decoded) {
        // Strip HTML tags and normalize whitespace
        const stripped = decoded
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&quot;/gi, '"')
          .replace(/&#39;/gi, "'")
          .replace(/\s+/g, ' ')
          .trim();
        htmlText += '\n' + stripped;
      }
    }

    if (Array.isArray(part.parts)) {
      for (const subPart of part.parts) {
        walk(subPart);
      }
    }
  }

  // Check top-level body first
  if (payload.body?.data) {
    const topDecoded = decodeBase64Url(payload.body.data);
    const mime = (payload.mimeType || '').toLowerCase();
    if (mime.includes('html')) {
      htmlText +=
        '\n' +
        topDecoded
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
    } else {
      plainText += '\n' + topDecoded;
    }
  }

  // Walk any child parts
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      walk(part);
    }
  }

  const result = (plainText.trim() || htmlText.trim()).trim();
  return result;
}

export interface FetchExpenseEmailsOptions {
  maxResults?: number;
  customQuery?: string;
  lastSyncTime?: Date | string | null;
  syncExecutionTime?: Date;
  paginateAll?: boolean;
  maxPages?: number;
  fetchFn?: typeof fetch;
  knownProcessedEmailIds?: Set<string> | string[];
}

/**
 * Format a Date object as YYYY/MM/DD for Gmail search query syntax.
 */
export function formatDateForGmailQuery(date: Date): string {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * Constructs dynamic Gmail search queries with exact date bounds:
 * - Initial sync: 90 days back from syncExecutionTime
 * - Incremental sync: from lastSyncTime with 24-hour safety buffer for timezone & clock tolerance
 */
export function constructGmailSyncQuery(options: {
  lastSyncTime?: Date | string | null;
  syncExecutionTime?: Date;
  tier?: 'primary' | 'secondary' | 'tertiary';
  customQuery?: string;
}): {
  query: string;
  lowerBoundDate: Date;
  isIncremental: boolean;
  formattedDate: string;
} {
  if (options.customQuery) {
    const defaultDate = options.lastSyncTime
      ? new Date(new Date(options.lastSyncTime).getTime() - 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    return {
      query: options.customQuery,
      lowerBoundDate: defaultDate,
      isIncremental: Boolean(options.lastSyncTime),
      formattedDate: formatDateForGmailQuery(defaultDate),
    };
  }

  const executionTime = options.syncExecutionTime
    ? new Date(options.syncExecutionTime)
    : new Date();

  let lowerBoundDate: Date;
  let isIncremental = false;

  if (options.lastSyncTime) {
    // 24-hour buffer prevents UTC/WIB timezone boundary clipping and accommodates Gmail index latency
    const bufferedMillis =
      new Date(options.lastSyncTime).getTime() - 24 * 60 * 60 * 1000;
    lowerBoundDate = new Date(bufferedMillis);
    isIncremental = true;
  } else {
    // Exactly 90 days back from syncExecutionTime for initial backfill
    lowerBoundDate = new Date(
      executionTime.getTime() - 90 * 24 * 60 * 60 * 1000
    );
    isIncremental = false;
  }

  const formattedDate = formatDateForGmailQuery(lowerBoundDate);
  const tier = options.tier || 'primary';

  let query = '';
  if (tier === 'primary') {
    // Comprehensive transactional query covering all receipt, invoice, mobile banking, QRIS, and e-wallet patterns
    query = `(receipt OR invoice OR tagihan OR struk OR payment OR pembayaran OR transfer OR order OR pesanan OR subscription OR langganan OR debit OR bill OR transaksi OR "bukti transaksi" OR "notifikasi transaksi" OR "bukti transfer" OR "bukti pembayaran" OR QRIS OR "BI-FAST" OR "top up" OR purchase OR pembelian OR "berhasil" OR "Google Play" OR "Google AI" OR "Google One" OR "Google Cloud" OR YouTube OR AWS OR OpenAI OR ChatGPT OR Claude OR GitHub OR Netflix OR Spotify OR BCA OR Mandiri OR BNI OR BRI OR BSI OR CIMB OR Jago OR Jenius OR Permata OR Danamon OR OCBC OR SeaBank OR Superbank OR GoPay OR Shopee OR Grab OR Tokopedia OR DANA OR OVO OR LinkAja OR Flip OR PLN OR Telkomsel OR Indosat OR XL OR Apple OR Steam OR Wise OR PayPal) after:${formattedDate}`;
  } else if (tier === 'secondary') {
    query = `(receipt OR invoice OR bill OR tagihan OR payment OR transfer OR transaksi OR order OR struk OR debit OR "Rp" OR "IDR" OR "Total" OR "Status Transaksi") after:${formattedDate}`;
  } else {
    query = `after:${formattedDate}`;
  }

  return {
    query,
    lowerBoundDate,
    isIncremental,
    formattedDate,
  };
}

export async function fetchInboxExpenseEmails(
  accessToken: string,
  optionsOrMaxResults: number | FetchExpenseEmailsOptions = 25,
  legacyCustomQuery?: string
): Promise<FetchEmailResult> {
  const options: FetchExpenseEmailsOptions =
    typeof optionsOrMaxResults === 'number'
      ? {
          maxResults: optionsOrMaxResults,
          customQuery: legacyCustomQuery,
          paginateAll: true,
        }
      : {
          paginateAll: true,
          ...optionsOrMaxResults,
        };

  const maxResults = options.maxResults || 25;
  const fetchImpl =
    options.fetchFn ||
    (typeof window !== 'undefined' ? window.fetch.bind(window) : fetch);
  const syncExecutionTime = options.syncExecutionTime || new Date();

  // Build multi-tier search queries with dynamic date bounding:
  const primary = constructGmailSyncQuery({
    lastSyncTime: options.lastSyncTime,
    syncExecutionTime,
    tier: 'primary',
    customQuery: options.customQuery,
  });

  const secondary = constructGmailSyncQuery({
    lastSyncTime: options.lastSyncTime,
    syncExecutionTime,
    tier: 'secondary',
    customQuery: options.customQuery,
  });

  const tertiary = constructGmailSyncQuery({
    lastSyncTime: options.lastSyncTime,
    syncExecutionTime,
    tier: 'tertiary',
    customQuery: options.customQuery,
  });

  const queriesToTry = options.customQuery
    ? [options.customQuery]
    : [primary.query, secondary.query, tertiary.query];

  try {
    const rawMessageMap = new Map<string, { id: string; threadId?: string }>();
    let totalEstimate = 0;

    for (const queryToRun of queriesToTry) {
      let pageToken: string | undefined = undefined;
      let pageCount = 0;
      const maxPages = options.maxPages || (options.paginateAll ? 10 : 1);
      const pageSize = Math.min(maxResults, 100);

      do {
        pageCount++;
        let listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
          queryToRun
        )}&maxResults=${pageSize}`;

        if (pageToken) {
          listUrl += `&pageToken=${encodeURIComponent(pageToken)}`;
        }

        try {
          const listRes = await fetchImpl(listUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
            signal:
              typeof AbortSignal !== 'undefined' && AbortSignal.timeout
                ? AbortSignal.timeout(10000)
                : undefined,
          });

          if (!listRes.ok) {
            const errText = await listRes.text().catch(() => '');
            console.warn(
              `Gmail API query notice (${listRes.status}): ${errText}`
            );
            break;
          }

          const listData = await listRes.json();
          if (
            Array.isArray(listData.messages) &&
            listData.messages.length > 0
          ) {
            for (const msg of listData.messages) {
              if (msg.id && !rawMessageMap.has(msg.id)) {
                rawMessageMap.set(msg.id, msg);
              }
            }
            totalEstimate = Math.max(
              totalEstimate,
              listData.resultSizeEstimate || rawMessageMap.size
            );
          }

          pageToken = listData.nextPageToken || undefined;
        } catch (qErr) {
          console.warn('Gmail query page attempt notice:', qErr);
          break;
        }
      } while (pageToken && pageCount < maxPages && options.paginateAll);

      // If we got enough messages or satisfied query, avoid running looser fallback tiers
      if (rawMessageMap.size >= maxResults || options.customQuery) {
        break;
      }
    }

    const rawMessageList = Array.from(rawMessageMap.values());

    if (rawMessageList.length === 0) {
      return { messages: [], totalFound: 0 };
    }

    // SPEED OPTIMIZATION: Filter out known processed emails BEFORE downloading their full bodies
    const knownSet = options.knownProcessedEmailIds
      ? options.knownProcessedEmailIds instanceof Set
        ? options.knownProcessedEmailIds
        : new Set(options.knownProcessedEmailIds)
      : null;

    const unreadMessageList = knownSet
      ? rawMessageList.filter((item) => !knownSet.has(item.id))
      : rawMessageList;

    // Fetch individual message details in parallel in chunks of 5 for rate safety
    const itemsToFetch = options.paginateAll
      ? unreadMessageList.slice(
          0,
          Math.max(maxResults, unreadMessageList.length)
        )
      : unreadMessageList.slice(0, maxResults);
    const resolved: (GmailRawMessage | null)[] = [];
    const CHUNK_SIZE = 5;

    for (let i = 0; i < itemsToFetch.length; i += CHUNK_SIZE) {
      const chunk = itemsToFetch.slice(i, i + CHUNK_SIZE);
      const chunkPromises = chunk.map(async (item: { id: string }) => {
        try {
          const msgRes = await fetchImpl(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
              },
              signal:
                typeof AbortSignal !== 'undefined' && AbortSignal.timeout
                  ? AbortSignal.timeout(8000)
                  : undefined,
            }
          );
          if (!msgRes.ok) return null;
          const msgData = await msgRes.json();

          const headers: Record<string, string> = {};
          (msgData.payload?.headers || []).forEach(
            (h: { name: string; value: string }) => {
              headers[h.name.toLowerCase()] = h.value;
            }
          );

          const bodyText = extractBodyFromPayload(msgData.payload);

          const parsed: GmailRawMessage = {
            id: msgData.id,
            threadId: msgData.threadId,
            snippet: msgData.snippet || '',
            internalDate: msgData.internalDate,
            headers: {
              subject: headers['subject'] || 'No Subject',
              from: headers['from'] || 'Unknown Sender',
              date:
                headers['date'] ||
                new Date(
                  parseInt(msgData.internalDate || '0', 10)
                ).toISOString(),
              to: headers['to'] || '',
              'authentication-results':
                headers['authentication-results'] ||
                headers['arc-authentication-results'] ||
                '',
              'received-spf': headers['received-spf'] || '',
              'dkim-signature': headers['dkim-signature'] || '',
            },
            bodyText: bodyText.slice(0, 4000), // Sufficient for multi-item invoices & bank notifications
          };
          return parsed;
        } catch (e) {
          console.warn(`Failed to fetch message ${item.id}`, e);
          return null;
        }
      });
      const chunkResults = await Promise.all(chunkPromises);
      resolved.push(...chunkResults);
    }
    const messages = resolved.filter((m): m is GmailRawMessage => m !== null);

    return {
      messages,
      totalFound: totalEstimate || messages.length,
    };
  } catch (err: any) {
    console.warn(
      'Gmail API request could not be completed, returning empty message list:',
      err?.message || err
    );
    return { messages: [], totalFound: 0 };
  }
}
