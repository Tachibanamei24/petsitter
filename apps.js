// PetSitter Application JavaScript (UPDATED FOR BACKEND API CONNECTION)

// --- API CONFIGURATION AND GLOBAL STATE ---
// WARNING: This URL must match the PORT you set in server.js
const API_BASE_URL = 'https://petsitter-3.api.onrender.com/api'; 

// SIMULATED DATA (Used only for front-end rendering while backend is loading/not complete)
// This initial data is here so the UI loads even if the server is offline.
let sittersData = [
    { id: 1, name: "Sarah Johnson", rating: 4.9, reviews: 127, location: "Downtown", services: ["walking", "sitting", "boarding"], rates: { walking: 25, sitting: 35, boarding: 45, grooming: 60 }, bio: "Experienced pet sitter with 5+ years of experience.", avatar: "SJ", active: true },
    { id: 2, name: "Mike Chen", rating: 4.8, reviews: 89, location: "Westside", services: ["walking", "sitting"], rates: { walking: 20, sitting: 30, boarding: 40, grooming: 55 }, bio: "Professional dog walker specializing in large breeds.", avatar: "MC", active: true },
    { id: 3, name: "Emily Rodriguez", rating: 5.0, reviews: 203, location: "Eastside", services: ["walking", "sitting", "boarding", "grooming"], rates: { walking: 30, sitting: 40, boarding: 50, grooming: 70 }, bio: "Certified pet care professional with veterinary background.", avatar: "ER", active: true },
    { id: 4, name: "David Wilson", rating: 4.7, reviews: 156, location: "Northside", services: ["walking", "boarding"], rates: { walking: 22, sitting: 32, boarding: 42, grooming: 58 }, bio: "Active pet lover who enjoys long walks and outdoor activities with your furry friends.", avatar: "DW", active: false },
    { id: 5, name: "Lisa Thompson", rating: 4.9, reviews: 94, location: "Southside", services: ["sitting", "boarding", "grooming"], rates: { walking: 28, sitting: 38, boarding: 48, grooming: 65 }, bio: "Home-based pet sitter with a large fenced yard.", avatar: "LT", active: true }
];
let usersData = [
    { id: 101, name: "Standard User", email: "user@pet.com", password: "password", role: "user", totalBookings: 0, status: "active", phone: '+1 (555) 123-4567', address: '123 Main St, City, State 12345' },
    { id: 102, name: "Admin Manager", email: "admin@pet.com", password: "adminpass", role: "admin", totalBookings: 0, status: "active", phone: '', address: '' },
];
let bookingsData = []; 


// Global state variables
let currentBooking = null;
let filteredSitters = [...sittersData]; 
let currentUserRole = 'guest'; 
let currentLoggedInUser = null; 
let sessionTimeout = null; 
let sessionWarningShown = false;

// --- UTILITY FUNCTIONS FOR SIMULATED DATA (Will be replaced by fetch in production) ---

async function initializeDataAndSession() {
    try {
        // --- SESSION RESUMPTION (Using Session Storage for token) ---
        const token = sessionStorage.getItem('authToken');
        const user = sessionStorage.getItem('currentUser');

        if (token && user) {
            currentLoggedInUser = JSON.parse(user);
            currentUserRole = currentLoggedInUser.role;
        }

    } catch (error) {
        console.error("Failed to load initial data. Check your API connection.", error);
    }
}

// --- AUTHENTICATION AND NAVIGATION LOGIC ---

// Simulate user login
function loginUser(user) {
    currentUserRole = user.role;
    currentLoggedInUser = user; 
    
    // Store session token/user data for persistence (using sessionStorage)
    sessionStorage.setItem('authToken', user.token || 'simulated-token'); 
    sessionStorage.setItem('currentUser', JSON.stringify(user));

    updateNavigation();
    startSessionManagement();
    
    // Update profile fields
    if (document.getElementById('fullName')) {
        document.getElementById('fullName').value = user.name || '';
    }
    if (document.getElementById('email')) {
        document.getElementById('email').value = user.email || '';
    }
    if (document.getElementById('profileNameDisplay')) {
        document.getElementById('profileNameDisplay').textContent = user.name || 'Pet Owner';
    }

    // Default section after login
    if (user.role === 'admin') {
        showSection('admin');
        loadAdminDashboard();
    } else {
        showSection('home');
        updateProfileStats();
    }
}

// Simulate user logout
function logoutUser() {
    currentUserRole = 'guest';
    currentLoggedInUser = null; 
    
    // Clear session storage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    
    clearSessionManagement();
    updateNavigation();
    showSection('login');
    return false; 
}

// --- API-BASED AUTHENTICATION FORM HANDLERS ---

async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    document.getElementById('loginForm').reset();

    // 1. --- CONNECT TO YOUR BACKEND API ---
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // SUCCESS: Server returned a valid user object and token
            const user = { 
                ...data.user, 
                token: data.token 
            }; 
            
            loginUser(user);
        } else {
            // FAILURE: Display error message from server
            alert(`Login failed: ${data.message || 'Invalid credentials or server error.'}`);
            
            // --- FALLBACK FOR DEMO TESTING IF SERVER IS DOWN ---
            const demoUser = usersData.find(u => u.email === email && u.password === password);
            if (demoUser) {
                 const user = { ...demoUser, token: 'simulated-token' };
                 loginUser(user);
                 console.warn("Using DEMO FALLBACK: Connect to your backend to remove this warning.");
            }
            // --- END FALLBACK ---
        }

    } catch (error) {
        console.error('API Error: Server connection failed.', error);
        alert('Server connection failed. Please ensure your Express server is running on port 8080.');
    }
}

