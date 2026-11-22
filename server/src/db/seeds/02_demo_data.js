/**
 * Sahte (yapay) veri. Gerçek müşteri verisi KVKK onayı gelene kadar kullanılmaz (Fizibilite R-02).
 * Hacim .env'den: SEED_CUSTOMERS (varsayılan 2000), SEED_CALLS (varsayılan 10000).
 * Fizibilitedeki performans testi için: SEED_CUSTOMERS=16000 SEED_CALLS=50000 npm run seed
 *
 * Hız için veriler doğrudan SQL generate_series ile üretilir (16.000 kayıt birkaç saniye).
 */
exports.seed = async function seed(knex) {
  if (process.env.NODE_ENV === 'test') return; // testler kendi verisini kurar

  const nCustomers = Number(process.env.SEED_CUSTOMERS) || 2000;
  const nCalls = Number(process.env.SEED_CALLS) || 10000;

  const firstNames = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Ali', 'Zeynep', 'Mustafa', 'Elif', 'Emre', 'Selin', 'Burak', 'Derya', 'Can', 'Merve', 'Hakan'];
  const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Koç', 'Kurt', 'Özdemir'];
  const companies = ['Ticaret', 'E-Ticaret', 'Tekstil', 'Gıda', 'Elektronik', 'Mobilya', 'Kozmetik', 'Oto Yedek Parça', 'Kırtasiye', 'Spor'];
  const cities = ['Kayseri', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Konya', 'Antalya', 'Adana', 'Gaziantep', 'Eskişehir'];

  const arr = (a) => `ARRAY[${a.map((s) => `'${s}'`).join(',')}]`;

  // Müşteriler (hashint4: deterministik ama dağınık sahte değerler)
  await knex.raw(`
    INSERT INTO customers (source_id, name, company, email, phone, city, owner_id, created_at)
    SELECT
      'ESKI-' || g,
      (${arr(firstNames)})[1 + h.a % ${firstNames.length}] || ' ' || (${arr(lastNames)})[1 + h.b % ${lastNames.length}],
      (${arr(lastNames)})[1 + (h.a / 7) % ${lastNames.length}] || ' ' || (${arr(companies)})[1 + h.d % ${companies.length}] || ' Ltd. Şti.',
      'musteri' || g || '@ornek.test',
      '05' || lpad((h.a % 1000000000)::text, 9, '0'),
      (${arr(cities)})[1 + h.e % ${cities.length}],
      2 + h.b % 2,
      now() - ((h.c % 720) || ' days')::interval - ((h.d % 86400) || ' seconds')::interval
    FROM generate_series(1, ?) AS g,
    LATERAL (SELECT abs(hashint4(g)) a, abs(hashint4(g + 1000003)) b, abs(hashint4(g + 2000003)) c,
                    abs(hashint4(g + 3000017)) d, abs(hashint4(g + 4000037)) e) h
  `, [nCustomers]);

  // Görüşmeler: ilk 1/4 müşteriye 1-3 görüşme
  await knex.raw(`
    INSERT INTO interactions (customer_id, user_id, occurred_at, channel, direction, duration_sec, note, outcome)
    SELECT c.id,
           CASE WHEN k % 2 = 0 THEN 2 ELSE 3 END,
           now() - ((c.id % 90) || ' days')::interval - (k || ' hours')::interval,
           (ARRAY['telefon','eposta','toplanti'])[1 + (k % 3)],
           (ARRAY['gelen','giden'])[1 + ((c.id + k) % 2)],
           60 + (c.id * k) % 900,
           'Demo görüşme notu #' || k,
           (ARRAY['Bilgi verildi','Teklif istendi','Tekrar aranacak','Olumsuz'])[1 + ((c.id + k) % 4)]
    FROM customers c, generate_series(1, 3) AS k
    WHERE c.id <= ? AND k <= 1 + (c.id % 3)
  `, [Math.ceil(nCustomers / 4)]);

  // Teklifler
  await knex.raw(`
    INSERT INTO offers (customer_id, user_id, title, scope, amount, offer_date, status)
    SELECT c.id, CASE WHEN c.id % 2 = 0 THEN 2 ELSE 3 END,
           (ARRAY['Pazaryeri entegrasyon paketi','E-ticaret altyapı teklifi','Bakım-destek sözleşmesi'])[1 + (c.id % 3)],
           'Demo kapsam açıklaması',
           (5000 + (c.id * 137) % 45000)::numeric,
           (now() - ((c.id % 60) || ' days')::interval)::date,
           (ARRAY['hazirlandi','sunuldu','onaylandi','reddedildi'])[1 + (c.id % 4)]
    FROM customers c WHERE c.id % 5 = 0
  `);

  // Biletler + ilk mesaj
  await knex.raw(`
    INSERT INTO tickets (customer_id, created_by, assigned_to, subject, category, status, created_at)
    SELECT c.id, 4, 4,
           (ARRAY['Entegrasyon hatası','Sipariş aktarılmıyor','Yeni modül talebi','Fatura sorusu'])[1 + (c.id % 4)],
           (ARRAY['teknik_destek','talep','proje'])[1 + (c.id % 3)],
           (ARRAY['acik','cevap_bekleniyor','tamamlandi'])[1 + (c.id % 3)],
           now() - ((c.id % 30) || ' days')::interval
    FROM customers c WHERE c.id % 8 = 0
  `);
  await knex.raw(`
    INSERT INTO ticket_messages (ticket_id, user_id, body, created_at)
    SELECT t.id, 4, 'Müşteri talebi alındı, inceleniyor.', t.created_at FROM tickets t
  `);

  // Çağrılar: son 30 gün, temsilciler 2,3,4
  await knex.raw(`
    INSERT INTO calls (call_at, direction, duration_sec, agent_id, customer_id)
    SELECT date_trunc('day', now()) - ((g % 30) || ' days')::interval + ((8 * 3600 + (g * 37) % 36000) || ' seconds')::interval,
           (ARRAY['gelen','giden'])[1 + (g % 2)],
           15 + (g * 53) % 1200,
           2 + (g % 3),
           1 + (g % ?)
    FROM generate_series(1, ?) AS g
  `, [nCustomers, nCalls]);
};
