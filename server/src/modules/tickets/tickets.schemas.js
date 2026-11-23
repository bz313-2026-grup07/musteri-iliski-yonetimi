const { z } = require('zod');
const { TICKET_STATUS, TICKET_CATEGORY } = require('../../constants');

const STATUSES = Object.values(TICKET_STATUS);
const CATEGORIES = Object.values(TICKET_CATEGORY);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-AA-GG biçiminde olmalı');
const userId = z.number().int().positive();
const subject = z.string().trim().min(3, 'Konu en az 3 karakter olmalı').max(200);

const statusList = z.string()
  .transform((value) => value.split(',').map((s) => s.trim()).filter(Boolean))
  .refine((list) => list.every((s) => STATUSES.includes(s)), 'Geçersiz durum');

const listTicketsSchema = z.object({
  q: z.string().trim().max(100).optional(),
  customer: z.string().trim().max(100).optional(),
  user: z.string().trim().max(100).optional(),
  customerId: z.coerce.number().int().positive().optional(),
  assignedTo: z.union([z.enum(['me', 'none']), z.coerce.number().int().positive()]).optional(),
  status: statusList.optional(),
  category: z.enum(CATEGORIES).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

const createTicketSchema = z.object({
  customerId: z.number({ error: 'Müşteri seçin' }).int().positive(),
  subject,
  category: z.enum(CATEGORIES).default(TICKET_CATEGORY.SUPPORT),
  description: z.string().trim().max(10000).optional(),
  assignedTo: userId.nullish(),
});

const updateTicketSchema = z.object({
  subject: subject.optional(),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  assignedTo: userId.nullable().optional(),
}).refine((input) => Object.keys(input).length > 0, 'Değiştirilecek en az bir alan gönderin');

module.exports = { listTicketsSchema, createTicketSchema, updateTicketSchema };
