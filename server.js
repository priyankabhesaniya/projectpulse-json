
const jsonServer = require('json-server');
const auth = require('json-server-auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const SECRET_KEY = 'mnbvcxz';

app.use(middlewares);
app.use(cors());
app.use(jsonServer.bodyParser);


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
  const { email, password, role, phone, name } = req.body;

  const user = router.db.get('users').find({ email }).value();

  if (user) {
    return res.status(401).json({ error: 'User with this email already exists' });
  } else {
    const users = router.db.get('users').value();

    const newUser = {
      email,
      password,
      role,
      name,
      phone,
      address: req?.body?.address ? req?.body?.address : "",
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1 // Use a unique ID; you can implement a better ID generation strategy if needed
    };


    router.db.get('users').push(newUser).write();


    return res.status(201).json(newUser);
  }
});

app.use((req, res, next) => {
  console.log("🚀 ~ app.use ~ req:", req)
  console.log(req.headers, 'req.headers');

  if (req.path === '/custom-login') {
    return next();
  }
  if (req.path === '/users' && (req.method === 'POST' || req.method === 'post')) {
    return next();
  }
  const authHeader = req.headers.authorization;
  console.log("🚀 ~ app.use ~ authHeader:", authHeader)
  if (!authHeader) {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    console.log('verifying', token);
    if (err) {
      console.log(err, 'err-------');

      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  });
});

app.use(router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`JSON Server running on http://localhost:${PORT}`);
});
