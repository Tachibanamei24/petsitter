// server.js (Node.js Express Server for PetSitter API)
// *******************************************************************
// CRITICAL: May kasama itong debugging block para makita natin ang eksaktong error
// sa App Password setup.
// *******************************************************************

const express = require('express');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer'); 
const cors = require('cors'); 
const app = express();
// Binago ang port para sa testing
const PORT = process.env.PORT || 8080; 

// Load environment variables from a .env file
dotenv.config();

// --- DATABASE SIMULATION (TANDAAN: Mawawala ang data kapag ni-restart ang server) ---
let usersData = [
    { id: 101, name: "Standard User", email: "user@pet.com", password: "password", role: "user", phone: '+1 (555) 123-4567', address: '123 Main St, City, State 12345' },
    { id: 102, name: "Admin Manager", email: "admin@pet.com", password: "adminpass", role: "admin", phone: '', address: '' },
];
let bookingsData = []; 
let sittersData = [
    { id: 1, name: "Sarah Johnson", rating: 4.9, reviews: 127, location: "Downtown", services: ["walking", "sitting", "boarding"], rates: { walking: 25, sitting: 35, boarding: 45, grooming: 60 }, bio: "Experienced pet sitter.", avatar: "SJ", active: true },
    { id: 2, name: "Mike Chen", rating: 4.8, reviews: 89, location: "Westside", services: ["walking", "sitting"], rates: { walking: 20, sitting: 30, boarding: 40, grooming: 55 }, bio: "Professional dog walker.", avatar: "MC", active: true },
    { id: 3, name: "Emily Rodriguez", rating: 5.0, reviews: 203, location: "Eastside", services: ["walking", "sitting", "boarding", "grooming"], rates: { walking: 30, sitting: 40, boarding: 50, grooming: 70 }, bio: "Certified pet care professional.", avatar: "ER", active: true },
    { id: 4, name: "David Wilson", rating: 4.7, reviews: 156, location: "Northside", services: ["walking", "boarding"], rates: { walking: 22, sitting: 32, boarding: 42, grooming: 58 }, bio: "Active pet lover.", avatar: "DW", active: false },
    { id: 5, name: "Lisa Thompson", rating: 4.9, reviews: 94, location: "Southside", services: ["sitting", "boarding", "grooming"], rates: { walking: 28, sitting: 38, boarding: 48, grooming: 65 }, bio: "Home-based pet sitter.", avatar: "LT", active: true }
];

// --- MIDDLEWARE ---
// Explicit CORS Configuration: KASAMA na ang lokal na testing environment (127.0.0.1)
const allowedOrigins = [
    // Ang URL ng iyong deployed Render Frontend (kung meron)
    'https://petsitter-3.onrender.com', 
    // Iyong local development server ports (para sa testing)
    'http://127.0.0.1:5500', 
    'http://localhost:5500', 
    'http://localhost:3000',
    'http://127.0.0.1', // Iba pang default local host
    'http://localhost'
];

const corsOptions = {
    origin: (origin, callback) => {
        // Pahintulutan ang walang origin (e.g., Postman/Nightingale) at ang mga nasa listahan
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions)); // Ginamit ang bagong corsOptions
app.use(express.json());

// server.js - EMAIL TRANSPORTER SETUP

const transporter = nodemailer.createTransport({
    // Ito ang host server address
    host: 'smtp.gmail.com', 
    port: 587,              
    secure: false,          
    auth: {
        // Ito ang iyong Gmail email address (mula sa .env file)
        user: process.env.EMAIL_USER, 
        // Ito ang iyong 16-character App Password (mula sa .env file)
        pass: process.env.EMAIL_PASS  
    },
    tls: {
        // Makakatulong ito sa pagresolba ng network handshake issues
        rejectUnauthorized: false 
    }
});


// --- EMAIL DEBUGGING AND SERVER START CHECK ---
// Tiyakin na gumagana ang App Password bago simulan ang Express server.
transporter.verify(function(error, success) {
    if (error) {
        console.log("----------------------------------------------------------------------");
        console.error("KRITIKAL NA ERROR: HINDI MAKAKONEKTA SA GMAIL!");
        console.error("Ito ang EXAKTANG problema (Authentication/Network Issue):", error.message);
        console.log("TIYAKIN:");
        console.log("1. Tama ang iyong EMAIL_USER at EMAIL_PASS (Dapat App Password).");
        console.log("2. Naka-install ang dependencies (express, dotenv, nodemailer, cors).");
        console.log("----------------------------------------------------------------------");
        // Huwag simulan ang server
        process.exit(1);
    } else {
        console.log("Nodemailer: Konektado at handa na para magpadala ng email!");
        // --- START THE EXPRESS SERVER HERE ---
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }
});


