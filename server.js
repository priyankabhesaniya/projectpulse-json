// // // server.js
// // // const jsonServer = require('./node_modules/');
// // const jsonServer= require('json-server')
// // // const authMiddleware = require('./middleware/auth');

// // const server = jsonServer.create();
// // const router = jsonServer.router('db.json');
// // const middlewares = jsonServer.defaults();
// // server.use(middlewares);

// // // server.use(authMiddleware);

// // // Use default router
// // server.use(router);

// // // Start the server
// // const PORT = 5000;
// // server.listen(PORT, () => {
// //     console.log(`JSON Server is running on http://localhost:${PORT}`);
// // });
// const jsonServer = require('json-server')
// const auth = require('json-server-auth')
// const PORT = 5000
// const cors = require('cors'); 
// const app = jsonServer.create()
// const router = jsonServer.router('db.json')
// app.use(jsonServer?.bodyParser());
// // const middlewares = jsonServer.defaults();

// // Use the built-in middlewares (including CORS)
// // app.use(middlewares);

// // Additionally, add the CORS middleware manually (if needed)
// app.use(cors());
// // /!\ Bind the router db to the app
// app.db = router.db
// app.post('/custom-login', (req, res) => {
//     console.log("🚀 ~ app.post ~ req:", req)
//     return
//     const { email, password, role } = req.body;
  
//     // Find user by email and password
//     const user = router.db.get('users').find({ email, password }).value();
  
//     // If user not found, return error
//     if (!user) {
//       return res.status(401).json({ error: 'Invalid email or password' });
//     }
  
//     // If the role doesn't match, return an error
//     if (user.role !== role) {
//       return res.status(401).json({ error: 'Invalid role' });
//     }
  
//     // If email, password, and role match, create a JWT token
//     const token = jwt.sign(
//       { id: user.id, email: user.email, role: user.role },
//       SECRET_KEY,
//       { expiresIn: '1h' }
//     );
  
//     return res.status(200).json({ token, user });
//   });
// // You must apply the auth middleware before the router
// app.use(auth)
// app.use(router)

// // app.post('/login', (req, res) => {
// //     const { email, password, role } = req.body;
    
// //     // First, find the user by email and password
// //     const user = router.db.get('users').find({ email, password }).value();
    
// //     // If the user is not found, return an error
// //     if (!user) {
// //       return res.status(401).json({ error: 'Invalid email or password' });
// //     }
    
// //     // If the user is found but the role doesn't match, return an error
// //     if (user.role !== role) {
// //       return res.status(401).json({ error: 'Invalid role for the user' });
// //     }
    
// //     // If both the user and role match, generate the JWT token and return success
// //     const token = jwt.sign(
// //       { id: user.id, username: user.username, role: user.role }, 
// //       SECRET_KEY, 
// //       { expiresIn: '1h' }
// //     );
    
// //     return res.status(200).json({ token, user });
// //   });
  

// app.listen(PORT, () => {
//     console.log(`JSON Server is running on http://localhost:${PORT}`);
// });
const jsonServer = require('json-server');
const auth = require('json-server-auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors'); 
const app = jsonServer.create();
const router = jsonServer.router('db.json');

// Secret key for JWT
const SECRET_KEY = 'your-secret-key';
app.use(jsonServer.bodyParser)
app.use(jsonServer.defaults());
app.use(cors())
app.post('/custom-login', async (req, res) => {
  const { email, password, role } = req.body;

  let user;

  // Fetch the user based on the role and email
  if (role === 'Admin') {
    user = router.db.get('admin').find({ email }).value();
    
  } else if (role === 'Manager') {
    user = router.db.get('manager').find({ email }).value();
  } else if (role === 'Employee') {
    user = router.db.get('employee').find({ email }).value();
  }
  console.log("🚀 ~ app.post ~ user:", user)
  // Check if the user exists
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  if (user.password !== password) {
    return res.status(401).json({ error: 'Wrong password entered' });
  }
  // Password comparison based on the role
  // if (role === 'Admin') {
  //   // For Admin, we compare the encrypted password
  //   const isMatch = await bcrypt.compare(password, user.password);
  //   if (!isMatch) {
  //     return res.status(401).json({ error: 'Invalid email or password' });
  //   }
  // } else {
  //   // For Manager and Employee, directly compare the plain-text password
    // if (user.password !== password) {
    //   return res.status(401).json({ error: 'Invalid email or password' });
    // }
  // }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  // Return the token and user data
  return res.status(200).json({ token, user });
});
 
app.db = router.db;

app.use(auth);
app.use(router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`JSON Server running on http://localhost:${PORT}`);
});
