const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true, // Allow all origins for now, or specify your frontend URL
    credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
    secret: 'vue-cine-secret-key', // In production, use a secure env variable
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/movies', require('./routes/movies'));
app.use('/halls', require('./routes/halls'));
app.use('/screenings', require('./routes/screenings'));
app.use('/purchases', require('./routes/purchases'));
app.use('/stats', require('./routes/stats'));
app.use('/upload', require('./routes/upload'));
app.use('/accounting', require('./routes/accounting'));


// Base route
app.get('/', (req, res) => {
    res.json({ message: 'Vue Cine API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