async function handleSignupSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
         alert('Signup failed: Please fill in all fields.');
         return;
    }
    if (!isPasswordStrong(password)) {
        alert('Signup failed: Password does not meet security requirements.');
         return;
    }
    if (password !== confirmPassword) {
        alert('Signup failed: Passwords do not match.');
        return;
    }

    // 2. --- CONNECT TO YOUR BACKEND API ---
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password, role: 'user' })
        });
        
        const data = await response.json();

        if (response.ok) {
            // For Demo only: Add new user to front-end array immediately for seamless fallback testing
            usersData.push({ id: Date.now(), name, email, password, role: 'user', totalBookings: 0, status: 'active', phone: '', address: '' });
            
            document.getElementById('signupForm').reset();
            clearPasswordValidation();
            alert('Account created successfully! Please log in.');
            showSection('login');
        } else {
            alert(`Signup failed: ${data.message || 'Account creation failed.'}`);
        }

    } catch (error) {
        console.error('API Error:', error);
        alert('Server connection failed during signup. Please ensure your Express server is running.');
    }
}

function handleForgotPasswordSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;
    
    // 3. --- CONNECT TO YOUR BACKEND API ---
    // This is simulated as it's less critical for the demo
    console.log(`[API SIMULATION] Sent request to ${API_BASE_URL}/auth/forgot-password with email: ${email}`);
    alert(`Password reset instructions have been sent to ${email}.\n\n(Note: This is simulated. Implement the API route to send the real email.)`);
    
    document.getElementById('forgotPasswordForm').reset();
    showSection('login');
}


// Update navigation links based on user role
function updateNavigation() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) navMenu.classList.remove('active'); 

    const authLink = document.getElementById('auth-link');
    if (authLink) {
        authLink.textContent = currentUserRole === 'guest' ? 'Login' : 'Logout';
        authLink.setAttribute('onclick', currentUserRole === 'guest' ? "showSection('login')" : "logoutUser()");
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        const requiredRole = link.getAttribute('data-role');
        const isLoginOrSignup = link.getAttribute('href') === '#login' || link.getAttribute('href') === '#signup';

        if (isLoginOrSignup) {
            link.classList.toggle('hidden', currentUserRole !== 'guest');
        }
        else if (link.id === 'admin-nav-link') {
            link.classList.toggle('hidden', currentUserRole !== 'admin');
        } else if (!link.id.includes('auth-link')) {
            link.classList.toggle('hidden', currentUserRole === 'guest' || (currentUserRole === 'admin' && requiredRole === 'user'));
            if (requiredRole === 'admin' && currentUserRole === 'user') {
                 link.classList.add('hidden');
            }
            if (requiredRole === 'user' && currentUserRole === 'user') {
                 link.classList.remove('hidden');
            }
        }
    });

    const currentSection = document.querySelector('section:not([style*="display: none"])')?.id || (currentUserRole === 'admin' ? 'admin' : 'home');
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[href="#${currentSection}"]`)?.classList.add('active');
    
    if (currentSection === 'sitters') loadSitters();
    if (currentSection === 'history') loadBookings();
    if (currentSection === 'profile') updateProfileStats();
    if (currentSection === 'admin') loadAdminDashboard();
}

// Show specific section, enforcing role-based access
function showSection(sectionId) {
    const allowedSections = {
        'guest': ['login', 'signup', 'forgot-password'],
        'user': ['home', 'sitters', 'booking', 'history', 'profile'],
        'admin': ['admin']
    };

    if (sectionId !== 'login' && sectionId !== 'signup' && sectionId !== 'forgot-password' && !allowedSections[currentUserRole].includes(sectionId)) {
        return showSection(currentUserRole === 'guest' ? 'login' : 'home');
    }

    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.style.display = 'block';
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[href="#${sectionId}"]`)?.classList.add('active');
    
    if (sectionId === 'sitters') loadSitters();
    if (sectionId === 'history') loadBookings();
    if (sectionId === 'profile') updateProfileStats();
    if (sectionId === 'admin') loadAdminDashboard();

    window.scrollTo(0, 0);
}


// --- ADMIN DASHBOARD LOGIC (SIMULATED DATA FOR NOW) ---

function loadAdminDashboard() {
    if (currentUserRole !== 'admin') return showSection('home');
    
    // IN A REAL APP: This would fetch statistics and user/booking data from protected API routes.
    updateAdminStatistics();
    renderUserManagement();
    renderSitterManagement();
    renderBookingManagement();
    renderOverview();
    showAdminPanel('overview'); 
}

function showAdminPanel(panelId) {
    document.querySelectorAll('.admin-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const tab = document.querySelector(`.tab-btn[onclick*="${panelId}"]`);
    if (tab) tab.classList.add('active');
}

// Renders the User Management table
function renderUserManagement() {
    const tbody = document.getElementById('userManagementTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    usersData.forEach(user => {
        const row = tbody.insertRow();
        const roleBadge = `<span class="user-role-badge role-${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>`;
        const statusBadge = `<span class="user-role-badge role-${user.status === 'active' ? 'user' : 'admin'}">${user.status || 'active'}</span>`;
        
        row.innerHTML = `
            <td data-label="ID">${user.id}</td>
            <td data-label="Name">${user.name}</td>
            <td data-label="Email">${user.email}</td>
            <td data-label="Role">${roleBadge}</td>
            <td data-label="Bookings">${bookingsData.filter(b => b.userId === user.id).length}</td>
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Actions" class="flex gap-2">
                <button class="btn btn-primary btn-sm" onclick="handleUserAction(${user.id}, 'promote')">
                    ${user.role === 'user' ? 'Promote' : 'Demote'}
                </button>
                <button class="btn btn-secondary btn-sm" onclick="handleUserAction(${user.id}, 'toggle-status')">
                    ${(user.status === 'active' || !user.status) ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn btn-danger btn-sm" onclick="handleUserAction(${user.id}, 'delete')">Delete</button>
            </td>
        `;
    });
}

