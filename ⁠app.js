const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// اتصال قاعدة البيانات المركزية PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/saseerab_db'
});

// إنشاء الجداول والبيانات الأولية تلقائياً عند التشغيل
async function initDatabaseAndSeed() {
    try {
        // 1. إنشاء الجداول الأساسية
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS ghitans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sub_divisions (
                id SERIAL PRIMARY KEY,
                ghitan_id INT REFERENCES ghitans(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                UNIQUE(ghitan_id, name)
            );

            CREATE TABLE IF NOT EXISTS crops (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS hawashat (
                id SERIAL PRIMARY KEY,
                hawashah_number INT UNIQUE NOT NULL,
                farmer_name VARCHAR(150) NOT NULL,
                ghitan_id INT REFERENCES ghitans(id),
                sub_division_id INT REFERENCES sub_divisions(id),
                location TEXT,
                phone VARCHAR(50),
                national_id VARCHAR(50),
                notes TEXT,
                is_deleted BOOLEAN DEFAULT FALSE,
                deleted_at TIMESTAMP DEFAULT NULL
            );

            CREATE TABLE IF NOT EXISTS hawashat_crops (
                hawashah_id INT REFERENCES hawashat(id) ON DELETE CASCADE,
                crop_id INT REFERENCES crops(id) ON DELETE CASCADE,
                PRIMARY KEY (hawashah_id, crop_id)
            );
        `);

        // 2. إدخال المحاصيل المعتمدة
        const cropsList = ['قطن', 'فول', 'عدس', 'ذرة', 'قمح', 'خضار'];
        for (let crop of cropsList) {
            await pool.query(`INSERT INTO crops (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [crop]);
        }

        // 3. إنشاء حساب إداري افتراضي (المستخدم: admin ، كلمة المرور: admin123)
        const hash = await bcrypt.hash('admin123', 10);
        await pool.query(`INSERT INTO admins (username, password_hash) VALUES ('admin', $1) ON CONFLICT (username) DO NOTHING`, [hash]);

        // 4. إدخال الغيطان السبعة المعتمدة
        const ghitansList = [
            'غيط البصالوه', 'غيط دبروسة', 'غيط القرية 16', 
            'غيط القرية 20', 'غيط القرية 21', 'غيط القرية 24', 'غيط الجبل'
        ];
        for (let g of ghitansList) {
            await pool.query(`INSERT INTO ghitans (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [g]);
        }

        // 5. ربط التقسيمات الفرعية للغيطان
        const bisaloh = await pool.query(`SELECT id FROM ghitans WHERE name = 'غيط البصالوه'`);
        if (bisaloh.rows.length > 0) {
            const bId = bisaloh.rows[0].id;
            const subsB = ['نمرة 1 شرق', 'نمرة 1 غرب', 'نمرة 2 شرق', 'نمرة 2 غرب', 'نمرة 3 شرق', 'نمرة 3 غرب', 'نمرة 4 شرق', 'نمرة 4 غرب', 'نمرة 5 شرق', 'نمرة 5 غرب', 'نمرة مثلث عبد الجواد'];
            for (let sub of subsB) {
                await pool.query(`INSERT INTO sub_divisions (ghitan_id, name) VALUES ($1, $2) ON CONFLICT (ghitan_id, name) DO NOTHING`, [bId, sub]);
            }
        }

        const dabrousa = await pool.query(`SELECT id FROM ghitans WHERE name = 'غيط دبروسة'`);
        if (dabrousa.rows.length > 0) {
            const dId = dabrousa.rows[0].id;
            const subsD = ['نمرة 1', 'نمرة 2', 'نمرة 3', 'نمرة 4', 'نمرة 5', 'نمرة 6', 'نمرة 7'];
            for (let sub of subsD) {
                await pool.query(`INSERT INTO sub_divisions (ghitan_id, name) VALUES ($1, $2) ON CONFLICT (ghitan_id, name) DO NOTHING`, [dId, sub]);
            }
        }

        const q16 = await pool.query(`SELECT id FROM ghitans WHERE name = 'غيط القرية 16'`);
        if (q16.rows.length > 0) {
            const q16Id = q16.rows[0].id;
            const subs16 = ['نمرة 1 جنوب', 'نمرة 2 جنوب', 'نمرة 2 شمال', 'نمرة 3 جنوب', 'نمرة 3 شمال', 'نمرة 4 جنوب', 'نمرة 4 شمال', 'نمرة 5 جنوب', 'نمرة 5 شمال', 'نمرة 6', 'نمرة 7'];
            for (let sub of subs16) {
                await pool.query(`INSERT INTO sub_divisions (ghitan_id, name) VALUES ($1, $2) ON CONFLICT (ghitan_id, name) DO NOTHING`, [q16Id, sub]);
            }
        }

        const q20 = await pool.query(`SELECT id FROM ghitans WHERE name = 'غيط القرية 20'`);
        if (q20.rows.length > 0) {
            const q20Id = q20.rows[0].id;
            const subs20 = ['نمرة 1 جنوب', 'نمرة 2 جنوب', 'نمرة 2 شمال', 'نمرة 3 جنوب', 'نمرة 3 شمال', 'نمرة 4 جنوب', 'نمرة 4 شمال', 'نمرة 6 شرق', 'نمرة 6 غرب', 'نمرة 7 الأصلية', 'نمرة 7 المثلثات'];
            for (let sub of subs20) {
                await pool.query(`INSERT INTO sub_divisions (ghitan_id, name) VALUES ($1, $2) ON CONFLICT (ghitan_id, name) DO NOTHING`, [q20Id, sub]);
            }
        }

        const q21 = await pool.query(`SELECT id FROM ghitans WHERE name = 'غيط القرية 21'`);
        if (q21.rows.length > 0) {
            const q21Id = q21.rows[0].id;
            const subs21 = ['نمرة 1 شرق', 'نمرة 1 غرب', 'نمرة 2 شرق', 'نمرة 2 غرب', 'نمرة 3 شرق', 'نمرة 3 غرب', 'نمرة 4 شرق', 'نمرة 4 غرب', 'نمرة 5 شرق', 'نمرة 5 غرب', 'نمرة 6', 'نمرة 7', 'كبارة شرق', 'كبارة غرب'];
            for (let sub of subs21) {
                await pool.query(`INSERT INTO sub_divisions (ghitan_id, name) VALUES ($1, $2) ON CONFLICT (ghitan_id, name) DO NOTHING`, [q21Id, sub]);
            }
        }

        const jabal = await pool.query(`SELECT id FROM ghitans WHERE name = 'غيط الجبل'`);
        if (jabal.rows.length > 0) {
            const jId = jabal.rows[0].id;
            const subsJ = ['نمرة 1 شرق', 'نمرة 1 غرب', 'نمرة 2 شرق', 'نمرة 2 غرب', 'المثلث الكبير', 'المثلث الصغير'];
            for (let sub of subsJ) {
                await pool.query(`INSERT INTO sub_divisions (ghitan_id, name) VALUES ($1, $2) ON CONFLICT (ghitan_id, name) DO NOTHING`, [jId, sub]);
            }
        }

        // 6. البيانات الأولية المؤكدة
        const bSub = await pool.query(`SELECT id FROM sub_divisions WHERE ghitan_id = $1 AND name = 'نمرة مثلث عبد الجواد'`, [bisaloh.rows[0]?.id]);
        const initialB = [{num: 1061, name: 'زكريا عبد الجواد'}, {num: 1062, name: 'عبده محمد طه'}, {num: 1063, name: 'محمد أنور محمد'}];
        for (let item of initialB) {
            await pool.query(`INSERT INTO hawashat (hawashah_number, farmer_name, ghitan_id, sub_division_id, location) VALUES ($1, $2, $3, $4, 'نمرة مثلث عبد الجواد، غيط البصالوه') ON CONFLICT (hawashah_number) DO NOTHING`, [item.num, item.name, bisaloh.rows[0]?.id, bSub.rows[0]?.id]);
        }

        const dabSub = await pool.query(`SELECT id FROM sub_divisions WHERE ghitan_id = $1 AND name = 'نمرة 6'`, [dabrousa.rows[0]?.id]);
        await pool.query(`INSERT INTO hawashat (hawashah_number, farmer_name, ghitan_id, sub_division_id, location) VALUES (1393, 'عبد الرازق عبد العزيز', $1, $2, 'نمرة 6، غيط دبروسة') ON CONFLICT (hawashah_number) DO NOTHING`, [dabrousa.rows[0]?.id, dabSub.rows[0]?.id]);

        const list1381 = ['خليل محمد صالح', 'عبد الرحيم محمد سليمان', 'محمد محمد صالح', 'أحمد محمد أحمد', 'صالح دهب صالح', 'محمد يس محمد', 'محي الدين حسن', 'حسن إبراهيم جريس'];
        for (let i = 0; i < list1381.length; i++) {
            await pool.query(`INSERT INTO hawashat (hawashah_number, farmer_name, location) VALUES ($1, $2, 'غير محدد') ON CONFLICT (hawashah_number) DO NOTHING`, [1381 + i, list1381[i]]);
        }

        console.log("قاعدة البيانات وجهزت البيانات الأولية بنجاح.");
    } catch (err) {
        console.error("خطأ التهيئة:", err);
    }
}

// --- مسارات الخادم (API) ---

// واجهة المستخدم الأمامية HTML تُرسل مباشرة عند فتح الموقع
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>قسم ساسريب _ تفتيش المدينة</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-emerald-50 text-gray-900 flex flex-col min-h-screen">

        <!-- الترويسة الرسمية -->
        <header class="bg-emerald-900 text-white py-4 shadow-md text-center">
            <p class="text-sm font-light">بسم الله الرحمن الرحيم</p>
            <h1 class="text-xl font-bold mt-1">هيئة حلفا الجديدة الزراعية</h1>
            <h2 class="text-lg font-semibold mt-1">قسم ساسريب_تفتيش المدينة</h2>
        </header>

        <!-- شريط التنقل -->
        <nav class="bg-emerald-700 text-white py-2 px-4 flex justify-between items-center shadow">
            <div class="space-x-4 space-x-reverse">
                <a href="#" onclick="showSection('search')" class="hover:underline font-medium">الرئيسية والبحث</a>
                <a href="#" onclick="showSection('add')" class="hover:underline font-medium">إضافة حواشة</a>
            </div>
            <div>
                <button onclick="showSection('login')" class="bg-emerald-800 px-3 py-1 rounded text-sm hover:bg-emerald-900">دخول الإدارة</button>
            </div>
        </nav>

        <!-- المحتوى الرئيسي -->
        <main class="flex-grow container mx-auto p-4 max-w-4xl">

            <!-- قسم البحث الرئيسي -->
            <section id="search-section" class="space-y-6">
                <div class="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 class="text-lg font-bold text-emerald-900 mb-4">البحث في سجلات الحواشات والمزارعين</h3>
                    <div class="flex gap-2 justify-center">
                        <input type="text" id="searchInput" placeholder="ابحث باسم المزارع أو رقم الحواشة..." class="border border-gray-300 rounded px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-emerald-600">
                        <button onclick="performSearch()" class="bg-emerald-800 text-white px-6 py-2 rounded hover:bg-emerald-700">بحث</button>
                    </div>
                </div>
                <div id="searchResults" class="space-y-4"></div>
            </section>

            <!-- قسم إضافة حواشة -->
            <section id="add-section" class="hidden bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-lg font-bold text-emerald-900 mb-4">إضافة حواشة جديدة (يتطلب صلاحية إدارية)</h3>
                <div id="loginPrompt" class="mb-4 p-3 bg-amber-100 text-amber-800 rounded">يجب تسجيل الدخول كمسؤول لإضافة أو تعديل السجلات.</div>
                <form id="addForm" onsubmit="submitHawashah(event)" class="space-y-4 hidden">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">اسم المزارع *</label>
                            <input type="text" id="farmerName" required class="w-full border rounded px-3 py-2">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">رقم الحواشة *</label>
                            <input type="number" id="hawashNumber" required class="w-full border rounded px-3 py-2">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">الغيط *</label>
                            <select id="ghitanSelect" onchange="loadSubDivisions()" required class="w-full border rounded px-3 py-2"></select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">التقسيم الفرعي / النمرة *</label>
                            <select id="subSelect" required class="w-full border rounded px-3 py-2"></select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">رقم الهاتف</label>
                            <input type="text" id="phone" class="w-full border rounded px-3 py-2">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">الرقم التعريفي ID</label>
                            <input type="text" id="nationalId" class="w-full border rounded px-3 py-2">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">الملاحظات</label>
                        <textarea id="notes" class="w-full border rounded px-3 py-2"></textarea>
                    </div>
                    <button type="submit" class="bg-emerald-800 text-white px-6 py-2 rounded hover:bg-emerald-700 w-full">حفظ الحواشة</button>
                </form>
            </section>

            <!-- قسم تسجيل الدخول -->
            <section id="login-section" class="hidden bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
                <h3 class="text-lg font-bold text-emerald-900 mb-4 text-center">تسجيل الدخول الإداري</h3>
                <form onsubmit="handleLogin(event)" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">اسم المستخدم</label>
                        <input type="text" id="adminUser" required class="w-full border rounded px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">كلمة المرور</label>
                        <input type="password" id="adminPass" required class="w-full border rounded px-3 py-2">
                    </div>
                    <button type="submit" class="bg-emerald-800 text-white px-4 py-2 rounded w-full hover:bg-emerald-700">دخول</button>
                </form>
            </section>

        </main>

        <!-- التذييل الرسمي الثابت -->
        <footer class="bg-gray-800 text-white text-center py-3 mt-auto text-sm">
            المعز إبراهيم 0918885614
        </footer>

        <script>
            let isAdminLoggedIn = false;

            function showSection(sectionId) {
                document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
                document.getElementById(\`\${sectionId}-section\`).classList.remove('hidden');
                if(sectionId === 'add') loadGhitans();
            }

            async function performSearch() {
                const query = document.getElementById('searchInput').value.trim();
                if(!query) return;
                const type = !isNaN(query) ? 'number' : 'name';
                const res = await fetch(\`/api/search?q=\${encodeURIComponent(query)}&type=\${type}\`);
                const data = await res.json();
                
                const container = document.getElementById('searchResults');
                container.innerHTML = '';
                if(data.length === 0) {
                    container.innerHTML = \`<p class="text-center text-gray-600">لا توجد نتائج مطابقة.</p>\`;
                    return;
                }
                data.forEach(item => {
                    container.innerHTML += \`
                        <div class="bg-white p-4 rounded shadow flex justify-between items-center">
                            <div>
                                <p class="font-bold text-emerald-900">رقم الحواشة: \${item.hawashah_number} - المزارع: \${item.farmer_name}</p>
                                <p class="text-sm text-gray-600">الغيط: \${item.ghitan_name || 'غير محدد'} | التقسيم: \${item.sub_name || 'غير محدد'}</p>
                            </div>
                        </div>
                    \`;
                });
            }

            async function loadGhitans() {
                const res = await fetch('/api/ghitans');
                const data = await res.json();
                window.ghitansData = data.ghitans;
                window.subsData = data.subDivisions;
                
                const select = document.getElementById('ghitanSelect');
                select.innerHTML = '<option value="">اختر الغيط</option>';
                data.ghitans.forEach(g => {
                    select.innerHTML += \`<option value="\${g.id}">\${g.name}</option>\`;
                });
            }

            function loadSubDivisions() {
                const ghitanId = document.getElementById('ghitanSelect').value;
                const subSelect = document.getElementById('subSelect');
                subSelect.innerHTML = '<option value="">اختر التقسيم</option>';
                const filtered = window.subsData.filter(s => s.ghitan_id == ghitanId);
                filtered.forEach(s => {
                    subSelect.innerHTML += \`<option value="\${s.id}">\${s.name}</option>\`;
                });
            }

            async function handleLogin(e) {
                e.preventDefault();
                const username = document.getElementById('adminUser').value;
                const password = document.getElementById('adminPass').value;
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({username, password})
                });
                if(res.ok) {
                    isAdminLoggedIn = true;
                    alert('تم تسجيل الدخول بنجاح');
                    document.getElementById('loginPrompt').classList.add('hidden');
                    document.getElementById('addForm').classList.remove('hidden');
                    showSection('add');
                } else {
                    alert('خطأ في بيانات الدخول');
                }
            }

            async function submitHawashah(e) {
                e.preventDefault();
                const payload = {
                    hawashah_number: parseInt(document.getElementById('hawashNumber').value),
                    farmer_name: document.getElementById('farmerName').value,
                    ghitan_id: document.getElementById('ghitanSelect').value || null,
                    sub_division_id: document.getElementById('subSelect').value || null,
                    phone: document.getElementById('phone').value,
                    national_id: document.getElementById('nationalId').value,
                    notes: document.getElementById('notes').value
                };
                const res = await fetch('/api/hawashat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if(res.ok) {
                    alert('تمت إضافة الحواشة بنجاح');
                    document.getElementById('addForm').reset();
                } else {
                    alert(data.error || 'حدث خطأ');
                }
            }
        </script>
    </body>
    </html>
    `);
});

// API: تسجيل الدخول
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'بيانات غير صحيحة' });
        const match = await bcrypt.compare(password, result.rows[0].password_hash);
        if (!match) return res.status(401).json({ error: 'بيانات غير صحيحة' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// API: جلب الغيطان والتقسيمات
app.get('/api/ghitans', async (req, res) => {
    try {
        const ghitans = await pool.query('SELECT * FROM ghitans ORDER BY id ASC');
        const subs = await pool.query('SELECT * FROM sub_divisions');
        res.json({ ghitans: ghitans.rows, subDivisions: subs.rows });
    } catch (err) {
        res.status(500).json({ error: 'خطأ' });
    }
});

// API: البحث
app.get('/api/search', async (req, res) => {
    const { q, type } = req.query;
    try {
        let queryStr = `
            SELECT h.*, g.name AS ghitan_name, s.name AS sub_name 
            FROM hawashat h 
            LEFT JOIN ghitans g ON h.ghitan_id = g.id 
            LEFT JOIN sub_divisions s ON h.sub_division_id = s.id 
            WHERE h.is_deleted = FALSE AND 
        `;
        let params = [];
        if (type === 'number') {
            queryStr += `h.hawashah_number = $1`;
            params = [parseInt(q)];
        } else {
            queryStr += `h.farmer_name ILIKE $1 ORDER BY h.hawashah_number ASC`;
            params = [`%${q}%`];
        }
        const result = await pool.query(queryStr, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'خطأ في البحث' });
    }
});

// API: إضافة حواشة جديدة مع التأكد من تفرد الرقم
app.post('/api/hawashat', async (req, res) => {
    const { hawashah_number, farmer_name, ghitan_id, sub_division_id, location, phone, national_id, notes } = req.body;
    try {
        const check = await pool.query('SELECT id FROM hawashat WHERE hawashah_number = $1 AND is_deleted = FALSE', [hawashah_number]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'رقم الحواشة مسجل مسبقاً، يرجى التحقق من الرقم' });
        }
        await pool.query(`
            INSERT INTO hawashat (hawashah_number, farmer_name, ghitan_id, sub_division_id, location, phone, national_id, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [hawashah_number, farmer_name, ghitan_id || null, sub_division_id || null, location, phone, national_id, notes]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'حدث خطأ أثناء الحفظ' });
    }
});

// تشغيل الخادم (تم ضبط أقواس الإغلاق هنا بشكل صحيح تماماً)
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    await initDatabaseAndSeed();
    console.log(`Server is running on port ${PORT}`);
});
