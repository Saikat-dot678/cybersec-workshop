const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const nunjucks = require('nunjucks');
require('dotenv').config();

// --- INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 3000;
const MONGOURL = process.env.MONGOURL;
const serverStartTime = new Date();

// --- NUNJUCKS CONFIGURATION ---
nunjucks.configure('public', {
    autoescape: true,
    express: app
});
app.set('view engine', 'html');

// --- DATABASE CONNECTION ---
mongoose.connect(MONGOURL)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- DATABASE SCHEMA (with unique constraints) ---
const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  regNo: { type: String, required: true, unique: true },
  year: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  paymentScreenshot: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});
const Registration = mongoose.model('Registration', registrationSchema);

// --- MIDDLEWARE ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- FILE UPLOAD CONFIG (Multer) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage: storage });


// --- ROUTES ---

// 1. Render the homepage using Nunjucks
app.get('/', (req, res) => {
    res.render('index.html', { title: 'Cyber Shield 2025' });
});

// 2. Handle form submission with duplicate checks
app.post('/register', upload.single('screenshot'), async (req, res) => {
    try {
        const { name, rollNo, regNo, year, phone, email } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Payment screenshot is required.' });
        }

        const existingRegistration = await Registration.findOne({
            $or: [{ email }, { phone }, { regNo }, { rollNo }]
        });

        if (existingRegistration) {
            let field = 'details';
            if (existingRegistration.email === email) field = 'email';
            else if (existingRegistration.phone === phone) field = 'phone number';
            else if (existingRegistration.regNo === regNo) field = 'registration number';
            else if (existingRegistration.rollNo === rollNo) field = 'roll number';
            
            return res.status(409).json({ success: false, message: `This ${field} is already registered.` });
        }

        const newRegistration = new Registration({
            name, rollNo, regNo, year, phone, email,
            paymentScreenshot: req.file.path
        });

        await newRegistration.save();
        res.status(201).json({ success: true, message: 'Registration successful!' });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'A user with these details is already registered.' });
        }
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
});

// 3. Get registration count
app.get('/registrations/count', async (req, res) => {
    try {
        const count = await Registration.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch registration count.' });
    }
});

// 4. Get server uptime
app.get('/status/uptime', (req, res) => {
    const uptime = Math.floor((new Date() - serverStartTime) / 1000);
    res.json({ uptime });
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});