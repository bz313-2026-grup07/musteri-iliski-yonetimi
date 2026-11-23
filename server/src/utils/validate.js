const { badRequest } = require('./httpError');

function validate(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw badRequest('Doğrulama hatası', details);
  }
  return result.data;
}

module.exports = { validate };
