// const jsonServer = require('json-server');
// const auth = require('json-server-auth');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const cors = require('cors'); 
// const app = jsonServer.create();
// const router = jsonServer.router('db.json');

// // Secret key for JWT
// const SECRET_KEY = 'your-secret-key';
// app.use(jsonServer.bodyParser)
// app.use(jsonServer.defaults());
// app.use(cors())
// app.post('/custom-login', async (req, res) => {
//   const { email, password, role } = req.body;
// const user = router.db.get('users').find({ email }).value();
  
//   console.log("🚀 ~ app.post ~ user:", user)
//   // Check if the user exists
//   if (!user) {
//     return res.status(401).json({ error: 'User not found with this mail' });
//   }
//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) {
//     return res.status(401).json({ error: 'Invalid email or password' });
//   }
//   if(user && user.role !== role){
//     return res.status(401).json({ error: 'Please enter correct role' });
//   }

//   // Password comparison based on the role
//   // if (role === 'Admin') {
//   //   // For Admin, we compare the encrypted password
//   //   const isMatch = await bcrypt.compare(password, user.password);
//     // if (!isMatch) {
//     //   return res.status(401).json({ error: 'Invalid email or password' });
//     // }
//   // } else {
//   //   // For Manager and Employee, directly compare the plain-text password
//     // if (user.password !== password) {
//     //   return res.status(401).json({ error: 'Invalid email or password' });
//     // }
//   // }

//   // Generate JWT token
//   const token = jwt.sign(
//     { id: user.id, email: user.email, role: user.role },
//     SECRET_KEY,
//     { expiresIn: '1m' }
//   );

//   // Return the token and user data
//   return res.status(200).json({ token, user });
// });
 
// app.db = router.db;

// app.use(auth);
// app.use(router);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`JSON Server running on http://localhost:${PORT}`);
// });
const jsonServer = require('json-server');
const auth = require('json-server-auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Secret key for JWT
const SECRET_KEY = 'your-secret-key';

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
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check if role matches
  if (user.role !== role) {
    return res.status(401).json({ error: 'Please enter correct role' });
  }

  // Generate JWT token
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

  // Return the token and user data
  res.status(200).json({ token, user });
});

// Authentication middleware for all routes (except custom ones)
app.use((req, res, next) => {
  console.log("🚀 ~ app.use ~ req:", req)
  console.log(req.headers,'req.headers');
  
  if (req.path === '/custom-login') {
    return next(); // Skip token check for custom login route
  }

  const authHeader = req.headers.authorization;
  console.log("🚀 ~ app.use ~ authHeader:", authHeader)
  if (!authHeader) {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token part of the header
console.log(token,'token');

  // Verify the JWT token
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    console.log('verifying',token);
    if (err) {
      console.log(err,'err-------');
      
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('verified',token);
    // Attach decoded user info to the request
    req.user = decoded;
    next(); // Proceed to the next middleware or route
  });
});

// Serve JSON server and custom routes
app.use(auth);  // Add this if you want to use `json-server-auth` to manage roles
app.use(router);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`JSON Server running on http://localhost:${PORT}`);
});
