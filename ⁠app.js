const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// اتصال قاعدة البيانات المركزية PostgreSQL //
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// الجداول والبيانات الأولية تلقائياً عند التشغيل //
async function initDatabaseAndSeed() {
  try {
    // إنشاء الجداول الأساسية
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initDatabaseAndSeed();

// مسار تجريبي للتأكد من عمل التطبيق
app.get('/', (req, res) => {
  res.send('مرحباً بك في تطبيق قسم ساسريب - تفتيش المدينة يعمل بنجاح!');
});

// تصدير التطبيق ليعمل بسلاسة على Vercel
module.exports = app;

// التشغيل محلياً إذا لم يكن على بيئة السيرفرليس
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
