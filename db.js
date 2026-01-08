require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool ({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    port: parseInt(process.env.PGPORT, 10)
});

module.exports = pool;