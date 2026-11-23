const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta girin'),
  password: z.string().min(1, 'Parola zorunlu'),
});

module.exports = { loginSchema };
