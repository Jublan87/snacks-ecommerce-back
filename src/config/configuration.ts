export default () => ({
  app: {
    port: parseInt(process.env.PORT, 10) || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cookie: {
    secret: process.env.COOKIE_SECRET,
  },
  shipping: {
    freeShippingThreshold: parseInt(process.env.FREE_SHIPPING_THRESHOLD, 10) || 10000,
    shippingCost: parseInt(process.env.SHIPPING_COST, 10) || 1500,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
});
