// Valida la configuración sensible al arrancar. Falla rápido si falta algo.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET no configurado o demasiado corto (mínimo 32 caracteres).');
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

module.exports = { JWT_SECRET, ALLOWED_ORIGINS };
