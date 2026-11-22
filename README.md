# Müşteri İlişki Yönetimi Yazılımı (Rosebud)

BZ313 Yazılım Mühendisliği dersi kapsamında **Prasoft Yazılım** için geliştirilen web tabanlı CRM. Müşteri kayıtları, görüşme notları, satış teklifleri, destek biletleri ve günlük çağrı analizi tek platformda toplanır.

| Katman | Teknoloji |
|---|---|
| Arayüz | React 19 (Vite), Bootstrap 5, Chart.js |
| API | Node.js 22, Express 5 (REST), Knex, Zod |
| Veritabanı | PostgreSQL 16 |
| Kimlik | JWT, bcrypt, rol tabanlı yetki (yonetim / satis / teknik) |
| Test | Jest, Supertest, Postman |

## Hızlı başlangıç

Gerekenler: **Node.js 22+**, **Docker Desktop** (veya yerel PostgreSQL 16), Git.

```bash
git clone https://github.com/bz313-2026-grup07/musteri-iliski-yonetimi.git
cd musteri-iliski-yonetimi

# 1) Veritabanı
docker compose up -d

# 2) API
cd server
cp .env.example .env
npm install
npm run migrate        # tabloları kurar
npm run seed           # demo kullanıcılar + sahte veri
npm run dev            # http://localhost:4000

# 3) Arayüz (yeni terminal)
cd client
npm install
npm run dev            # http://localhost:5173
```

**Geliştirme hesapları** (parola hepsi için `Parola123!`):

| E-posta | Rol |
|---|---|
| yonetim@rosebud.test | Yönetim (her şey + kullanıcı yönetimi) |
| satis1@rosebud.test, satis2@rosebud.test | Satış |
| teknik@rosebud.test | Teknik |

Fizibilitedeki hacimle (16.000 müşteri, 50.000 çağrı) denemek için:
```bash
SEED_CUSTOMERS=16000 SEED_CALLS=50000 npm run seed
```

## Sık kullanılan komutlar (`server/` içinde)

| Komut | Ne yapar |
|---|---|
| `npm run dev` | API'yi otomatik yeniden başlatmalı çalıştırır |
| `npm test` | Testleri `rosebud_test` veritabanında çalıştırır |
| `npm run lint` | Kod denetimi |
| `npm run migrate:make -- isim` | Yeni migration dosyası açar |
| `npm run db:reset` | Veritabanını sıfırlar, migration ve seed'i yeniden çalıştırır |

## Klasör yapısı

```
client/                 React arayüzü
  src/api/              axios istemcisi (token'ı otomatik ekler)
  src/auth/             giriş, useAuth, ProtectedRoute
  src/components/       ortak bileşenler (Layout, Pagination, formlar)
  src/pages/            sayfalar (Customers.jsx = referans sayfa)
server/                 Express API
  src/modules/<modül>/  her modülün route dosyası (customers = referans modül)
  src/middleware/       auth, rol, hata yönetimi, dosya yükleme
  src/db/migrations/    şema (değiştirmeyin, yeni migration açın)
  src/db/seeds/         demo verisi
  tests/                Jest + Supertest
docs/                   raporlar, görüşme tutanakları, API dokümanı
```

Mimari ve kurallar için: [ARCHITECTURE.md](ARCHITECTURE.md)

## Çalışma düzeni

- `main`: kararlı sürüm. Yalnızca `dev` dalından, sprint sonunda merge edilir.
- `dev`: entegrasyon dalı. Tüm PR'lar buraya açılır.
- `feature/<kisa-ad>`: her iş için ayrı dal, ör. `feature/bilet-listesi`, `fix/musteri-arama`.

1. Kanban panosundan bir issue al ve kendine ata.
2. `git checkout dev && git pull && git checkout -b feature/...`
3. Küçük ve anlamlı commit'ler at. Mesajlar Türkçe ve emir kipinde olsun: `Bilet listesine durum filtresi ekle`.
4. PR'ı `dev` dalına aç, şablonu doldur, issue'yu bağla (`Closes #12`).
5. CI yeşil olmalı ve en az **1 onay** alınmalı.

## Proje ekibi

İsmail Mert Gökdemir · Kübra Şimşek · Yaren Öztürk · Abdullah Rıhtım · Mustafa Ali Karabulut · Mahmut Esat Damlıyurt · Muhammed Kemal Çetinkaya · Metehan Kundakçı · Turgay Alp Çamurlu · Zeynep Yahyalı
