import { ROLES } from './constants';

export const APP_NAME = 'PRACRM';
export const COMPANY_NAME = 'Prasoft Yazılım';

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
      { to: '/kullanicilar', label: 'Kullanıcılar', icon: 'people', tone: 'system', roles: [ROLES.ADMIN] },
      { to: '/aktarim', label: 'Veri Aktarımı', icon: 'cloud-arrow-up', tone: 'system', roles: [ROLES.SUPPORT] },
    ],
  },
];

export const MENU_ITEMS = MENU.flatMap((g) => g.items);
