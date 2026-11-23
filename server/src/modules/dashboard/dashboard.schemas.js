const { z } = require('zod');

const dailyQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-AA-GG biçiminde olmalı').optional(),
});

module.exports = { dailyQuerySchema };
