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

## 3. Backend modül yapısı

Her modül üç dosyadan oluşur. Örnek olarak `server/src/modules/tickets/` klasörüne bakın.

| Dosya | Sorumluluk | İçermez |
|---|---|---|
| `x.routes.js` | URL, yetki (`requireRole`), `validate`, `audit`, HTTP yanıtı | SQL, iş kuralı |
| `x.service.js` | iş kuralları ve veritabanı sorguları; hata için `throw notFound()` vb. | `req`, `res` |
| `x.schemas.js` | Zod doğrulama şemaları | iş mantığı |

Kurallar:
- Durum, kategori, rol gibi değerler `src/constants.js` içinden kullanılır; kodda `'acik'`, `'satis'` gibi düz metin yazılmaz.
- Liste uç noktaları `getPagination` ve `paginate` (`utils/query.js`) kullanır; yanıt biçimi `{ data, meta: { page, pageSize, total } }`.
- Express 5 async hataları kendisi yakalar; `try/catch` sadece hatayı gerçekten ele alacaksanız yazılır.
- Yorumlar "ne" değil "neden" sorusunu yanıtlar. Kod zaten ne yaptığını söylüyorsa yorum yazmayın.
- Yeni modülü `src/app.js` dosyasına bağlayın; `tests/` altına en az başarılı istek, 400 ve 403 testleri yazın.

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
- **Görünüm:** Eski PRACRM platformunun kimliği korunarak iyileştirildi: gruplu koyu menü, aramalı beyaz üst bar, IBM Plex Sans yazı tipi. Renkler ve ölçüler `src/index.css` içindeki `:root` değişkenlerinde.
- **Renk kuralı:** Renk süs değil, anlam taşır. Gelen çağrı yeşil, giden çağrı mavi, ticket kehribar, teklif camgöbeği, uyarı kırmızı. Yeni bir ekranda bu eşleşmeyi bozmayın.
- **Menü:** `src/config.js` içindeki `MENU` dizisi gruplardan oluşur. Yeni sayfa için ilgili gruba bir satır, `App.jsx` dosyasına bir rota ekleyin. Sayfa hazır değilse `soon: true` yazın; menüde "yakında" etiketi çıkar. İkon adları: https://icons.getbootstrap.com
- **Hazır bileşenler** (yeni sayfada bunları kullanın, kendi kartınızı yazmayın):
  - `<PageHeader title="Ticket Listesi" subtitle="42 kayıt">butonlar</PageHeader>`: sayfa başlığı
  - `<Panel title="..." icon="..." color="green|blue|amber|teal|red" actions={...} flush>içerik</Panel>`: beyaz kart; `flush` tablolar için
  - `<Pagination />`: sayfalama
  - `utils/format.js`: `formatDuration(saniye)`, `todayIstanbul()`
  - Durum etiketleri için `chip` sınıfı (ör. `<span className="chip chip-in">Gelen</span>`)

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
| GET | `/api/tickets?q=&customer=&user=&status=&category=&from=&to=&assignedTo=` | giriş yapmış |
| GET | `/api/tickets/:id` (id veya `TKT-000012`) | giriş yapmış |
| POST | `/api/tickets` | giriş yapmış (tüm roller) |
| PATCH | `/api/tickets/:id` | teknik |
| GET | `/api/dashboard/daily?date=YYYY-MM-DD` | giriş yapmış |
| GET | `/api/health` | herkese açık |

Ayrıntılı örnekler: `docs/api/biletler.md`

Sıradaki modüller: `interactions`, `offers`, bilet mesajları ve ekleri (#15), `imports` (CSV), `integrations` (API anahtarıyla sürekli aktarım).
