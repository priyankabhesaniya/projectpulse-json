
const jsonServer = require('json-server');
const auth = require('json-server-auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Secret key for JWT
const SECRET_KEY = 'mnbvcxz';

// Apply middlewares (CORS, static files, logging, etc.)
app.use(middlewares);
app.use(cors());
app.use(jsonServer.bodyParser);

// Custom login route
app.post('/custom-login', async (req, res) => {
  const { email, password, role } = req.body;
  const user = router.db.get('users').find({ email }).value();

  // Check if the user exists
  if (!user) {
    return res.status(401).json({ error: 'User not found with this email' });
  }

  // Validate password
  const isMatch = await bcrypt.compare(password, user.password);
  if (user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check if role matches
  if (user.role !== role) {
    return res.status(401).json({ error: 'Please enter correct role' });
  }

  // Generate JWT token
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
  console.log("🚀 ~ app.post ~ token:", token)

  // Return the token and user data
  res.status(200).json({ token, user });
});
app.post('/users', async (req, res) => {
  const { email, password, role,phone,name } = req.body;

  // Check if the user with the given email already exists
  const user = router.db.get('users').find({ email }).value();

  if (user) {
    return res.status(401).json({ error: 'User with this email already exists' });
  } else {
    const users = router.db.get('users').value();
    // Create a new user object
    const newUser = {
      email,
      password,
      role,
      name,
      phone,
      address:req?.body?.address ? req?.body?.address : "",
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1 // Use a unique ID; you can implement a better ID generation strategy if needed
    };

    // Add the new user to the users array in the JSON Server
    router.db.get('users').push(newUser).write(); // Save the new user to the database

    // Respond with the created user
    return res.status(201).json(newUser);
  }
});

// Authentication middleware for all routes (except custom ones)
app.use((req, res, next) => {
  console.log("🚀 ~ app.use ~ req:", req)
  console.log(req.headers,'req.headers');
  
  if (req.path === '/custom-login') {
    return next();
  }
  // Skip token check for POST requests to /users, but apply for other methods
  if (req.path === '/users' && (req.method === 'POST' || req.method === 'post')) {
    return next();
  }
  const authHeader = req.headers.authorization;
  console.log("🚀 ~ app.use ~ authHeader:", authHeader)
  if (!authHeader) {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token part of the header
// console.log(token,'token');

  // Verify the JWT token
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    console.log('verifying',token);
    if (err) {
      console.log(err,'err-------');
      
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    // console.log('verified',token);
    // Attach decoded user info to the request
    req.user = decoded;
    next(); // Proceed to the next middleware or route
  });
});

// Serve JSON server and custom routes
// app.use(auth);  // Add this if you want to use `json-server-auth` to manage roles
app.use(router);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`JSON Server running on http://localhost:${PORT}`);
});
