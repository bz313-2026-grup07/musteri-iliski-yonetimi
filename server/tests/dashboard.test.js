const { request, app, db, resetDb, tokenFor } = require('./helpers');

let token;

beforeAll(async () => {
  await resetDb();
  token = await tokenFor('satis');

  const [c1] = await db('customers').insert({ name: 'Ahmet Yılmaz', company: 'Yılmaz Ltd.' }).returning('id');
  const [c2] = await db('customers').insert({ name: 'Ayşe Kaya' }).returning('id');

  // 2026-11-20, İstanbul saati (UTC+3). Saat sınırlarını özellikle test ediyoruz.
  await db('calls').insert([
    { call_at: '2026-11-20T09:15:00+03:00', direction: 'gelen', duration_sec: 120, agent_id: 2, customer_id: c1.id },
    { call_at: '2026-11-20T09:45:00+03:00', direction: 'giden', duration_sec: 60, agent_id: 2, customer_id: c1.id },
    { call_at: '2026-11-20T14:05:00+03:00', direction: 'gelen', duration_sec: 300, agent_id: 3, customer_id: c2.id },
    // gece yarısı sınırı: İstanbul'a göre 20 Kasım 00:30 (UTC'de 19 Kasım 21:30)
    { call_at: '2026-11-20T00:30:00+03:00', direction: 'gelen', duration_sec: 30, agent_id: 3, customer_id: null },
    // önceki gün
    { call_at: '2026-11-19T23:50:00+03:00', direction: 'gelen', duration_sec: 45, agent_id: 2, customer_id: c2.id },
  ]);
  await db('tickets').insert([
    { customer_id: c1.id, subject: 'A', status: 'acik' },
    { customer_id: c1.id, subject: 'B', status: 'cevap_bekleniyor' },
    { customer_id: c2.id, subject: 'C', status: 'tamamlandi' },
  ]);
  await db('offers').insert([
    { customer_id: c1.id, title: 'T1', amount: 10, status: 'sunuldu' },
    { customer_id: c2.id, title: 'T2', amount: 10, status: 'hazirlandi' },
  ]);
});
afterAll(() => db.destroy());

const get = (q = '') => request(app).get(`/api/dashboard/daily${q}`).set('Authorization', `Bearer ${token}`);

describe('Günün Analizi', () => {
  test('oturumsuz 401', async () => {
    expect((await request(app).get('/api/dashboard/daily')).status).toBe(401);
  });

  test('geçersiz tarih 400', async () => {
    expect((await get('?date=20-11-2026')).status).toBe(400);
  });

  test('gün toplamları İstanbul saatine göre doğru', async () => {
    const { body: { data } } = await get('?date=2026-11-20');
    expect(data.calls).toEqual({ incoming: 3, outgoing: 1, total_duration_sec: 510, avg_duration_sec: 128 });
    expect(data.previous).toEqual({ incoming: 1, outgoing: 0 });
  });

  test('saatlik dağılım 24 saat, doğru saatlere düşer', async () => {
    const { body: { data } } = await get('?date=2026-11-20');
    expect(data.hourly).toHaveLength(24);
    expect(data.hourly[0]).toEqual({ hour: 0, incoming: 1, outgoing: 0 });
    expect(data.hourly[9]).toEqual({ hour: 9, incoming: 1, outgoing: 1 });
    expect(data.hourly[14]).toEqual({ hour: 14, incoming: 1, outgoing: 0 });
  });

  test('temsilci dökümü ve bugün arayanlar', async () => {
    const { body: { data } } = await get('?date=2026-11-20');
    expect(data.agents.map((a) => [a.id, a.incoming, a.outgoing, a.duration_sec]))
      .toEqual([[2, 1, 1, 180], [3, 2, 0, 330]]);
    expect(data.recentCallers.map((c) => c.name)).toEqual(['Ayşe Kaya', 'Ahmet Yılmaz']);
    expect(data.recentCallers[1]).toMatchObject({ calls: 2, last_direction: 'giden' });
  });

  test('ticket ve teklif sayıları', async () => {
    const { body: { data } } = await get('?date=2026-11-20');
    expect(data.tickets).toMatchObject({ open: 1, waiting: 1 });
    expect(data.offers).toEqual({ draft: 1, sent: 1 });
  });

  test('tarih verilmezse bugün döner', async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.body.data.hourly).toHaveLength(24);
  });
});
