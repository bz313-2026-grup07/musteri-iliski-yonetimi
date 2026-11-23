const { z } = require('zod');

const emptyToNull = (value) => (value === '' ? null : value);
const optionalText = (max) => z.string().trim().max(max).nullish().transform(emptyToNull);

const customerSchema = z.object({
  name: z.string().trim().min(2, 'Ad/unvan en az 2 karakter olmalı').max(160),
  company: optionalText(200),
  email: z.union([z.string().trim().toLowerCase().email('Geçerli bir e-posta girin'), z.literal('')])
    .nullish()
    .transform(emptyToNull),
  phone: optionalText(40),
  city: optionalText(80),
  address: optionalText(2000),
  description: optionalText(5000),
  ownerId: z.number().int().positive().nullish(),
});

const createCustomerSchema = customerSchema;
const updateCustomerSchema = customerSchema.partial();

module.exports = { createCustomerSchema, updateCustomerSchema };
