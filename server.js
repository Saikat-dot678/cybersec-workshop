const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// --- INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 3000;
const serverStartTime = new Date();

// --- DATABASE CONNECTION ---
// Make sure your local MongoDB server is running!
mongoose.connect('mongodb://localhost:27017/cyberShieldDB').then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- DATABASE SCHEMA ---
const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true },
  regNo: { type: String, required: true },
  year: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  paymentScreenshot: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Registration = mongoose.model('Registration', registrationSchema);

// --- MIDDLEWARE ---
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- FILE UPLOAD CONFIG (Multer) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // The folder where files will be stored
  },
  filename: function (req, file, cb) {
    // Create a unique filename: timestamp + original filename
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });


// --- API ROUTES ---

// 1. Handle form submission
app.post('/register', upload.single('screenshot'), async (req, res) => {
  try {
    const { name, rollNo, regNo, year, phone, email } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Payment screenshot is required.' });
    }

    const newRegistration = new Registration({
      name,
      rollNo,
      regNo,
      year,
      phone,
      email,
      paymentScreenshot: req.file.path // Save the path to the uploaded file
    });

    await newRegistration.save();
    res.status(201).json({ success: true, message: 'Registration successful!' });

  } catch (error) {
    // Handle potential duplicate email error
    if (error.code === 11000) {
        return res.status(409).json({ success: false, message: 'This email is already registered.' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during registration.' });
  }
});

// 2. Get the current count of registered students
app.get('/registrations/count', async (req, res) => {
  try {
    const count = await Registration.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch registration count.' });
  }
});

// 3. Get server uptime
app.get('/status/uptime', (req, res) => {
    const uptime = Math.floor((new Date() - serverStartTime) / 1000);
    res.json({ uptime });
});

// 4. Entry point of the server
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});