import {
  parseEmailReceiptClient,
  classifyEmailIntent,
  extractAnchoredAmount,
} from '../src/services/receiptParser';

const testEmail = {
  id: 'test_user_google_ai',
  subject: 'Tanda Terima Pesanan Google Play Anda dari 22 Agu 2026',
  from: 'Google Play <googleplay-noreply@google.com>',
  date: '2026-08-22T09:51:57+07:00',
  snippet:
    'Anda telah melakukan pembelian langganan dari Google Digital Inc. di Google Play. Langganan Anda akan otomatis diperpanjang pada 22 Sep 2026... Google AI Pro (5 TB) Rp 77.000/bulan Total: Rp 85.470/bulan',
  bodyText: `Davy Iman Saputra <wardanimade52@gmail.com>
Tanda Terima Pesanan Google Play Anda dari 22 Agu 2026
Google Play <googleplay-noreply@google.com> 22 Agustus 2026 pukul 09.52
Balas Ke: Google Play <googleplay-noreply@google.com>
Kepada: wardanimade52@gmail.com
Terima kasih
Anda telah melakukan pembelian langganan dari Google Digital Inc. di Google
Play. Langganan Anda akan otomatis diperpanjang pada 22 Sep 2026
hingga Anda membatalkannya atau kelayakan Anda berakhir. Jika kelayakan
Anda berakhir, langganan akan otomatis berubah menjadi Google AI Pro (5
TB) pada Rp 309.000/bulan ditambah pajak. Manfaat dapat berubah. Pelajari
lebih lanjut
Anda dapat membatalkan kapan saja. Kelola langganan Anda
Nomor pesanan: SOP.3332-2701-9347-75727
Tanggal pesanan: 22 Agu 2026 09.51.57 WIB
Akun Anda: wardanimade52@gmail.com
Item Harga
Google AI Pro (5 TB) (Google One) (oleh Google LLC) Rp 77.000/bulan
Memperpanjang langganan secara otomatis
Pajak: Rp 8.470
Total: Rp 85.470/bulan
Metode pembayaran: Mastercard-8725
Play Points diraih +56
Dengan berlangganan, Anda memberi kami otorisasi untuk menagih biaya langganan kepada Anda (seperti
dijelaskan di atas) secara otomatis, yang ditagihkan ke metode pembayaran yang diberikan sampai langganan
tersebut dibatalkan. Pelajari cara membatalkan. Simpan email ini sebagai catatan.
Ada pertanyaan? Kunjungi Google Digital Inc..`,
};

console.log('--- TESTING INTENT ---');
const intent = classifyEmailIntent(
  testEmail.subject,
  testEmail.from,
  `${testEmail.snippet} ${testEmail.bodyText}`
);
console.log('Intent:', intent);

console.log('--- TESTING ANCHORED AMOUNT ---');
const amount = extractAnchoredAmount(
  `${testEmail.subject} ${testEmail.from} ${testEmail.snippet} ${testEmail.bodyText}`
);
console.log('Amount:', amount);

console.log('--- TESTING CLIENT PARSER ---');
const parsed = parseEmailReceiptClient(testEmail);
console.log('Parsed Expense:', parsed);
