const { request, app, db, resetDb, tokenFor } = require('./helpers');

let satis;
let teknik;
let yonetim;
let ahmet;
let ayse;

beforeAll(async () => {
  await resetDb();
  [satis, teknik, yonetim] = await Promise.all([tokenFor('satis'), tokenFor('teknik'), tokenFor('yonetim')]);
  [ahmet] = await db('customers').insert({ name: 'Ahmet Yılmaz', company: 'Yılmaz E-Ticaret' }).returning('*');
  [ayse] = await db('customers').insert({ name: 'Ayşe Kaya', company: 'Kaya Tekstil' }).returning('*');
});
afterAll(() => db.destroy());

const auth = (t) => ({ Authorization: `Bearer ${t}` });
const create = (token, body) => request(app).post('/api/tickets').set(auth(token)).send(body);

describe('Bilet oluşturma', () => {
  test('bilet açılır, numara otomatik verilir, açıklama ilk mesaj olur', async () => {
    const res = await create(satis, {
      customerId: ahmet.id, subject: 'Trendyol siparişleri aktarılmıyor', category: 'teknik_destek',
      description: 'Dünden beri siparişler panele düşmüyor.',
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      ticket_no: 'TKT-000001', status: 'acik', customer_name: 'Ahmet Yılmaz',
      created_by_name: 'Satış Demo 1', message_count: 1,
    });
    const msgs = await db('ticket_messages').where({ ticket_id: res.body.data.id });
    expect(msgs[0].body).toBe('Dünden beri siparişler panele düşmüyor.');
  });

  test('açıklamasız da açılır, kategori varsayılanı teknik_destek', async () => {
    const res = await create(teknik, { customerId: ayse.id, subject: 'Yeni modül talebi', assignedTo: 4 });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ ticket_no: 'TKT-000002', category: 'teknik_destek', message_count: 0, assigned_to_name: 'Teknik Demo' });
  });

  test('doğrulama: kısa konu, geçersiz kategori, eksik müşteri -> 400', async () => {
    const res = await create(satis, { subject: 'A', category: 'yanlis' });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field)).toEqual(expect.arrayContaining(['customerId', 'subject', 'category']));
  });

  test('olmayan müşteri veya pasif kullanıcıya atama -> 400', async () => {
    expect((await create(satis, { customerId: 9999, subject: 'Deneme konu' })).status).toBe(400);
    await db('users').where({ id: 3 }).update({ is_active: false });
    const res = await create(satis, { customerId: ahmet.id, subject: 'Deneme konu', assignedTo: 3 });
    expect(res.status).toBe(400);
    await db('users').where({ id: 3 }).update({ is_active: true });
  });

  test('oturumsuz -> 401', async () => {
    expect((await request(app).post('/api/tickets').send({})).status).toBe(401);
  });
});

describe('Bilet güncelleme', () => {
  test('satış rolü durum değiştiremez -> 403', async () => {
    const res = await request(app).patch('/api/tickets/1').set(auth(satis)).send({ status: 'tamamlandi' });
    expect(res.status).toBe(403);
  });

  test('tamamlanınca closed_at yazılır, yeniden açılınca silinir', async () => {
    let res = await request(app).patch('/api/tickets/1').set(auth(teknik)).send({ status: 'tamamlandi' });
    expect(res.status).toBe(200);
    expect(res.body.data.closed_at).not.toBeNull();

    res = await request(app).patch('/api/tickets/TKT-000001').set(auth(teknik)).send({ status: 'acik' });
    expect(res.body.data).toMatchObject({ status: 'acik', closed_at: null });
  });

  test('atama, kategori ve konu değişir; değişiklik audit loga yazılır', async () => {
    const res = await request(app).patch('/api/tickets/1').set(auth(yonetim))
      .send({ assignedTo: 4, category: 'talep', subject: 'Trendyol entegrasyon hatası' });
    expect(res.body.data).toMatchObject({ assigned_to: 4, category: 'talep', subject: 'Trendyol entegrasyon hatası' });
    const log = await db('audit_logs').where({ entity: 'tickets', entity_id: '1', action: 'update' }).orderBy('id', 'desc').first();
    expect(log.meta.category).toEqual({ from: 'teknik_destek', to: 'talep' });
  });

  test('boş gövde veya geçersiz durum -> 400, olmayan bilet -> 404', async () => {
    expect((await request(app).patch('/api/tickets/1').set(auth(teknik)).send({})).status).toBe(400);
    expect((await request(app).patch('/api/tickets/1').set(auth(teknik)).send({ status: 'kapali' })).status).toBe(400);
    expect((await request(app).patch('/api/tickets/999').set(auth(teknik)).send({ status: 'acik' })).status).toBe(404);
  });
});

