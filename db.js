const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '172.25.224.1',
  user: 'root',
  password: 'Sesame2025',
  database: 'msp_checks',
  connectionLimit: 10
});

module.exports = pool;
