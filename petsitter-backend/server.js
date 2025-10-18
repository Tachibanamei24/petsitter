// server.js (Node.js Express Server for PetSitter API)
// *******************************************************************
// Tandaan: Ginawa na ang kailangang pagbabago para sa CORS fix.
// *******************************************************************

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const app = express();
const PORT = process.env.PORT || 8080; 

dotenv.config();

// --- DATABASE SIMULATION ---
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
// CRITICAL FIX: DINAGDAG na ang GitHub Pages URL!
const allowedOrigins = [
    // LIVE Render Backend API URL (WALANG /api)
    'https://petsitter-x3nr.onrender.com', 
    // ✅ GITHUB PAGES FRONTEND URL - ITO ANG KAILANGAN!
    'https://tachibanamei24.github.io', 
    // Maaaring kailangan mo rin ang specific repository path:
    'https://tachibanamei24.github.io/petsitter',
    // Local development server ports (para sa testing)
    'http://127.0.0.1:5500', 
    'http://localhost:5500', 
    'http://localhost:3000',
    'http://127.0.0.1', 
    'http://localhost'
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions)); 
app.use(express.json());

// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Pansinin: Ang email sending ay naka-off sa backend. Supabase Auth ang bahala.`);
});


// --- API ROUTES (Walang pagbabago sa logic) ---

// 1. POST /api/auth/signup - User Registration
app.post('/api/auth/signup', async (req, res) => { 
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
    
    res.status(201).json({ message: "Account created successfully. Please check your email for verification.", user: { id: newUser.id, name: newUser.name } });
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


// 3. POST /api/bookings - Booking
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

    res.status(201).json({ message: "Booking successful! Walang email receipt na ipinadala (handled by Supabase or external system).", booking: newBooking });
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