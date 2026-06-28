const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nexacore_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';

// Signup route
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const connection = await pool.getConnection();

    // Check if user exists
    const [existingUser] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await connection.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    connection.release();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const connection = await pool.getConnection();

    // Find user
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      connection.release();
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    connection.release();

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token: token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected route - verify token
app.get('/api/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout route (frontend handles token deletion)
app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});