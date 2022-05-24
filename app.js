const path = require('path');
const fs = require('fs');

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const helmet = require('helmet');
const compression = require('compression');

const recordRoutes = require('./routes/record');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const roleRoutes = require('./routes/role');
const bUnitRoutes = require('./routes/business-unit');
const gradeRoutes = require('./routes/grade');
const errorController = require('./controllers/error');
const User = require('./models/user');
require('dotenv').config();

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@email-dev.nwg5m.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions',
});

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());

const csrfProtection = csrf({ cookie: false });
app.use(flash());

app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: 'thisisomesecret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// app.use(csrfProtection);

app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static(path.join(__dirname, 'public')));

app.use(async (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return next();
    }
    req.user = user;
    next();
  } catch (err) {
    throw new Error(err);
  }
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.isAllowed = req.session.isAllowed;
  // res.locals.csrfToken = req.csrfToken();
  res.locals.csrfToken = '12345';
  next();
});

app.use('/ic', recordRoutes);
app.use('/admin', userRoutes);
app.use('/admin', roleRoutes);
app.use('/admin', bUnitRoutes);
app.use('/grade', gradeRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.log('Error', error);
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    console.log('Connected...');

    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => {
    console.log(err);
  });
