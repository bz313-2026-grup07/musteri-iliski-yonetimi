const { request, app, db, resetDb, tokenFor } = require('./helpers');

let satis;
let teknik;
let yonetim;

beforeAll(async () => {
  await resetDb();
  [satis, teknik, yonetim] = await Promise.all([tokenFor('satis'), tokenFor('teknik'), tokenFor('yonetim')]);
});
afterAll(() => db.destroy());

const auth = (t) => ({ Authorization: `Bearer ${t}` });

describe('Müşteri modülü', () => {
  let createdId;

  test('satis müşteri ekler, sorumlu otomatik kendisi olur', async () => {
    const res = await request(app).post('/api/customers').set(auth(satis))
      .send({ name: 'Ahmet Yılmaz', company: 'Yılmaz E-Ticaret', email: 'AHMET@ornek.test', phone: '05551112233', city: 'Kayseri' });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('ahmet@ornek.test');
    expect(res.body.data.owner_id).toBe(2);
    createdId = res.body.data.id;
  });

  test('geçersiz veri 400', async () => {
    const res = await request(app).post('/api/customers').set(auth(satis)).send({ name: 'A', email: 'bozuk' });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field)).toEqual(expect.arrayContaining(['name', 'email']));
  });

  test('arama: ad, firma ve telefon parçasıyla bulunur', async () => {
    await request(app).post('/api/customers').set(auth(satis)).send({ name: 'Zeynep Kaya', company: 'Kaya Tekstil' });
    for (const q of ['ahmet', 'tekstil', '1112233']) {
      const res = await request(app).get(`/api/customers?q=${q}`).set(auth(teknik));
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(1);
    }
  });

  test('sayfalama meta bilgisi döner', async () => {
    const res = await request(app).get('/api/customers?page=1&pageSize=1').set(auth(teknik));
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ page: 1, pageSize: 1, total: 2 });
  });

  test('güncelleme', async () => {
    const res = await request(app).patch(`/api/customers/${createdId}`).set(auth(satis)).send({ city: 'Ankara' });
    expect(res.status).toBe(200);
    expect(res.body.data.city).toBe('Ankara');
    expect(res.body.data.name).toBe('Ahmet Yılmaz');
  });

  test('timeline görüşme, teklif ve bileti tarih sırasıyla birleştirir', async () => {
    await db('interactions').insert({ customer_id: createdId, user_id: 2, note: 'İlk görüşme', occurred_at: '2026-11-01T10:00:00Z' });
    await db('offers').insert({ customer_id: createdId, user_id: 2, title: 'Entegrasyon', amount: 1000, created_at: '2026-11-05T10:00:00Z' });
    await db('tickets').insert({ customer_id: createdId, created_by: 4, subject: 'Hata', created_at: '2026-11-10T10:00:00Z' });

    const res = await request(app).get(`/api/customers/${createdId}/timeline`).set(auth(teknik));
    expect(res.status).toBe(200);
    expect(res.body.data.map((r) => r.type)).toEqual(['ticket', 'offer', 'interaction']);
    expect(res.body.data[0].title).toMatch(/^TKT-000001/);
  });

  test('satis silemez (403), yonetim siler (204)', async () => {
    expect((await request(app).delete(`/api/customers/${createdId}`).set(auth(satis))).status).toBe(403);
    expect((await request(app).delete(`/api/customers/${createdId}`).set(auth(yonetim))).status).toBe(204);
    expect((await request(app).get(`/api/customers/${createdId}`).set(auth(yonetim))).status).toBe(404);
  });

  test('aynı source_id ile ikinci kayıt reddedilir (yeniden aktarım güvencesi)', async () => {
    await db('customers').insert({ source_id: 'ESKI-1', name: 'Bir' });
    await expect(db('customers').insert({ source_id: 'ESKI-1', name: 'İki' })).rejects.toThrow(/unique/i);
  });
});
