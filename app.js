require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set('layout', 'layout'); // refers to views/layout.ejs

const session = require('express-session');
app.use(session({
  name: process.env.SESSION_COOKIE_NAME,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.SESSION_COOKIE_SECURE === 'true'
  }
}));

// Middleware
const helpers = require('./utils/validation');
const normalize = require('./utils/normalize');
app.use((req, res, next) => {
  const isAuthRoute = req.path.startsWith('/auth');
  const isStatic = req.path.startsWith('/public') || req.path.startsWith('/assets');

  if (isAuthRoute || isStatic) {
    return next();
  }
  if (!req.session.user) {
	req.session.returnTo = req.originalUrl;
    return res.redirect('/auth');
  }
  req.userId = req.session?.user?.id;
  req.helpers = helpers;
  req.normalize = normalize;

  next();
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/', require('./routes/tasks'));
app.use('/templates', require('./routes/templates'));
app.use('/schedules', require('./routes/schedules'));
app.use('/customers', require('./routes/customers'));
app.use('/assignments', require('./routes/assignments'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

app.listen(process.env.PORT, () => {
    console.log(process.env.APP_BASE_URL);
});