// Handles actions on users (simulated)
function handleUserAction(userId, action) {
    const userIndex = usersData.findIndex(u => u.id === userId);
    if (userIndex === -1) return;
    
    const user = usersData[userIndex];
    let message = '';
    
    // IN A REAL APP: This would send a PUT/DELETE request to the backend.
    
    if (user.id === 102 && (action === 'delete' || (action === 'promote' && user.role === 'admin'))) {
        alert("Action blocked: Cannot modify the main Admin account in this demo.");
        return;
    }

    if (action === 'promote') {
        user.role = user.role === 'user' ? 'admin' : 'user';
        message = `${user.name} role updated to ${user.role}.`;
    } else if (action === 'toggle-status') {
        user.status = (user.status === 'active' || !user.status) ? 'inactive' : 'active';
        message = `${user.name} status updated to ${user.status}.`;
    } else if (action === 'delete') {
        usersData.splice(userIndex, 1);
        message = `${user.name} account deleted.`;
    }

    renderUserManagement();
    updateAdminStatistics();
    
    alert(message); 
}

// Renders the Sitter Management grid
function renderSitterManagement() {
    const grid = document.getElementById('sitterManagementGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    sittersData.forEach(sitter => {
        const card = document.createElement('div');
        card.className = 'management-card';
        
        const activeStatus = sitter.active 
            ? '<span class="user-role-badge role-user">Active</span>' 
            : '<span class="user-role-badge role-admin">Inactive (Hidden from users)</span>';
        
        const actionButton = sitter.active 
            ? `<button class="btn btn-danger btn-sm" onclick="handleSitterAction(${sitter.id}, 'deactivate')">Deactivate</button>`
            : `<button class="btn btn-primary btn-sm" onclick="handleSitterAction(${sitter.id}, 'activate')">Activate</button>`;

        card.innerHTML = `
            <h4>${sitter.name}</h4>
            <p class="mb-1"><strong>ID:</strong> ${sitter.id}</p>
            <p class="mb-1"><strong>Rating:</strong> ${sitter.rating} (${sitter.reviews} reviews)</p>
            <p class="mb-1"><strong>Status:</strong> ${activeStatus}</p>
            <div class="actions">
                <button class="btn btn-secondary btn-sm" onclick="handleSitterAction(${sitter.id}, 'edit')">Edit Profile</button>
                ${actionButton}
            </div>
        `;
        grid.appendChild(card);
    });
}

// Handles actions on sitters (simulated)
function handleSitterAction(sitterId, action) {
    const sitter = sittersData.find(s => s.id === sitterId);
    if (!sitter) return;

    let message = '';
    
    if (action === 'deactivate') {
        sitter.active = false;
        message = `${sitter.name} has been deactivated.`;
    } else if (action === 'activate') {
        sitter.active = true;
        message = `${sitter.name} has been activated.`;
    } else if (action === 'edit') {
        message = `Simulating opening edit form for ${sitter.name}.`;
    }

    renderSitterManagement();
    loadSitters();
    alert(message);
}


// --- EXISTING APPLICATION LOGIC ---


// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await initializeDataAndSession(); 
    initializeApp();
    setupEventListeners();
    
    if (currentUserRole === 'guest') {
         showSection('login'); 
    } else {
        // Resume session
        showSection(currentUserRole === 'admin' ? 'admin' : 'home');
        startSessionManagement();
    }
    updateNavigation();
});

// Initialize application
function initializeApp() {
    const today = new Date().toISOString().split('T')[0];
    const bookingDateEl = document.getElementById('bookingDate');
    if(bookingDateEl) bookingDateEl.setAttribute('min', today);
    
    populateSitterDropdown();
    setupMobileNavigation();

    const defaultPaymentMethod = document.querySelector('input[name="paymentMethod"]');
    if (defaultPaymentMethod) {
        defaultPaymentMethod.checked = true;
        togglePaymentFields();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Nav listeners (already set up in global updateNavigation)

    document.getElementById('loginForm')?.addEventListener('submit', handleLoginSubmit);
    document.getElementById('signupForm')?.addEventListener('submit', handleSignupSubmit);
    document.getElementById('forgotPasswordForm')?.addEventListener('submit', handleForgotPasswordSubmit);
    
    document.getElementById('bookingForm')?.addEventListener('submit', handleBookingSubmit);
    document.getElementById('paymentForm')?.addEventListener('submit', handlePaymentSubmit);
    document.getElementById('profileForm')?.addEventListener('submit', handleProfileSubmit);
    
    document.getElementById('selectedSitter')?.addEventListener('change', updateBookingSummary);
    document.getElementById('serviceType')?.addEventListener('change', updateBookingSummary);
    document.getElementById('duration')?.addEventListener('input', updateBookingSummary);
    
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', togglePaymentFields);
    });
    
    const onlineNumber = document.getElementById('onlineNumber');
    if (onlineNumber) onlineNumber.addEventListener('input', formatMobileNumber);
    
    document.getElementById('statusFilter')?.addEventListener('change', filterHistory);
    document.getElementById('searchHistory')?.addEventListener('keyup', filterHistory);

    const bookingStatusFilter = document.getElementById('bookingStatusFilter');
    if (bookingStatusFilter) bookingStatusFilter.addEventListener('change', filterAdminBookings);
    
    const bookingSearch = document.getElementById('bookingSearch');
    if (bookingSearch) bookingSearch.addEventListener('keyup', filterAdminBookings);
}

// Mobile navigation setup (Moved outside initializeApp)
function setupMobileNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
            });
        });
    }
}


