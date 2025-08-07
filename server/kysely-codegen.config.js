require('dotenv').config();

module.exports = {
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  out: './src/db/generated',
  exclude: ['neon_auth.*', 'pg_*', 'information_schema.*'],
  camelCase: true,
  enumStyle: 'asConst',
  tableNameCase: 'snake',
  columnNameCase: 'snake',
}; 