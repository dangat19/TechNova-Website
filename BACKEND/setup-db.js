const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'setup.sql'), 'utf8');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    await connection.query(sql);
    console.log('Database setup completed successfully.');
    await connection.end();
  } catch (err) {
    console.error('Database setup failed:', err.message);
    process.exit(1);
  }
})();
