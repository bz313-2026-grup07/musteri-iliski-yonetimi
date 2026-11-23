# Bilet API (Issue #14)

Bilet listesi ve detay sayfalarını yazacak arkadaşlar için. Kod: `server/src/modules/tickets/tickets.routes.js`, testler: `server/tests/tickets.test.js`.

Arayüzde istek atarken her zaman `src/api/client.js` kullanın; token kendiliğinden eklenir:

```js
import api from '../api/client';
const res = await api.get('/tickets', { params: { status: 'acik', page: 1 } });
```

## Değerler

| Alan | Değerler | Ekranda |
|---|---|---|
| `status` | `acik`, `cevap_bekleniyor`, `tamamlandi` | Açık, Cevap bekleniyor, Tamamlandı |
| `category` | `teknik_destek`, `talep`, `proje` | Teknik destek, Talep, Proje |

## Yetki

| İşlem | Kimler |
|---|---|
| Listeleme, detay | herkes |
| Bilet açma | herkes (satış da telefonda gelen talebi kaydedebilir) |
| Durum, kategori, atama, konu değiştirme | teknik + yönetim |

Arayüzde değiştirme kontrollerini `hasRole('teknik')` ile gösterin veya gizleyin. Backend zaten 403 döner.

## Listeleme

`GET /api/tickets`

Bütün filtreler isteğe bağlıdır ve birlikte kullanılabilir:

| Parametre | Örnek | Açıklama |
|---|---|---|
| `q` | `TKT-000012`, `0012`, `trendyol` | bilet numarası veya konu içinde arar |
| `customer` | `kaya` | müşteri adı veya firması |
| `user` | `teknik` | bileti açan veya atanan kullanıcının adı |
| `status` | `acik,cevap_bekleniyor` | virgülle birden fazla durum |
| `category` | `talep` | tek kategori |
| `from`, `to` | `2026-11-01` | açılış tarihi aralığı, iki uç dahil (İstanbul saati) |
| `assignedTo` | `me`, `none`, `4` | bana atanan, atanmamış, belirli kullanıcı |
| `customerId` | `120` | müşteri kartındaki biletler için |
| `page`, `pageSize` | `1`, `25` | sayfalama (en fazla 100) |

Yanıt:

```json
{
  "data": [
    {
      "id": 12,
      "ticket_no": "TKT-000012",
      "subject": "Trendyol siparişleri aktarılmıyor",
      "category": "teknik_destek",
      "status": "acik",
      "customer_id": 120,
      "customer_name": "Ahmet Yılmaz",
      "customer_company": "Yılmaz E-Ticaret",
      "created_by": 2,
      "created_by_name": "Satış Demo 1",
      "assigned_to": 4,
      "assigned_to_name": "Teknik Demo",
      "created_at": "2026-11-23T08:15:00.000Z",
      "updated_at": "2026-11-23T08:15:00.000Z",
      "closed_at": null,
      "message_count": 1,
      "last_message_at": "2026-11-23T08:15:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 25, "total": 133 }
}
```

## Detay

`GET /api/tickets/12` veya `GET /api/tickets/TKT-000012`. Yanıt listedeki satırla aynı biçimdedir: `{ "data": { ... } }`. Bilet yoksa 404 döner.

## Bilet açma

`POST /api/tickets`

```json
{
  "customerId": 120,
  "subject": "Trendyol siparişleri aktarılmıyor",
  "category": "teknik_destek",
  "description": "Dünden beri siparişler panele düşmüyor.",
  "assignedTo": 4
}
```

- `customerId` ve `subject` (en az 3 karakter) zorunlu.
- `category` verilmezse `teknik_destek` olur.
- `description` verilirse bilete ilk mesaj olarak eklenir.
- Atanacak kişilerin listesi için `GET /api/users` kullanın.
- Bilet numarası (`TKT-000013`) otomatik verilir.

Başarılı olursa 201 döner. Doğrulama hatasında 400 döner ve `details` alanında hangi alanın hatalı olduğu yazar; formda alanın altında gösterin.

## Güncelleme

`PATCH /api/tickets/12`. Sadece değişen alanları gönderin:

```json
{ "status": "tamamlandi" }
{ "assignedTo": 4 }
{ "assignedTo": null }
{ "category": "proje", "subject": "Yeni konu" }
```

- Durum `tamamlandi` olunca `closed_at` otomatik dolar. Yeniden açılınca silinir.
- Her değişiklik "kimden neye" bilgisiyle `audit_logs` tablosuna yazılır.

## Sırada (Issue #15)

- `GET /api/tickets/:id/messages`, `POST /api/tickets/:id/messages`
- `POST /api/tickets/:id/attachments` (`middleware/upload.js` hazır)
- Mesaj eklenince biletin `updated_at` değeri güncellensin; müşteriye soru sorulduysa durum `cevap_bekleniyor` yapılabilir.
