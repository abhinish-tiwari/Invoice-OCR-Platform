// Simple script to test PostgreSQL connection
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    console.log(`📍 Host: ${process.env.DB_HOST}`);
    console.log(`📍 Port: ${process.env.DB_PORT}`);
    console.log(`📍 Database: ${process.env.DB_NAME}`);
    console.log(`📍 User: ${process.env.DB_USER}`);
    
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log(`⏰ Server time: ${result.rows[0].now}`);
    
    // List tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables in database:');
    tables.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
    // Count users
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`\n👥 Total users: ${userCount.rows[0].count}`);
    
    await pool.end();
    console.log('\n✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();

