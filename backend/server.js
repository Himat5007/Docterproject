const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit'); // 🚨 د امنیت لپاره

const app = express();
app.use(cors());
app.use(express.json());

// 🚨 د امنیت تنظیمات (JWT) - په اصلي پروژه کې یې یو ځانګړی سټرینګ کړئ
const JWT_SECRET = 'CLINIC_SUPER_SECRET_KEY_2026'; 
const ADMIN_PHONE = '0700000000'; 

// 🚨 د بریدونو مخنیوی (Rate Limiter) - هره IP پدې توان نلري چې په ګړندي توګه ډیر لاګین وکړي
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقیقې
  max: 100, // په 15 دقیقو کې یوازې 10 ځله هڅه کولی شي
  message: { message: 'ډیرې ناوړه هڅې! مهرباني وکړئ ۱۵ دقیقې وروسته بیا هڅه وکړئ.' }
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ===== د معلوماتو فایلونه =====
const USERS_FILE = path.join(__dirname, 'users.json');
const DB_FILE = path.join(__dirname, 'patients.json');
const MEDICINES_FILE = path.join(__dirname, 'medicines.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');


const readData = (file, defaultVal = []) => {
  if (!fs.existsSync(file)) return defaultVal;
  try {
    const content = fs.readFileSync(file, 'utf-8').trim();
    if (!content) return defaultVal; // که فایل خالي وي، خالي ارزښت ورکوي
    return JSON.parse(content);
  } catch (err) {
    console.error(`⚠️ Error reading ${file}, using default values.`);
    return defaultVal;
  }
};



const writeData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');

let usersDB = readData(USERS_FILE, []);
let patientsDB = readData(DB_FILE, []);
let medicinesDB = readData(MEDICINES_FILE, []);
let printSettings = readData(SETTINGS_FILE, {});

// ===== د امنیت مډل =====
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'اجازه نلرئ!' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'ناسم ټوکن!' });
    req.user = user;
    next();
  });
};

// ===== 1. د لاګین او راجستر سیسټم (د امنیت سره) =====
app.post('/api/auth/register', async (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ message: 'ټول معلومات ډک کړئ!' });
  
  if (usersDB.find(u => u.phone === phone)) return res.status(400).json({ message: 'دا نمبر دمخه راجستر شوی دی!' });
  if (password.length < 6) return res.status(400).json({ message: 'پاسورډ باید لږ تر لږه ۶ توري ولري!' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now().toString(), name, phone, password: hashedPassword, role: 'doctor', status: 'pending' };
  usersDB.push(newUser);
  writeData(USERS_FILE, usersDB);

  console.log(`\n📱 نوی کارونکي: ${name} (${phone}) - منتظر تایید دی.`);
  res.status(201).json({ message: 'راجستر شو، د اډمین تایید ته انتظار وکړئ.' });
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  
  // دلته د نوم یا نمبر له مخې لټون کوو
  const user = usersDB.find(u => u.phone === username || u.name === username);
  
  // 🚨 د امنیت لپاره عمومي پیغام (نه وایو چې نوم غلط دی که پاسورډ)
  if (!user) return res.status(400).json({ message: 'ناسم معلومات!' });
  if (user.status !== 'approved') return res.status(403).json({ message: 'ستاسو اکاونټ تایید شوی نه دی!' });

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).json({ message: 'ناسم معلومات!' });

  // ټوکن یوازې د ۲۴ ساعتونو لپاره معتبر دی
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

// ===== 2. د اډمین API =====
app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'اجازه نلرئ!' });
  res.json(usersDB.map(u => ({ id: u.id, name: u.name, phone: u.phone, status: u.status, role: u.role })));
});

// 🚨 اډمین دلته نوی کارونکي جوړوي (په اتوماتیک ډول تایید شوی وي)
app.post('/api/admin/create-user', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'اجازه نلرئ!' });
  const { name, phone, password } = req.body;
  
  if (!name || !phone || !password) return res.status(400).json({ message: 'ټول معلومات ډک کړئ!' });
  if (usersDB.find(u => u.phone === phone)) return res.status(400).json({ message: 'دا نمبر دمخه شتون لري!' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now().toString(), name, phone, password: hashedPassword, role: 'doctor', status: 'approved' };
  usersDB.push(newUser);
  writeData(USERS_FILE, usersDB);
  res.status(201).json({ message: 'کارونکی په بریالیتوب سره جوړ شو!' });
});

app.put('/api/admin/approve/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'اجازه نلرئ!' });
  const user = usersDB.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'کارونکی ونه موندل شو!' });
  
  user.status = 'approved';
  writeData(USERS_FILE, usersDB);
  res.json({ message: 'کارونکی تایید شو!' });
});

