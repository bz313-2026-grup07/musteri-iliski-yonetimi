const { request, app, db, resetDb, tokenFor } = require('./helpers');

beforeAll(resetDb);
afterAll(() => db.destroy());

describe('Giriş', () => {
  test('doğru bilgilerle token döner, parola özeti dönmez', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'satis1@rosebud.test', password: 'Parola123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({ email: 'satis1@rosebud.test', role: 'satis' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/);
  });

  test('yanlış parola 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'satis1@rosebud.test', password: 'yanlis' });
    expect(res.status).toBe(401);
  });

  test('olmayan kullanıcı da aynı 401 mesajını alır', async () => {
    const a = await request(app).post('/api/auth/login').send({ email: 'yok@rosebud.test', password: 'x' });
    const b = await request(app).post('/api/auth/login').send({ email: 'satis1@rosebud.test', password: 'x' });
    expect(a.status).toBe(401);
    expect(a.body.error).toBe(b.body.error);
  });

  test('eksik alan 400 ve alan detayı', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'gecersiz' });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  test('/me token ile kullanıcıyı döner', async () => {
    const token = await tokenFor('teknik');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('teknik');
  });

  test('pasif kullanıcının mevcut token\'ı reddedilir', async () => {
    const token = await tokenFor('teknik');
    await db('users').where({ email: 'teknik@rosebud.test' }).update({ is_active: false });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    await db('users').where({ email: 'teknik@rosebud.test' }).update({ is_active: true });
  });
});

// Fizibilite 5.4 Güvenlik: oturumsuz ve rol dışı isteklerin TAMAMI doğrudan servis üzerinden reddedilmeli
describe('Yetkilendirme (5.4 güvenlik gereksinimi)', () => {
  const protectedEndpoints = [
    ['get', '/api/customers'],
    ['get', '/api/customers/1'],
    ['post', '/api/customers'],
    ['get', '/api/users'],
    ['get', '/api/auth/me'],
  ];

  test.each(protectedEndpoints)('%s %s oturumsuz -> 401', async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
  });

  test('bozuk token -> 401', async () => {
    const res = await request(app).get('/api/customers').set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });

  test('teknik rol müşteri ekleyemez -> 403', async () => {
    const token = await tokenFor('teknik');
    const res = await request(app).post('/api/customers')
      .set('Authorization', `Bearer ${token}`).send({ name: 'Deneme' });
    expect(res.status).toBe(403);
  });

  test('satis rol kullanıcı oluşturamaz -> 403', async () => {
    const token = await tokenFor('satis');
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'X Y', email: 'x@y.test', password: '12345678', role: 'yonetim' });
    expect(res.status).toBe(403);
  });

  test('yonetim kullanıcı oluşturabilir', async () => {
    const token = await tokenFor('yonetim');
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Yeni Satış', email: 'yeni@rosebud.test', password: '12345678', role: 'satis' });
    expect(res.status).toBe(201);
    expect(res.body.data.password_hash).toBeUndefined();
  });
});
