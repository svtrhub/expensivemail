import { GmailRawMessage } from '../types';

export interface FetchEmailResult {
  messages: GmailRawMessage[];
  totalFound: number;
}

// Decode base64url encoded email body
function decodeBase64Url(base64UrlStr: string): string {
  try {
    let base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
  } catch (e) {
    try {
      return atob(base64UrlStr.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

function extractBodyFromPayload(payload: any): string {
  if (!payload) return '';

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    // Prefer text/plain first, then text/html
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        // Strip basic HTML tags for compact AI parsing
        const html = decodeBase64Url(part.body.data);
        return html
          .replace(/<[^>]*>?/gm, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
      if (part.parts) {
        const sub = extractBodyFromPayload(part);
        if (sub) return sub;
      }
    }
  }

  return '';
}

export async function fetchInboxExpenseEmails(
  accessToken: string,
  maxResults = 20,
  customQuery?: string
): Promise<FetchEmailResult> {
  const defaultQuery =
    'subject:(receipt OR invoice OR statement OR order OR payment OR transaction OR charge OR debit OR subscription OR alert OR bill OR "notifikasi transaksi" OR "bukti transaksi" OR "bukti transfer" OR "resi pembayaran" OR "tanda terima" OR "tanda terima pesanan" OR "Google Play" OR "Google AI" OR "Google One" OR "Google Cloud" OR "Google Workspace" OR "YouTube" OR AWS OR "Amazon Web Services" OR OpenAI OR ChatGPT OR Claude OR Anthropic OR GitHub OR Copilot OR Cursor OR Midjourney OR Notion OR Figma OR Canva OR Adobe OR Vercel OR Supabase OR Cloudflare OR Netflix OR Spotify OR struk OR tagihan OR kuitansi OR e-statement OR qris OR "uang keluar" OR "pembayaran berhasil" OR "transaksi berhasil" OR wondr OR myBCA OR Livin OR BRImo OR BYOND OR bale OR Jenius OR OCTO OR blu OR Superbank OR SeaBank OR Allo OR Danamon OR Mega OR SimobiPlus) OR from:(google.com OR googleplay-noreply@google.com OR payments-noreply@google.com OR google-cloud-compliance@google.com OR amazon.com OR aws.amazon.com OR microsoft.com OR openai.com OR anthropic.com OR github.com OR vercel.com OR supabase.com OR notion.so OR figma.com OR canva.com OR adobe.com OR zoom.us OR netflix.com OR spotify.com OR bca.co.id OR klikbca.com OR bankmandiri.co.id OR bri.co.id OR bni.co.id OR jago.com OR btpn.com OR jenius.com OR cimbniaga.co.id OR permatabank.co.id OR bankbsi.co.id OR seabank.co.id OR bcadigital.co.id OR allobank.com OR superbank.id OR bankraya.co.id OR linebank.co.id OR uob.co.id OR dbs.com OR banksinarmas.com OR bankmuamalat.co.id OR maybank.co.id OR danamon.co.id OR bankmega.com OR ocbc.id OR ocbcnisp.com OR panin.co.id OR bankneo.co.id OR gojek.com OR go-jek.com OR ovo.id OR dana.id OR shopee.co.id OR tokopedia.com OR linkaja.id OR astrapay.com OR telkomsel.co.id OR pln.co.id OR paypal.com OR stripe.com OR apple.com OR uber.com)';

  const query = customQuery || defaultQuery;

  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
    query
  )}&maxResults=${maxResults}`;

  try {
    const listRes = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
    });

    if (!listRes.ok) {
      const errText = await listRes.text().catch(() => '');
      console.warn(`Gmail API notice (${listRes.status}): ${errText}`);
      return { messages: [], totalFound: 0 };
    }

    const listData = await listRes.json();
    const rawMessageList = listData.messages || [];

    if (rawMessageList.length === 0) {
      return { messages: [], totalFound: 0 };
    }

    // Fetch individual message details in parallel in chunks of 5 for rate safety
    const itemsToFetch = rawMessageList.slice(0, maxResults);
    const resolved: (GmailRawMessage | null)[] = [];
    const CHUNK_SIZE = 5;

    for (let i = 0; i < itemsToFetch.length; i += CHUNK_SIZE) {
      const chunk = itemsToFetch.slice(i, i + CHUNK_SIZE);
      const chunkPromises = chunk.map(async (item: { id: string }) => {
        try {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
              },
              signal: AbortSignal.timeout
                ? AbortSignal.timeout(5000)
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
            },
            bodyText: bodyText.slice(0, 3000), // Trim body to prevent token blowup while giving sufficient receipt lines
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
      totalFound: listData.resultSizeEstimate || messages.length,
    };
  } catch (err: any) {
    console.warn(
      'Gmail API request could not be completed, returning empty message list:',
      err?.message || err
    );
    return { messages: [], totalFound: 0 };
  }
}
