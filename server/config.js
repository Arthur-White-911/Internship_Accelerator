module.exports = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'internship_accelerator_secret_2024_change_in_production',
  JWT_EXPIRES_IN: '7d',
};
