const TIMEZONE = 'Europe/Istanbul';

const ROLES = Object.freeze({
  ADMIN: 'yonetim',
  SALES: 'satis',
  SUPPORT: 'teknik',
});

const TICKET_STATUS = Object.freeze({
  OPEN: 'acik',
  WAITING: 'cevap_bekleniyor',
  DONE: 'tamamlandi',
});

const TICKET_CATEGORY = Object.freeze({
  SUPPORT: 'teknik_destek',
  REQUEST: 'talep',
  PROJECT: 'proje',
});

const OFFER_STATUS = Object.freeze({
  DRAFT: 'hazirlandi',
  SENT: 'sunuldu',
  ACCEPTED: 'onaylandi',
  REJECTED: 'reddedildi',
});

const CALL_DIRECTION = Object.freeze({
  INBOUND: 'gelen',
  OUTBOUND: 'giden',
});

module.exports = {
  TIMEZONE,
  ROLES,
  TICKET_STATUS,
  TICKET_CATEGORY,
  OFFER_STATUS,
  CALL_DIRECTION,
};
