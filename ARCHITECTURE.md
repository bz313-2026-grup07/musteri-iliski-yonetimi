# Mimari ve Kodlama Kuralları

Yeni bir modül yazmadan önce bu dosyayı okuyun. Kısa tutuldu; her kural bir sorunu önlemek için var.

## 1. Genel akış

```
Tarayıcı (React) ──/api/*──▶ Express ──▶ requireAuth ──▶ requireRole ──▶ validate(zod) ──▶ Knex ──▶ PostgreSQL
                                                                                    └──▶ audit()
```

- Arayüz yalnızca `src/api/client.js` üzerinden istek atar; token otomatik eklenir, 401 gelirse girişe yönlendirir.
- Geliştirmede Vite, `/api` isteklerini `localhost:4000` adresine yönlendirir.

## 2. Roller ve yetki

| Rol | Kapsam |
|---|---|
| `yonetim` | Her şey. `requireRole` kontrolünden her zaman geçer. Kullanıcı yönetimi yalnızca bu roldedir. |
| `satis` | Müşteri, görüşme notu, teklif |
| `teknik` | Destek biletleri, çağrı CSV'si, veri aktarımı |

**Kural:** Yetki kontrolü **backend'de** yapılır. Arayüzde butonu gizlemek yalnızca kolaylıktır. Fizibilite 5.4, rol dışı isteklerin doğrudan API üzerinden de reddedildiğinin test edilmesini istiyor (bkz. `tests/auth.test.js`).

## 3. Yeni backend modülü nasıl eklenir

`server/src/modules/customers/customers.routes.js` dosyasını kopyalayın ve şu sırayı izleyin:

1. `router.use(requireAuth)`
2. Zod şeması tanımlayın, `const data = validate(schema, req.body)`
3. Yazma işlemlerinde `requireRole('satis')` (veya ilgili rolü) kullanın
4. Değişiklikten sonra `await audit(req.user.id, 'create', 'tablo', id)`
5. Yanıt biçimi: tek kayıt için `{ data }`, liste için `{ data, meta: { page, pageSize, total } }`
6. Hata fırlatmak için `throw notFound()`, `throw badRequest()` vb. kullanın. Express 5 async hataları kendisi yakalar, try/catch gerekmez.
7. `src/app.js` dosyasında `app.use('/api/...', require(...))` satırını açın
8. `tests/` altına en az şu testleri yazın: başarılı istek, doğrulama hatası (400), rol dışı istek (403)

## 4. Veritabanı

- Şema `src/db/migrations/20261122000001_initial_schema.js` dosyasında. **Mevcut migration'ı değiştirmeyin**; `npm run migrate:make -- aciklama` ile yeni bir migration açın.
- Durum alanları CHECK kısıtıyla sınırlı:
  - `tickets.status`: `acik` | `cevap_bekleniyor` | `tamamlandi`
  - `tickets.category`: `teknik_destek` | `talep` | `proje`
  - `offers.status`: `hazirlandi` | `sunuldu` | `onaylandi` | `reddedildi`
  - `interactions.channel`: `telefon` | `eposta` | `toplanti` | `diger`
- Bilet numarası (`TKT-000001`) veritabanı sequence'ı tarafından otomatik üretilir.
- `customers.source_id` UNIQUE'tir. Eski platformdan aktarımda `INSERT ... ON CONFLICT (source_id) DO UPDATE` kullanın; böylece aynı dosya iki kez aktarılsa da mükerrer kayıt oluşmaz.
- `calls.external_id` de UNIQUE'tir (CSV'de varsa aynı çağrı iki kez yazılmaz).
- Aktarımlar `import_jobs` tablosuna kayıt açar, hatalı satırlar `import_errors` tablosuna gerekçesiyle yazılır.

## 5. Arayüz kuralları

- Yeni liste sayfası için `pages/Customers.jsx`, form için `components/CustomerForm.jsx` dosyasını kopyalayın.
- Rol kontrolü için `const { hasRole } = useAuth()` kullanın.
- **Erişilebilirlik (Fizibilite 5.4):** Her input'un bir `<label htmlFor>` etiketi olsun. Tıklanabilir her şey `<button>` veya `<a>` olsun; tıklanan `<div>` kullanmayın. Klavyeyle gezilebilirliği ve %200 zoom'da bozulmadığını kontrol edin.
- Menüye yeni sayfa eklemek için `components/Layout.jsx` içindeki `NAV` dizisini, rota için `App.jsx` dosyasını güncelleyin.

## 6. Güvenlik ve KVKK

- Gerçek müşteri verisi, KVKK onayı yazılı olarak gelene kadar repoya, seed'e veya ekran görüntülerine girmez.
- `.env` dosyası asla commit'lenmez.
- Dosya yüklemede `middleware/upload.js` kullanın: rastgele dosya adı, MIME beyaz listesi ve boyut sınırı orada tanımlı.

## 7. API özeti (mevcut)

| Metot | Yol | Rol |
|---|---|---|
| POST | `/api/auth/login` | herkese açık |
| GET | `/api/auth/me` | giriş yapmış |
| GET | `/api/users` | giriş yapmış |
| POST, PATCH | `/api/users[/:id]` | yonetim |
| GET | `/api/customers?q=&page=&pageSize=&sort=&order=` | giriş yapmış |
| GET | `/api/customers/:id` ve `/api/customers/:id/timeline` | giriş yapmış |
| POST, PATCH | `/api/customers[/:id]` | satis |
| DELETE | `/api/customers/:id` | yonetim |
| GET | `/api/health` | herkese açık |

Sıradaki modüller: `interactions`, `offers`, `tickets` (+ mesajlar ve ekler), `imports` (CSV), `integrations` (API anahtarıyla sürekli aktarım), `dashboard`.