// --- API ROUTES ---

// 1. POST /api/auth/signup - User Registration
app.post('/api/auth/signup', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Please fill in all required fields." });
    }
    if (usersData.some(u => u.email === email)) {
        return res.status(409).json({ message: "An account with this email already exists." });
    }

    const newUser = {
        id: usersData.length > 0 ? Math.max(...usersData.map(u => u.id)) + 1 : 100,
        name: name,
        email: email,
        password: password,
        role: 'user', 
        phone: '',
        address: ''
    };

    usersData.push(newUser);
    console.log("[SERVER] New User Registered:", newUser.email);
    res.status(201).json({ message: "Account created successfully! Please log in." });
});

// 2. POST /api/auth/login - User Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    const user = usersData.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
    }

    const authToken = 'mock-jwt-token-' + user.id + new Date().getTime(); 

    res.status(200).json({
        message: "Login successful!",
        token: authToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        }
    });
});


// 3. POST /api/bookings - Booking and Email Receipt
app.post('/api/bookings', async (req, res) => {
    const bookingDetails = req.body;
    
    if (!bookingDetails.totalPrice || !bookingDetails.userEmail) {
        return res.status(400).json({ message: "Missing required booking details." });
    }

    // 3.1. Save to Database (Simulated)
    const newBooking = {
        id: bookingsData.length > 0 ? Math.max(...bookingsData.map(b => b.id)) + 1 : 1,
        ...bookingDetails,
        status: 'upcoming',
        dateCreated: new Date().toISOString()
    };
    bookingsData.push(newBooking); 
    console.log(`[SERVER] Booking #${newBooking.id} saved.`);

    // 3.2. Email Sending (USING NODEMAILER)
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: bookingDetails.userEmail, 
            subject: `PetSitter Booking #${newBooking.id} Confirmed - Your E-Receipt`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #667eea; padding: 20px;">
                    <h2 style="color: #667eea;">Booking Confirmed! (Official E-Receipt)</h2>
                    <p>Hello ${bookingDetails.userName},</p>
                    <p>Ito ang detalye ng inyong serbisyo. Ang inyong booking ay matagumpay na naitala!</p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Booking ID:</td><td style="border: 1px solid #ddd; padding: 8px;">${newBooking.id}</td></tr>
                        <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Sitter:</td><td style="border: 1px solid #ddd; padding: 8px;">${newBooking.sitterName}</td></tr>
                        <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Date & Time:</td><td style="border: 1px solid #ddd; padding: 8px;">${bookingDetails.date} at ${bookingDetails.time}</td></tr>
                        <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Payment Method:</td><td style="border: 1px solid #ddd; padding: 8px; color: #667eea;">${newBooking.paymentMethod.toUpperCase()}</td></tr>
                    </table>
                    <h3 style="color: #28a745;">TOTAL AMOUNT: ₱${newBooking.totalPrice}</h3>
                    <p style="font-size: 0.9em; color: #888;">*Reminder: Please check your payment status on the app. Cash payments are due upon service.*</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SUCCESS] Email successfully sent to ${bookingDetails.userEmail}. Message ID: ${info.messageId}`);
        
        res.status(201).json({ message: "Booking successful and receipt emailed!", booking: newBooking });

    } catch (error) {
        console.error("[EMAIL ERROR] Failed to send email:", error.stack);
        res.status(201).json({ message: "Booking successful, but receipt email failed to send.", booking: newBooking });
    }
});


// 4. GET /api/bookings/my-history/:userId - Fetch User Bookings (Simulated)
app.get('/api/bookings/my-history/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userBookings = bookingsData.filter(b => b.userId === userId);

    res.status(200).json(userBookings);
});

// 5. GET /api/sitters - Fetch Active Sitters
app.get('/api/sitters', (req, res) => {
    const activeSitters = sittersData.filter(s => s.active);
    res.status(200).json(activeSitters);
});