describe('Bilet arama ve listeleme (Fizibilite 5.1 arama ölçütleri)', () => {
  beforeAll(async () => {
    await create(satis, { customerId: ayse.id, subject: 'Fatura sorusu', category: 'talep' });     // TKT-000003
    await db('tickets').where({ ticket_no: 'TKT-000003' }).update({ status: 'cevap_bekleniyor' });
    // Tarih filtresi için: İstanbul'a göre 1 Kasım 00:30 (UTC'de 31 Ekim)
    await db('tickets').where({ ticket_no: 'TKT-000002' }).update({ created_at: '2026-11-01T00:30:00+03:00' });
  });

  const list = (q, token = satis) => request(app).get(`/api/tickets${q}`).set(auth(token));
  const nos = (res) => res.body.data.map((t) => t.ticket_no);

  test('varsayılan: en yeni önce, sayfalama bilgisi', async () => {
    const res = await list('');
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(3);
    expect(nos(res)[0]).toBe('TKT-000003');
  });

  test('bilet numarasıyla (parça da olur)', async () => {
    expect(nos(await list('?q=TKT-000002'))).toEqual(['TKT-000002']);
    expect(nos(await list('?q=0003'))).toEqual(['TKT-000003']);
  });

  test('konu içinde geçen kelimeyle', async () => {
    expect(nos(await list('?q=trendyol'))).toEqual(['TKT-000001']);
  });

  test('müşteri adı veya firmasıyla', async () => {
    expect(nos(await list('?customer=kaya')).sort()).toEqual(['TKT-000002', 'TKT-000003']);
    expect(nos(await list('?customer=yılmaz e-ticaret'))).toEqual(['TKT-000001']);
  });

  test('açan veya atanan kullanıcı adıyla', async () => {
    expect(nos(await list('?user=teknik')).sort()).toEqual(['TKT-000001', 'TKT-000002']);
  });

  test('tarih aralığıyla (İstanbul günü, uçlar dahil)', async () => {
    expect(nos(await list('?from=2026-11-01&to=2026-11-01'))).toEqual(['TKT-000002']);
    expect(nos(await list('?to=2026-10-31'))).toEqual([]);
  });

  test('durum (çoklu), kategori ve "bana atanan"', async () => {
    expect(nos(await list('?status=acik,cevap_bekleniyor')).length).toBe(3);
    expect(nos(await list('?status=cevap_bekleniyor'))).toEqual(['TKT-000003']);
    expect(nos(await list('?category=talep')).sort()).toEqual(['TKT-000001', 'TKT-000003']);
    expect(nos(await list('?assignedTo=me', teknik)).sort()).toEqual(['TKT-000001', 'TKT-000002']);
    expect(nos(await list('?assignedTo=none'))).toEqual(['TKT-000003']);
  });

  test('geçersiz filtre -> 400', async () => {
    expect((await list('?status=kapali')).status).toBe(400);
    expect((await list('?from=01-11-2026')).status).toBe(400);
  });

  test('detay: id veya bilet numarasıyla, küçük harf de olur', async () => {
    const a = await list('/2');
    const b = await list('/tkt-000002');
    expect(a.body.data.ticket_no).toBe('TKT-000002');
    expect(b.body.data.id).toBe(a.body.data.id);
    expect((await list('/TKT-999999')).status).toBe(404);
  });

  test('müşteri kartındaki zaman çizelgesinde biletler görünür', async () => {
    const res = await request(app).get(`/api/customers/${ayse.id}/timeline`).set(auth(satis));
    expect(res.body.data.filter((r) => r.type === 'ticket')).toHaveLength(2);
  });
});
