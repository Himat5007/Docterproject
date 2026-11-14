const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const app = express();

// ===== 1. د CORS تنظیمات =====
const allowedOrigins = [
  'https://docterproject.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());
app.use(express.json());

// ===== 2. د امنیت تنظیمات =====
const JWT_SECRET = process.env.JWT_SECRET || 'CLINIC_SUPER_SECRET_KEY_2026'; 
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50, 
  message: { message: 'ډیرې ناوړه هڅې! مهرباني وکړئ وروسته بیا هڅه وکړئ.' }
});

// ===== 3. د فولډرونو او فایلونو تنظیمات =====
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ===== 4. د JSON فایلونو ډیټابیس =====
const USERS_FILE = path.join(__dirname, 'users.json');
const DB_FILE = path.join(__dirname, 'patients.json');
const MEDICINES_FILE = path.join(__dirname, 'medicines.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

const readData = (file, defaultVal = []) => {
  if (!fs.existsSync(file)) return defaultVal;
  try {
    const content = fs.readFileSync(file, 'utf-8').trim();
    if (!content) return defaultVal;
    return JSON.parse(content);
  } catch (err) {
    console.error(`⚠️ Error reading ${file}, using default values.`);
    return defaultVal;
  }
};

const writeData = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
};

let usersDB = readData(USERS_FILE, []);
let patientsDB = readData(DB_FILE, []);
let medicinesDB = readData(MEDICINES_FILE, []);
let printSettings = readData(SETTINGS_FILE, {});

// ===== 5. د امنیت مډل =====
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'اجازه نلرئ، بیا لاګین شئ!' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'ناسم ټوکن!' });
    req.user = user;
    next();
  });
};

// ===== 6. د لاګین او راجستر API =====
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
  
  const user = usersDB.find(u => u.phone === username || u.name === username);
  
  if (!user) return res.status(400).json({ message: 'ناسم معلومات!' });
  if (user.status !== 'approved') return res.status(403).json({ message: 'ستاسو اکاونټ تایید شوی نه دی!' });

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).json({ message: 'ناسم معلومات!' });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, phone: user.phone } });
});

// ===== 7. د اډمین API =====
app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'اجازه نلرئ!' });
  res.json(usersDB.map(u => ({ id: u.id, name: u.name, phone: u.phone, status: u.status, role: u.role })));
});

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

app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'اجازه نلرئ!' });
  const { name, phone, password } = req.body;
  const userIndex = usersDB.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) return res.status(404).json({ message: 'کارونکی ونه موندل شو!' });

  if (phone && usersDB.some(u => u.phone === phone && u.id !== req.params.id)) {
    return res.status(400).json({ message: 'دا نمبر دمخه د بل کارونکي لخوا کارول شوی دی!' });
  }

  if (name) usersDB[userIndex].name = name;
  if (phone) usersDB[userIndex].phone = phone;
  
  if (password && password.trim() !== '') {
    usersDB[userIndex].password = await bcrypt.hash(password, 10);
  }

  writeData(USERS_FILE, usersDB);
  res.json({ message: 'معلومات په بریالیتوب سره تازه (Update) شول!' });
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

// ===== 8. د درملو API =====
app.get('/api/medicines', authenticateToken, (req, res) => {
  res.json(medicinesDB.filter(m => m.userId === req.user.id));
});

app.post('/api/medicines', authenticateToken, (req, res) => {
  const { name, mg, type } = req.body;
  if (!name || !mg || !type) return res.status(400).json({ message: 'ټول معلومات باید ډک شي!' });
  
  const exists = medicinesDB.find(m => m.name.toLowerCase() === name.toLowerCase() && m.mg === mg && m.userId === req.user.id);
  if (exists) return res.status(400).json({ message: 'دا درمل دمخه راجستر شوی دی!' });

  const newMed = { id: Date.now(), userId: req.user.id, name, mg, type };
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

// ===== 9. د ناروغ API =====
app.post('/api/patients', authenticateToken, (req, res) => {
  const newPatient = { 
    id: `PAT-${Date.now()}`, 
    userId: req.user.id, 
    date: new Date().toISOString(), 
    patientData: req.body.patientData, 
    medicines: req.body.medicines 
  };
  patientsDB.push(newPatient);
  writeData(DB_FILE, patientsDB);
  res.status(201).json(newPatient);
});

app.get('/api/patients', authenticateToken, (req, res) => {
  res.json(patientsDB.filter(p => p.userId === req.user.id).sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// ===== 10. د چاپ تنظیمات API =====
app.post('/api/upload', authenticateToken, upload.fields([{ name: 'header' }, { name: 'footer' }]), (req, res) => {
  if (!printSettings[req.user.id]) printSettings[req.user.id] = { headerUrl: '', footerUrl: '' };
  
  const baseUrl = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
  
  if (req.files && req.files['header']) printSettings[req.user.id].headerUrl = `${baseUrl}/uploads/${req.files['header'][0].filename}`;
  if (req.files && req.files['footer']) printSettings[req.user.id].footerUrl = `${baseUrl}/uploads/${req.files['footer'][0].filename}`;
  
  writeData(SETTINGS_FILE, printSettings);
  res.json(printSettings[req.user.id]);
});

app.get('/api/settings', authenticateToken, (req, res) => {
  res.json(printSettings[req.user.id] || { headerUrl: '', footerUrl: '' });
});

// ===== 11. د اډمین جوړول =====
const createDefaultAdmin = async () => {
  if (!usersDB.find(u => u.role === 'admin')) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    usersDB.push({ id: 'admin-1', name: 'Admin', phone: '0000', password: hashedPassword, role: 'admin', status: 'approved' });
    writeData(USERS_FILE, usersDB);
    console.log('✅ Default Admin Created: Phone: 0000, Password: admin123');
  }
};
createDefaultAdmin();

// ===== 12. د سرور پیلول =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Secure Server running on port ${PORT}`));