app.post('/api/admin/impersonate/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'اجازه نلرئ!' });
  const targetUser = usersDB.find(u => u.id === req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'کارونکی ونه موندل شو!' });
  
  const token = jwt.sign({ id: targetUser.id, role: targetUser.role }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token, user: { id: targetUser.id, name: targetUser.name, role: targetUser.role } });
});

// ===== 3. د درملو API (د هر کارونکي لپاره جلا) =====
app.get('/api/medicines', authenticateToken, (req, res) => {
  res.json(medicinesDB.filter(m => m.userId === req.user.id));
});

app.post('/api/medicines', authenticateToken, (req, res) => {
  const newMed = { id: Date.now(), userId: req.user.id, ...req.body };
  medicinesDB.push(newMed);
  writeData(MEDICINES_FILE, medicinesDB);
  res.status(201).json(newMed);
});

app.put('/api/medicines/:id', authenticateToken, (req, res) => {
  const index = medicinesDB.findIndex(m => String(m.id) === String(req.params.id) && m.userId === req.user.id);
  if (index === -1) return res.status(404).json({ message: 'درمل ونه موندل شو!' });
  
  medicinesDB[index] = { ...medicinesDB[index], ...req.body };
  writeData(MEDICINES_FILE, medicinesDB);
  res.json(medicinesDB[index]);
});

app.delete('/api/medicines/:id', authenticateToken, (req, res) => {
  medicinesDB = medicinesDB.filter(m => !(String(m.id) === String(req.params.id) && m.userId === req.user.id));
  writeData(MEDICINES_FILE, medicinesDB);
  res.json({ message: 'درمل پاک شو' });
});

// ===== 4. د ناروغ API =====
app.post('/api/patients', authenticateToken, (req, res) => {
  const newPatient = { id: `PAT-${Date.now()}`, userId: req.user.id, date: new Date().toISOString(), patientData: req.body.patientData, medicines: req.body.medicines };
  patientsDB.push(newPatient);
  writeData(DB_FILE, patientsDB);
  res.status(201).json(newPatient);
});

app.get('/api/patients', authenticateToken, (req, res) => {
  res.json(patientsDB.filter(p => p.userId === req.user.id).sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// ===== 5. د چاپ تنظیمات API =====
app.post('/api/upload', authenticateToken, upload.fields([{ name: 'header' }, { name: 'footer' }]), (req, res) => {
  if (!printSettings[req.user.id]) printSettings[req.user.id] = { headerUrl: '', footerUrl: '' };
  if (req.files && req.files['header']) printSettings[req.user.id].headerUrl = `http://localhost:5000/uploads/${req.files['header'][0].filename}`;
  if (req.files && req.files['footer']) printSettings[req.user.id].footerUrl = `http://localhost:5000/uploads/${req.files['footer'][0].filename}`;
  writeData(SETTINGS_FILE, printSettings);
  res.json(printSettings[req.user.id]);
});

app.get('/api/settings', authenticateToken, (req, res) => {
  res.json(printSettings[req.user.id] || { headerUrl: '', footerUrl: '' });
});

// 🚨 نوی Endpoint: د یوزر معلومات (نوم، نمبر، پاسورډ) بدلول
app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'اجازه نلرئ!' });
  
  const { name, phone, password } = req.body;
  const userIndex = usersDB.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) return res.status(404).json({ message: 'کارونکی ونه موندل شو!' });

  // چک کوو چې نوی نمبر د بل چا لخوا نه وي اخیستل شوی
  if (phone && usersDB.some(u => u.phone === phone && u.id !== req.params.id)) {
    return res.status(400).json({ message: 'دا نمبر دمخه د بل کارونکي لخوا کارول شوی دی!' });
  }

  if (name) usersDB[userIndex].name = name;
  if (phone) usersDB[userIndex].phone = phone;
  
  // که نوی پاسورډ ولیکل شو، هش یې کوو
  if (password && password.trim() !== '') {
    usersDB[userIndex].password = await bcrypt.hash(password, 10);
  }

  writeData(USERS_FILE, usersDB);
  res.json({ message: 'معلومات په بریالیتوب سره تازه (Update) شول!' });
});



// ===== اډمین جوړول =====
const createDefaultAdmin = async () => {
  if (!usersDB.find(u => u.role === 'admin')) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    usersDB.push({ id: 'admin-1', name: 'Admin', phone: '0000', password: hashedPassword, role: 'admin', status: 'approved' });
    writeData(USERS_FILE, usersDB);
  }
};
createDefaultAdmin();

app.listen(5000, () => console.log('✅ Secure Server running on http://localhost:5000'));