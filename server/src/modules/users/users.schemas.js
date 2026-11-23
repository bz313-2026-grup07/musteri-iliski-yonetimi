const { z } = require('zod');
const { ROLES } = require('../../constants');

const role = z.enum(Object.values(ROLES));
const fullName = z.string().trim().min(2).max(120);
const password = z.string().min(8, 'Parola en az 8 karakter olmalı');

const createUserSchema = z.object({
  fullName,
  email: z.string().trim().toLowerCase().email(),
  password,
  role,
});

const updateUserSchema = z.object({
  fullName: fullName.optional(),
  role: role.optional(),
  isActive: z.boolean().optional(),
  password: password.optional(),
});

module.exports = { createUserSchema, updateUserSchema };
