/** Uygulama geneli sabitler */
export const APP_NAME = 'PRACRM';
export const COMPANY_NAME = 'Prasoft Yazılım';

/**
 * Sol menü - gruplar ve sayfalar.
 * - icon : Bootstrap Icons adı (https://icons.getbootstrap.com)
 * - tone : ikon rengi; işin türünü gösterir (calls | customers | tickets | offers | finance | system)
 * - roles: yoksa herkes görür; [] = yalnızca yonetim; ['teknik'] = teknik + yonetim
 * - soon : true ise sayfa henüz yazılmadı, menüde "yakında" etiketi çıkar
 *
 * Yeni sayfa ekleyince: buraya bir satır + App.jsx'e bir rota.
 */
export const MENU = [
  {
    group: 'Genel',
    items: [
      { to: '/', label: 'Günün Analizi', icon: 'activity', tone: 'calls', end: true },
      { to: '/bildirimler', label: 'Bildirimler', icon: 'bell', tone: 'system', soon: true },
    ],
  },
  {
    group: 'Müşteri ilişkileri',
    items: [
      { to: '/musteriler', label: 'Müşteriler', icon: 'person-vcard', tone: 'customers' },
      { to: '/myd', label: 'MYD', icon: 'diagram-3', tone: 'customers', soon: true },
      { to: '/teklifler', label: 'Teklif Listesi', icon: 'file-earmark-text', tone: 'offers' },
      { to: '/anketler', label: 'Müşteri Anketleri', icon: 'clipboard-data', tone: 'customers', soon: true },
    ],
  },
  {
    group: 'Destek',
    items: [
      { to: '/biletler', label: 'Ticket Listesi', icon: 'ticket-perforated', tone: 'tickets' },
      { to: '/sirket-ici-ticket', label: 'Şirket İçi Ticket', icon: 'building', tone: 'tickets', soon: true },
      { to: '/hosting', label: 'Hosting Takibi', icon: 'hdd-stack', tone: 'tickets', soon: true },
    ],
  },
  {
    group: 'Finans',
    items: [
      { to: '/faturalar', label: 'Dekont / Fatura', icon: 'receipt', tone: 'finance', soon: true },
    ],
  },
  {
    group: 'Yönetim',
    items: [
      { to: '/kullanicilar', label: 'Kullanıcılar', icon: 'people', tone: 'system', roles: [] },
      { to: '/aktarim', label: 'Veri Aktarımı', icon: 'cloud-arrow-up', tone: 'system', roles: ['teknik'] },
    ],
  },
];

/** Menüdeki tüm sayfalar düz liste halinde (rota ve başlık eşleştirmek için) */
export const MENU_ITEMS = MENU.flatMap((g) => g.items);