// Load and display sitters (only display active sitters for users)
function loadSitters() {
    const sittersGrid = document.getElementById('sittersGrid');
    if (!sittersGrid) return;

    sittersGrid.innerHTML = '';
    
    // IN A REAL APP: This would fetch from the GET /api/sitters route
    const sittersToDisplay = filteredSitters.filter(s => s.active); 

    if (sittersToDisplay.length === 0) {
        sittersGrid.innerHTML = '<p class="text-center">No active sitters found matching your criteria.</p>';
        return;
    }
    
    sittersToDisplay.forEach(sitter => {
        const sitterCard = createSitterCard(sitter);
        sittersGrid.appendChild(sitterCard);
    });
}

// Helper functions (createSitterCard, filterSitters, checkPriceRange, etc. are retained)
function createSitterCard(sitter) {
    const card = document.createElement('div');
    card.className = 'sitter-card';
    
    const services = sitter.services.map(service => {
        const serviceNames = { walking: 'Dog Walking', sitting: 'Pet Sitting', boarding: 'Pet Boarding', grooming: 'Grooming' };
        return `<span class="service-tag">${serviceNames[service]}</span>`;
    }).join('');
    
    const ratesText = Object.entries(sitter.rates)
        .filter(([service]) => sitter.services.includes(service))
        .map(([service, rate]) => {
            const serviceNames = { walking: 'Walking', sitting: 'Pet Sitting', boarding: 'Pet Boarding', grooming: 'Grooming' };
            return `${serviceNames[service]}: ₱${rate}/hr`;
        }).join(' • ');
    
    card.innerHTML = `
        <div class="sitter-header">
            <div class="sitter-avatar">${sitter.avatar}</div>
            <div class="sitter-info">
                <h3>${sitter.name}</h3>
                <div class="sitter-rating">
                    <i class="fas fa-star"></i>
                    <span>${sitter.rating} (${sitter.reviews} reviews)</span>
                </div>
            </div>
        </div>
        <p class="sitter-bio">${sitter.bio}</p>
        <div class="sitter-services">
            ${services}
        </div>
        <div class="sitter-rates">
            ${ratesText}
        </div>
        <button class="btn btn-primary book-btn" onclick="selectSitter(${sitter.id})">
            Book ${sitter.name}
        </button>
    `;
    
    return card;
}

