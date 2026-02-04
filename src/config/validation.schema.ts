import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Aplicación (env vars llegan como string)
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.string().default('4000'),

  // Base de datos
  DATABASE_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required().min(32),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // Cookies
  COOKIE_SECRET: Joi.string().required().min(32),

  // Envío
  FREE_SHIPPING_THRESHOLD: Joi.string().default('10000'),
  SHIPPING_COST: Joi.string().default('1500'),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
});
