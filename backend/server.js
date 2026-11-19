const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();

// ===== 1. د CORS تنظیمات (خورا ساده او تضمین شوی) =====
app.use(cors({
  origin: '*', // اجازه د هر ځای څخه (د Netlify لپاره)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ===== 2. د MongoDB سره نښلول (د کریش مخنیوی لپاره) =====
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://newalmadinainstitute_db_user:Himatafghan12345@cluster0.pcbzkb7.mongodb.net/clinic?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// ===== 3. د ډیټابیس ماډلونه =====
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'doctor' },
  status: { type: String, default: 'pending' }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

const medicineSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  mg: { type: String, required: true },
  type: { type: String, required: true }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

const patientSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  patientId: { type: String, required: true },
  date: { type: Date, default: Date.now },
  patientData: { type: Object, required: true },
  medicines: { type: Array, default: [] }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

const settingSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  headerUrl: { type: String, default: '' },
  footerUrl: { type: String, default: '' }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

userSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { ret.id = ret._id; delete ret._id; delete ret.password; } });
medicineSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { ret.id = ret._id; delete ret._id; } });
patientSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { ret.id = ret._id; delete ret._id; } });
settingSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret._id; } });

const User = mongoose.model('User', userSchema);
const Medicine = mongoose.model('Medicine', medicineSchema);
const Patient = mongoose.model('Patient', patientSchema);
const Setting = mongoose.model('Setting', settingSchema);

// ===== 4. د امنیت تنظیمات =====
const JWT_SECRET = process.env.JWT_SECRET || 'CLINIC_SUPER_SECRET_KEY_2026'; 

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, // د ټسټ لپاره یې لوړ کړی، وروسته یې 10 ته راکم کړئ
  message: { message: 'ډیرې ناوړه هڅې! مهرباني وکړئ وروسته بیا هڅه وکړئ.' }
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));
const upload = multer({ dest: 'uploads/' });

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'اجازه نلرئ، بیا لاګین شئ!' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'ناسم ټوکن!' });
    req.user = user;
    next();
  });
};

// ===== 5. د لاګین او راجستر API =====
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ message: 'ټول معلومات ډک کړئ!' });
    
    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ message: 'دا نمبر دمخه راجستر شوی دی!' });
    if (password.length < 6) return res.status(400).json({ message: 'پاسورډ باید لږ تر لږه ۶ توري ولري!' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, phone, password: hashedPassword, role: 'doctor', status: 'pending' });
    
    res.status(201).json({ message: 'راجستر شو، د اډمین تایید ته انتظار وکړئ.' });
  } catch (err) { res.status(500).json({ message: 'د سرور خطا!' }); }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ $or: [{ phone: username }, { name: username }] });
    
    if (!user) return res.status(400).json({ message: 'ناسم معلومات!' });
    if (user.status !== 'approved') return res.status(403).json({ message: 'ستاسو اکاونټ تایید شوی نه دی!' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ message: 'ناسم معلومات!' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, phone: user.phone } });
  } catch (err) { res.status(500).json({ message: 'د سرور خطا!' }); }
});

// ===== 6. د اډمین API =====
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'اجازه نلرئ!' });
  const users = await User.find().select('-password');
  res.json(users);
});

app.post('/api/admin/create-user', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'اجازه نلرئ!' });
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ message: 'ټول معلومات ډک کړئ!' });
  
  const existingUser = await User.findOne({ phone });
  if (existingUser) return res.status(400).json({ message: 'دا نمبر دمخه شتون لري!' });

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ name, phone, password: hashedPassword, role: 'doctor', status: 'approved' });
  res.status(201).json({ message: 'کارونکی په بریالیتوب سره جوړ شو!' });
});

app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'اجازه نلرئ!' });
  const { name, phone, password } = req.body;
  
  const updateData = { name, phone };
  if (password && password.trim() !== '') updateData.password = await bcrypt.hash(password, 10);

  await User.findByIdAndUpdate(req.params.id, updateData);
  res.json({ message: 'معلومات په بریالیتوب سره تازه (Update) شول!' });
});

app.put('/api/admin/approve/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'اجازه نلرئ!' });
  await User.findByIdAndUpdate(req.params.id, { status: 'approved' });
  res.json({ message: 'کارونکی تایید شو!' });
});

app.post('/api/admin/impersonate/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'اجازه نلرئ!' });
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'کارونکی ونه موندل شو!' });
  
  const token = jwt.sign({ id: targetUser._id, role: targetUser.role }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token, user: { id: targetUser._id, name: targetUser.name, role: targetUser.role } });
});

// ===== 7. د درملو API =====
app.get('/api/medicines', authenticateToken, async (req, res) => {
  const meds = await Medicine.find({ userId: req.user.id });
  res.json(meds);
});

app.post('/api/medicines', authenticateToken, async (req, res) => {
  const { name, mg, type } = req.body;
  if (!name || !mg || !type) return res.status(400).json({ message: 'ټول معلومات باید ډک شي!' });
  
  const exists = await Medicine.findOne({ name, mg, userId: req.user.id });
  if (exists) return res.status(400).json({ message: 'دا درمل دمخه راجستر شوی دی!' });

  const newMed = await Medicine.create({ userId: req.user.id, name, mg, type });
  res.status(201).json(newMed);
});

app.put('/api/medicines/:id', authenticateToken, async (req, res) => {
  const med = await Medicine.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id }, 
    req.body, 
    { new: true }
  );
  if (!med) return res.status(404).json({ message: 'درمل ونه موندل شو!' });
  res.json(med);
});

app.delete('/api/medicines/:id', authenticateToken, async (req, res) => {
  await Medicine.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  res.json({ message: 'درمل پاک شو' });
});

// ===== 8. د ناروغ API =====
app.post('/api/patients', authenticateToken, async (req, res) => {
  const newPatient = await Patient.create({
    userId: req.user.id,
    patientId: `PAT-${Date.now()}`,
    patientData: req.body.patientData, 
    medicines: req.body.medicines 
  });
  res.status(201).json(newPatient);
});

app.get('/api/patients', authenticateToken, async (req, res) => {
  const patients = await Patient.find({ userId: req.user.id }).sort({ date: -1 });
  res.json(patients);
});

// ===== 9. د چاپ تنظیمات API =====
app.post('/api/upload', authenticateToken, upload.fields([{ name: 'header' }, { name: 'footer' }]), async (req, res) => {
  const baseUrl = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
  let setting = await Setting.findOne({ userId: req.user.id });
  
  if (!setting) setting = new Setting({ userId: req.user.id });

  if (req.files && req.files['header']) setting.headerUrl = `${baseUrl}/uploads/${req.files['header'][0].filename}`;
  if (req.files && req.files['footer']) setting.footerUrl = `${baseUrl}/uploads/${req.files['footer'][0].filename}`;
  
  await setting.save();
  res.json(setting);
});

app.get('/api/settings', authenticateToken, async (req, res) => {
  const setting = await Setting.findOne({ userId: req.user.id });
  res.json(setting || { headerUrl: '', footerUrl: '' });
});

// ===== 10. د اډمین جوړول =====
const createDefaultAdmin = async () => {
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({ name: 'Admin', phone: '0000', password: hashedPassword, role: 'admin', status: 'approved' });
    console.log('✅ Default Admin Created: Phone: 0000, Password: admin123');
  }
};

// ===== 11. د سرور پیلول =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Secure Server running on port ${PORT}`);
  createDefaultAdmin();
});
