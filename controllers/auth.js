const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    validationErrors: [],
    errorMessage: '',
    oldInput: { username: '', password: '' },
    // csrfToken: req.csrfToken(),
  });
};

exports.postLogin = async (req, res, next) => {
  const username = req.body.username.toLowerCase();
  const password = req.body.password;

  try {
    const user = await User.findOne({ username: username }).populate('role');
    if (!user) {
      return res.status(404).render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        validationErrors: [{ param: 'username' }],
        errorMessage: 'Pogrešan username!',
        oldInput: { username, password },
      });
    }
    if (password !== user.password) {
      return res.status(422).render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        validationErrors: [{ param: 'password' }],
        errorMessage: 'Pogrešan password!',
        oldInput: { username, password },
      });
    }

    const route = getIndexRoute(user.role.role);
    req.session.save((err) => {
      req.session.isLoggedIn = true;
      req.session.user = user;
      req.session.save(async (err) => {
        if (route === 'access-denied') {
          return res.status(422).render('access-denied', {
            pageTitle: 'Pristup odbijen',
            path: '',
            isAuthenticated: true,
          });
        }
        if (user.password === '0000') {
          const retrivedUser = await User.findById(user._id).populate('role');

          if (!retrivedUser) {
            return res.redirect('/');
          }

          return res.render('user/change-password', {
            pageTitle: 'Promjena password',
            path: 'change-password',
            validationErrors: [],
            errorMessage: '',
            obligatory: true,
            role: retrivedUser.role.role,
            message: 'Password uspješno izmijenjen!',
          });
        }
        res.redirect(route);
      });
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postLogout = (req, res, next) => {
  res.clearCookie('_csrf');
  req.session.cookie = {};
  res.locals.csrfToken = '';
  req.session.destroy((err) => {
    res.redirect('/login');
  });
};

function getIndexRoute(role) {
  let indexRoute = '';
  switch (role) {
    case 'Interna kontrola':
      indexRoute = '/ic/record';
      break;
    case 'Admin':
      indexRoute = '/grade/grade-full-report/';
      break;
    case 'Šef':
      indexRoute = '/grade/';
      break;
    case 'Zamjenik':
      indexRoute = '/grade/';
      break;
    default:
      indexRoute = 'access-denied';
  }

  return indexRoute;
}
