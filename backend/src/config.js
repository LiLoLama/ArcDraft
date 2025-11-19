module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'demo-secret-key',
  port: process.env.PORT || 4000,
};