function filterSitters() {
    const searchTerm = document.getElementById('searchSitters').value.toLowerCase();
    const serviceFilter = document.getElementById('serviceFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    
    filteredSitters = sittersData.filter(sitter => {
        const matchesSearch = sitter.name.toLowerCase().includes(searchTerm) || sitter.location.toLowerCase().includes(searchTerm);
        const matchesService = !serviceFilter || sitter.services.includes(serviceFilter);
        const matchesPrice = !priceFilter || checkPriceRange(sitter, priceFilter);
        
        return matchesSearch && matchesService && matchesPrice;
    });
    
    loadSitters();
}

function checkPriceRange(sitter, priceRange) {
    const rates = Object.values(sitter.rates);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    
    switch(priceRange) {
        case '0-20': return maxRate <= 20;
        case '20-40': return minRate >= 20 && maxRate <= 40;
        case '40-60': return minRate >= 40 && maxRate <= 60;
        default: return true;
    }
}

function selectSitter(sitterId) {
    if (currentUserRole !== 'user') {
        alert("Please log in to book a service.");
        showSection('login');
        return;
    }
    
    const sitter = sittersData.find(s => s.id === sitterId);
    if (sitter) {
        const selectedSitterEl = document.getElementById('selectedSitter');
        if (selectedSitterEl) selectedSitterEl.value = sitterId;
        updateBookingSummary();
        showSection('booking');
    }
}

function populateSitterDropdown() {
    const select = document.getElementById('selectedSitter');
    if (!select) return;

    select.innerHTML = '<option value="">Choose a sitter...</option>';
    
    sittersData.filter(s => s.active).forEach(sitter => {
        const option = document.createElement('option');
        option.value = sitter.id;
        option.textContent = sitter.name;
        select.appendChild(option);
    });
}

function updateBookingSummary() {
    const sitterId = document.getElementById('selectedSitter').value;
    const serviceType = document.getElementById('serviceType').value;
    const duration = parseInt(document.getElementById('duration').value) || 1;
    
    const summaryDiv = document.getElementById('bookingSummary');
    if (!summaryDiv) return;
    
    if (!sitterId || !serviceType) {
        summaryDiv.innerHTML = '<p>Select a sitter and service to see pricing</p>';
        return;
    }
    
    const sitter = sittersData.find(s => s.id == sitterId);
    if (!sitter) {
         summaryDiv.innerHTML = '<p>Selected sitter not found or is inactive.</p>';
         return;
    }
    
    const serviceNames = { walking: 'Dog Walking', sitting: 'Pet Sitting', boarding: 'Pet Boarding', grooming: 'Grooming' };
    
    const rate = sitter.rates[serviceType];
    const total = rate * duration;
    
    summaryDiv.innerHTML = `
        <div class="summary-item"><span>Sitter:</span><span>${sitter.name}</span></div>
        <div class="summary-item"><span>Service:</span><span>${serviceNames[serviceType]}</span></div>
        <div class="summary-item"><span>Duration:</span><span>${duration} hour${duration > 1 ? 's' : ''}</span></div>
        <div class="summary-item"><span>Rate:</span><span>₱${rate}/hour</span></div>
        <div class="summary-total"><span>Total:</span><span>₱${total}</span></div>
    `;
}

function handleBookingSubmit(e) {
    e.preventDefault();
    
    if (currentUserRole !== 'user' || !currentLoggedInUser) {
        alert('Please log in as a standard user to make a booking.');
        showSection('login');
        return;
    }

    const formData = {
        sitterId: document.getElementById('selectedSitter').value,
        serviceType: document.getElementById('serviceType').value,
        petName: document.getElementById('petName').value,
        petType: document.getElementById('petType').value,
        date: document.getElementById('bookingDate').value,
        time: document.getElementById('bookingTime').value,
        duration: parseInt(document.getElementById('duration').value),
        specialInstructions: document.getElementById('specialInstructions').value,
        userId: currentLoggedInUser.id 
    };
    
    if (!formData.sitterId || !formData.serviceType) {
        alert('Please select a sitter and service type.');
        return;
    }
    
    const sitter = sittersData.find(s => s.id == formData.sitterId);
    const serviceNames = { walking: 'Dog Walking', sitting: 'Pet Sitting', boarding: 'Pet Boarding', grooming: 'Grooming' };
    
    currentBooking = {
        ...formData,
        sitterName: sitter.name,
        serviceType: serviceNames[formData.serviceType],
        totalPrice: sitter.rates[formData.serviceType] * formData.duration
    };
    
    showPaymentModal();
}

function showPaymentModal() {
    const modal = document.getElementById('paymentModal');
    const detailsDiv = document.getElementById('paymentDetails');
    if (!modal || !detailsDiv) return;

    detailsDiv.innerHTML = `
        <div class="summary-item"><span>Sitter:</span><span>${currentBooking.sitterName}</span></div>
        <div class="summary-item"><span>Service:</span><span>${currentBooking.serviceType}</span></div>
        <div class="summary-item"><span>Pet:</span><span>${currentBooking.petName} (${currentBooking.petType})</span></div>
        <div class="summary-item"><span>Date & Time:</span><span>${formatDate(currentBooking.date)} at ${currentBooking.time}</span></div>
        <div class="summary-item"><span>Duration:</span><span>${currentBooking.duration} hour${currentBooking.duration > 1 ? 's' : ''}</span></div>
        <div class="summary-total"><span>Total:</span><span>₱${currentBooking.totalPrice}</span></div>
    `;
    
    togglePaymentFields();
    modal.style.display = 'block';
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    if (!paymentMethod) {
        alert('Please select a payment method.');
        return;
    }
    
    let isValid = true;
    if (paymentMethod === 'gcash' || paymentMethod === 'maya') {
        const mobileNumber = document.getElementById('onlineNumber').value;
        if (!mobileNumber) {
            alert(`Please enter your mobile number for ${paymentMethod.toUpperCase()} payment verification.`);
            isValid = false;
        } else if (!isValidMobileNumber(mobileNumber)) {
            alert('Please enter a valid mobile number (09XX XXX XXXX).');
            isValid = false;
        }
    } else if (paymentMethod === 'cash') {
        isValid = confirm('You selected Cash Payment. Please ensure you have the payment ready for the sitter. Proceed with booking?');
    }
    
    if (isValid) {
        // Use a timeout to simulate network latency before processing
        setTimeout(() => {
            processPayment(paymentMethod);
        }, 500);
    }
}

async function processPayment(paymentMethod) {
    
    const bookingPayload = {
        // User details needed by the server for email sending and database save
        userId: currentLoggedInUser.id,
        userName: currentLoggedInUser.name,
        userEmail: currentLoggedInUser.email,
        
        // Booking details
        sitterName: currentBooking.sitterName,
        sitterId: currentBooking.sitterId,
        serviceType: currentBooking.serviceType,
        petName: currentBooking.petName,
        petType: currentBooking.petType,
        date: currentBooking.date,
        time: currentBooking.time,
        duration: currentBooking.duration,
        totalPrice: currentBooking.totalPrice,
        paymentMethod: paymentMethod,
        specialInstructions: currentBooking.specialInstructions
    };

    // 4. --- FINAL BACKEND API CALL FOR BOOKING AND EMAIL ---
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${currentLoggedInUser.token}` // Use this in production
            },
            body: JSON.stringify(bookingPayload)
        });

        const data = await response.json();

        if (response.ok) {
            // Server successfully saved booking and sent email
            const newBooking = data.booking;

            // Update front-end state (SIMULATED):
            bookingsData.push(newBooking); 
            
            // Update user stats (SIMULATED):
            // Note: This relies on the currentLoggedInUser object which is updated on login
            currentLoggedInUser.totalBookings = (currentLoggedInUser.totalBookings || 0) + 1;
            
            closePaymentModal();
            showSuccessModal(paymentMethod);

            document.getElementById('bookingForm').reset();
            document.getElementById('bookingSummary').innerHTML = '<p>Select a sitter and service to see pricing</p>';
            
            loadBookings();
            updateProfileStats();

        } else {
            alert(`Booking Failed: ${data.message || 'Server error during booking.'}`);
        }

    } catch (error) {
        console.error('API Error: Could not connect to the booking server.', error);
        alert('Could not connect to the booking server. Please ensure your Express server is running on port 8080.');
    }
}

// Show success modal
function showSuccessModal(paymentMethod) {
    const successModal = document.getElementById('successModal');
    const successMessage = successModal.querySelector('p');
    if (!successModal || !successMessage) return;
    
    if (paymentMethod === 'cash') {
        successMessage.textContent = 'Your service has been booked! A receipt has been sent to your email. Please pay the sitter upon service completion.';
    } else if (paymentMethod === 'gcash' || paymentMethod === 'maya') {
        successMessage.textContent = `Your service has been booked! A receipt has been sent to your email. Please complete your ${paymentMethod.toUpperCase()} payment via the app.`;
    } else {
        successMessage.textContent = 'Your pet care service has been successfully booked.';
    }
    
    successModal.style.display = 'block';
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) modal.style.display = 'none';
}

// Load and display bookings
function loadBookings() {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;

    bookingsList.innerHTML = '';
    
    if (currentUserRole !== 'user' || !currentLoggedInUser) {
        bookingsList.innerHTML = '<p class="text-center">Please log in to view your bookings.</p>';
        return;
    }

    // IN A REAL APP: This would fetch from the GET /api/bookings/my-history route
    const userBookings = bookingsData.filter(b => b.userId === currentLoggedInUser.id);
    
    if (userBookings.length === 0) {
        bookingsList.innerHTML = '<p class="text-center">No bookings found.</p>';
        return;
    }
    
    userBookings.forEach(booking => {
        const bookingItem = createBookingItem(booking);
        bookingsList.appendChild(bookingItem);
    });
}

// Create booking item element (retained)
function createBookingItem(booking) {
    const item = document.createElement('div');
    item.className = 'booking-item';
    
    const statusClass = `status-${booking.status}`;
    
    const paymentDisplay = { 'gcash': 'GCash (Online)', 'maya': 'Maya (Online)', 'cash': 'Cash (Upon Service)' };
    
    item.innerHTML = `
        <div class="booking-header">
            <h3>${booking.serviceType} - ${booking.petName}</h3>
            <span class="booking-status ${statusClass}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
        </div>
        <div class="booking-details">
            <div class="booking-detail"><strong>Sitter:</strong><span>${booking.sitterName}</span></div>
            <div class="booking-detail"><strong>Date:</strong><span>${formatDate(booking.date)}</span></div>
            <div class="booking-detail"><strong>Time:</strong><span>${booking.time}</span></div>
            <div class="booking-detail"><strong>Duration:</strong><span>${booking.duration} hour${booking.duration > 1 ? 's' : ''}</span></div>
            <div class="booking-detail"><strong>Total:</strong><span>₱${booking.totalPrice}</span></div>
            <div class="booking-detail"><strong>Payment Method:</strong><span>${paymentDisplay[booking.paymentMethod] || 'Unknown'}</span></div>
            ${booking.specialInstructions ? `<div class="booking-detail"><strong>Special Instructions:</strong><span>${booking.specialInstructions}</span></div>` : ''}
        </div>
    `;
    
    return item;
}

// Filter booking history (retained)
function filterHistory() {
    if (!currentLoggedInUser) return;

    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchHistory').value.toLowerCase();

    const userBookings = bookingsData.filter(b => b.userId === currentLoggedInUser.id);
    
    const filteredBookings = userBookings.filter(booking => {
        const matchesStatus = !statusFilter || booking.status === statusFilter;
        const matchesSearch = !searchTerm || 
                            booking.sitterName.toLowerCase().includes(searchTerm) ||
                            booking.petName.toLowerCase().includes(searchTerm) ||
                            booking.serviceType.toLowerCase().includes(searchTerm);
        
        return matchesStatus && matchesSearch;
    });
    
    displayFilteredBookings(filteredBookings);
}

// Display filtered bookings (retained)
function displayFilteredBookings(bookings) {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;
    bookingsList.innerHTML = '';
    
    if (bookings.length === 0) {
        bookingsList.innerHTML = '<p class="text-center">No bookings match your criteria.</p>';
        return;
    }
    
    bookings.forEach(booking => {
        const bookingItem = createBookingItem(booking);
        bookingsList.appendChild(bookingItem);
    });
}

// Handle profile form submission
function handleProfileSubmit(e) {
    e.preventDefault();
    
    if (currentUserRole !== 'user' || !currentLoggedInUser) {
        alert("Authentication error. Please log in again.");
        return;
    }
    
    const formData = {
        fullName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value
    };
    
    // IN A REAL APP: This would send a PUT request to /api/users/:id to update the profile.
    console.log("[API SIMULATION] Sending PUT request to update profile...");

    // Simulated local update for immediate display
    currentLoggedInUser.name = formData.fullName;
    currentLoggedInUser.phone = formData.phone;
    currentLoggedInUser.address = formData.address;

    sessionStorage.setItem('currentUser', JSON.stringify(currentLoggedInUser));

    document.getElementById('profileNameDisplay').textContent = formData.fullName;
    
    alert('Profile updated successfully!');
}

// Update profile statistics (retained)
function updateProfileStats() {
    const totalBookingsEl = document.getElementById('totalBookings');
    const totalSpentEl = document.getElementById('totalSpent');
    if (!totalBookingsEl || !totalSpentEl) return;

    if (!currentLoggedInUser) {
        totalBookingsEl.textContent = 0;
        totalSpentEl.textContent = `₱0`;
        return;
    }

    const userBookings = bookingsData.filter(b => b.userId === currentLoggedInUser.id);
    const totalBookings = userBookings.length;
    const totalSpent = userBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    totalBookingsEl.textContent = totalBookings;
    totalSpentEl.textContent = `₱${totalSpent}`;
}

// Format date for display (retained)
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Render Cash Payment Billing Details (Resibo) (retained)
function renderCashBillingDetails() {
    if (!currentBooking) return;
    const detailsDiv = document.getElementById('cashBillingDetails');
    if (!detailsDiv) return;
    
    detailsDiv.innerHTML = `
        <div class="summary-item"><span style="font-weight: normal;">Booking ID:</span><span style="font-weight: bold;">[TBA on Confirmation]</span></div>
        <div class="summary-item"><span style="font-weight: normal;">Service Date:</span><span>${formatDate(currentBooking.date)} at ${currentBooking.time}</span></div>
        <div class="summary-item"><span style="font-weight: normal;">Service Type:</span><span>${currentBooking.serviceType}</span></div>
        <div class="summary-item"><span style="font-weight: normal;">Sitter:</span><span>${currentBooking.sitterName}</span></div>
        <div class="summary-total" style="font-size: 1.5rem; margin-top: 1.5rem; padding-top: 0;"><span style="color: #333;">TOTAL AMOUNT DUE:</span><span style="color: #28a745;">₱${currentBooking.totalPrice}</span></div>
    `;
}

// Toggle payment fields based on selected method (retained)
function togglePaymentFields() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const onlineFields = document.getElementById('onlinePaymentFields');
    const cashFields = document.getElementById('cashFields');
    const qrInstructions = document.getElementById('qrInstructions');

    if (onlineFields) onlineFields.style.display = 'none';
    if (cashFields) cashFields.style.display = 'none';
    const onlineNumber = document.getElementById('onlineNumber');
    if (onlineNumber) onlineNumber.required = false;

    if (paymentMethod === 'gcash' || paymentMethod === 'maya') {
        if (onlineFields) onlineFields.style.display = 'block';
        if (onlineNumber) onlineNumber.required = true;
        
        if (qrInstructions) {
             if (paymentMethod === 'gcash') {
                qrInstructions.textContent = 'Scan the QR code above using your GCash app.';
            } else { 
                qrInstructions.textContent = 'Scan the QR code above using your Maya app.';
            }
        }
    } else if (paymentMethod === 'cash') {
        if (cashFields) {
             cashFields.style.display = 'block';
             renderCashBillingDetails(); 
        }
    }
}

// Format mobile number input (retained)
function formatMobileNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) {
        value = value.substring(0, 11);
    }
    e.target.value = value;
}

// Validate PH mobile number (retained)
function isValidMobileNumber(number) {
    const cleanNumber = number.replace(/\D/g, '');
    return cleanNumber.length === 11 && cleanNumber.startsWith('09');
}

window.addEventListener('click', function(e) {
    const paymentModal = document.getElementById('paymentModal');
    const successModal = document.getElementById('successModal');
    
    if (e.target === paymentModal) {
        closePaymentModal();
    }
    if (e.target === successModal) {
        closeSuccessModal();
    }
});

// --- PASSWORD AND SECURITY FUNCTIONS (Retained) ---

function simpleHash(password) {
    let hash = 0;
    if (password.length === 0) return hash.toString();
    
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
function isPasswordStrong(password) {
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLength && hasUppercase && hasLowercase && hasNumber;
}
function checkPasswordStrength() {
    const password = document.getElementById('signupPassword').value;
    const strengthBar = document.getElementById('passwordStrength');
    if (!strengthBar) return;
    
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const requirementsMet = [hasLength, hasUppercase, hasLowercase, hasNumber];
    const validCount = requirementsMet.filter(Boolean).length;
    
    strengthBar.className = 'password-strength';
    if (validCount <= 1) {
        strengthBar.classList.add('weak');
    } else if (validCount <= 2) {
        strengthBar.classList.add('medium');
    } else {
        strengthBar.classList.add('strong');
    }
    updateRequirements(requirementsMet);
}
function updateRequirements(requirementsMet) {
    const requirementIds = ['req-length', 'req-uppercase', 'req-lowercase', 'req-number'];
    requirementIds.forEach((id, index) => {
        const element = document.getElementById(id);
        if(element) {
             if (requirementsMet[index]) {
                element.classList.remove('invalid');
                element.classList.add('valid');
            } else {
                element.classList.remove('valid');
                element.classList.add('invalid');
            }
        }
    });
}
function checkPasswordMatch() {
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchDiv = document.getElementById('passwordMatch');
    if (!matchDiv) return;
    
    if (!confirmPassword) {
        matchDiv.textContent = '';
        matchDiv.className = 'password-match';
        return;
    }
    
    if (password === confirmPassword) {
        matchDiv.textContent = '✓ Passwords match';
        matchDiv.className = 'password-match match';
    } else {
        matchDiv.textContent = '✗ Passwords do not match';
        matchDiv.className = 'password-match no-match';
    }
}
function clearPasswordValidation() {
    const strengthBar = document.getElementById('passwordStrength');
    const matchDiv = document.getElementById('passwordMatch');
    if (strengthBar) strengthBar.className = 'password-strength';
    if (matchDiv) {
         matchDiv.textContent = '';
         matchDiv.className = 'password-match';
    }
    updateRequirements([false, false, false, false]);
}

// SESSION MANAGEMENT (using sessionStorage now)
function startSessionManagement() {
    clearSessionManagement(); 
    sessionTimeout = setTimeout(() => {
        showSessionWarning();
    }, 1800000); 
    document.addEventListener('click', resetSessionTimeout);
    document.addEventListener('keypress', resetSessionTimeout);
    document.addEventListener('scroll', resetSessionTimeout);
}
function clearSessionManagement() {
    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        sessionTimeout = null;
    }
    sessionWarningShown = false;
    document.removeEventListener('click', resetSessionTimeout);
    document.removeEventListener('keypress', resetSessionTimeout);
    document.removeEventListener('scroll', resetSessionTimeout);
}
function resetSessionTimeout() {
    if (currentUserRole !== 'guest' && sessionTimeout) {
        clearTimeout(sessionTimeout);
        startSessionManagement();
    }
}
function showSessionWarning() {
    if (sessionWarningShown) return;
    
    sessionWarningShown = true;
    const warningMessage = `Your session will expire in 5 minutes due to inactivity.\n\nClick OK to stay logged in.`;
    
    if (confirm(warningMessage)) {
        sessionWarningShown = false;
        startSessionManagement();
    } else {
        setTimeout(() => {
            alert('Your session has expired due to inactivity. Please log in again.');
            logoutUser();
        }, 300000); 
    }
}

// ADMIN FUNCTIONS (Simulated for now)
function updateAdminStatistics() {
    const totalUsers = usersData.filter(u => u.role === 'user').length;
    const totalSitters = sittersData.filter(s => s.active).length;
    const totalBookings = bookingsData.length;
    const totalRevenue = bookingsData.reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    const totalUsersEl = document.getElementById('totalUsers');
    if(totalUsersEl) totalUsersEl.textContent = totalUsers;
    const totalSittersEl = document.getElementById('totalSitters');
    if(totalSittersEl) totalSittersEl.textContent = totalSitters;
    const totalBookingsEl = document.getElementById('totalBookings');
    if(totalBookingsEl) totalBookingsEl.textContent = totalBookings;
    const totalRevenueEl = document.getElementById('totalRevenue');
    if(totalRevenueEl) totalRevenueEl.textContent = `₱${totalRevenue}`;
}
function renderOverview() {
    renderRecentActivity();
    renderPopularServices();
}
function renderRecentActivity() {
    const activityContainer = document.getElementById('recentActivity');
    if (!activityContainer) return;
    const activities = [
        { icon: 'fas fa-user-plus', text: 'New user registration', time: '2 hours ago' },
        { icon: 'fas fa-calendar-check', text: 'Booking completed', time: '4 hours ago' },
        { icon: 'fas fa-star', text: 'New sitter review', time: '6 hours ago' },
        { icon: 'fas fa-paw', text: 'Sitter profile updated', time: '1 day ago' },
        { icon: 'fas fa-user', text: 'User profile updated', time: '2 days ago' }
    ];
    activityContainer.innerHTML = activities.map(activity => `
        <div class="activity-item"><div class="activity-icon"><i class="${activity.icon}"></i></div><div class="activity-text">${activity.text}</div><div class="activity-time">${activity.time}</div></div>
    `).join('');
}
function renderPopularServices() {
    const servicesContainer = document.getElementById('popularServices');
    if (!servicesContainer) return;
    const serviceCounts = {};
    bookingsData.forEach(booking => {
        serviceCounts[booking.serviceType] = (serviceCounts[booking.serviceType] || 0) + 1;
    });
    const sortedServices = Object.entries(serviceCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    servicesContainer.innerHTML = sortedServices.map(([service, count]) => `
        <div class="service-item"><span class="service-name">${service}</span><span class="service-count">${count}</span></div>
    `).join('') || '<p style="text-align: center; color: #666;">No booking data available</p>';
}
function renderBookingManagement() {
    const tbody = document.getElementById('bookingManagementTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    bookingsData.forEach(booking => {
        const row = tbody.insertRow();
        const user = usersData.find(u => u.id === booking.userId);
        const statusClass = `status-${booking.status}`;
        row.innerHTML = `<td data-label="ID">${booking.id}</td><td data-label="Customer">${user ? user.name : 'Unknown'}</td><td data-label="Sitter">${booking.sitterName}</td><td data-label="Service">${booking.serviceType}</td><td data-label="Date">${formatDate(booking.date)}</td><td data-label="Amount">₱${booking.totalPrice}</td><td data-label="Status"><span class="booking-status ${statusClass}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></td><td data-label="Actions"><button class="btn btn-primary btn-sm" onclick="handleBookingAction(${booking.id}, 'view')">View</button><button class="btn btn-secondary btn-sm" onclick="handleBookingAction(${booking.id}, 'update')">Update</button></td>`;
    });
}
function filterAdminBookings() {
    const statusFilter = document.getElementById('bookingStatusFilter')?.value;
    const searchTerm = document.getElementById('bookingSearch')?.value.toLowerCase();
    
    if (!statusFilter && !searchTerm) {
        renderBookingManagement();
        return;
    }

    const filteredBookings = bookingsData.filter(booking => {
        const user = usersData.find(u => u.id === booking.userId);
        const matchesStatus = !statusFilter || booking.status === statusFilter;
        const matchesSearch = !searchTerm || booking.sitterName.toLowerCase().includes(searchTerm) || booking.serviceType.toLowerCase().includes(searchTerm) || (user && user.name.toLowerCase().includes(searchTerm));
        return matchesStatus && matchesSearch;
    });
    
    displayFilteredAdminBookings(filteredBookings);
}
function displayFilteredAdminBookings(bookings) {
    const tbody = document.getElementById('bookingManagementTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    bookings.forEach(booking => {
        const row = tbody.insertRow();
        const user = usersData.find(u => u.id === booking.userId);
        const statusClass = `status-${booking.status}`;
        row.innerHTML = `<td data-label="ID">${booking.id}</td><td data-label="Customer">${user ? user.name : 'Unknown'}</td><td data-label="Sitter">${booking.sitterName}</td><td data-label="Service">${booking.serviceType}</td><td data-label="Date">${formatDate(booking.date)}</td><td data-label="Amount">₱${booking.totalPrice}</td><td data-label="Status"><span class="booking-status ${statusClass}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></td><td data-label="Actions"><button class="btn btn-primary btn-sm" onclick="handleBookingAction(${booking.id}, 'view')">View</button><button class="btn btn-secondary btn-sm" onclick="handleBookingAction(${booking.id}, 'update')">Update</button></td>`;
    });
}
function handleBookingAction(bookingId, action) {
    const booking = bookingsData.find(b => b.id === bookingId);
    if (!booking) return;
    
    const paymentDisplay = { 'gcash': 'GCash (Online)', 'maya': 'Maya (Online)', 'cash': 'Cash (Upon Service)' };

    if (action === 'view') {
        alert(`Booking Details:\n\nID: ${booking.id}\nCustomer: ${usersData.find(u => u.id === booking.userId)?.name || 'Unknown'}\nSitter: ${booking.sitterName}\nService: ${booking.serviceType}\nPet: ${booking.petName} (${booking.petType})\nDate: ${formatDate(booking.date)} at ${booking.time}\nTotal: ₱${booking.totalPrice}\nStatus: ${booking.status}\nPayment: ${paymentDisplay[booking.paymentMethod] || 'Unknown'}`);
    } else if (action === 'update') {
        const newStatus = prompt(`Current status: ${booking.status}\n\nEnter new status (upcoming, completed, cancelled):`, booking.status);
        if (newStatus && ['upcoming', 'completed', 'cancelled'].includes(newStatus.toLowerCase())) {
            booking.status = newStatus.toLowerCase();
            renderBookingManagement();
            updateAdminStatistics();
            alert('Booking status updated successfully!');
        }
    }
}