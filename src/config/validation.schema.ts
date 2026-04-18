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

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  // Telegram — Required in production — TelegramService guards at runtime
  TELEGRAM_BOT_TOKEN: Joi.string().optional(),
  TELEGRAM_CHAT_ID: Joi.string().optional(),

  // Rate limiting — TTL en segundos, limit en cantidad de requests por TTL
  THROTTLE_DEFAULT_TTL: Joi.number().integer().positive().default(60),
  THROTTLE_DEFAULT_LIMIT: Joi.number().integer().positive().default(1000),
  THROTTLE_LOGIN_TTL: Joi.number().integer().positive().default(60),
  THROTTLE_LOGIN_LIMIT: Joi.number().integer().positive().default(50),
  THROTTLE_REGISTER_TTL: Joi.number().integer().positive().default(60),
  THROTTLE_REGISTER_LIMIT: Joi.number().integer().positive().default(30),
  THROTTLE_ADMIN_TTL: Joi.number().integer().positive().default(60),
  THROTTLE_ADMIN_LIMIT: Joi.number().integer().positive().default(500),
});
