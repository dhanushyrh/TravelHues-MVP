import * as Joi from 'joi';

export const validationSchema = Joi.object({
  APP_PORT: Joi.number().default(3000),
  APP_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  APP_URL: Joi.string().default('http://localhost:3000'),
  FRONTEND_URL: Joi.string().default('http://localhost:3001'),
  MOBILE_DEEP_LINK_PREFIX: Joi.string().default('travelhues://'),

  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().optional(),

  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().optional(),

  MINIO_ENDPOINT: Joi.string().default('localhost'),
  MINIO_PORT: Joi.number().default(9000),
  MINIO_ACCESS_KEY: Joi.string().default('minioadmin'),
  MINIO_SECRET_KEY: Joi.string().default('minioadmin'),
  MINIO_BUCKET: Joi.string().default('travelhues'),
  MINIO_USE_SSL: Joi.boolean().default(false),

  MAIL_HOST: Joi.string().default('localhost'),
  MAIL_PORT: Joi.number().default(1025),
  MAIL_USER: Joi.string().allow('').optional(),
  MAIL_PASS: Joi.string().allow('').optional(),
  MAIL_FROM: Joi.string().default('noreply@travelhues.com'),

  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
});
