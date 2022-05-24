const { validationResult } = require('express-validator');
const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');

const Role = require('../models/role');
const BusinessUnit = require('../models/business-unit');
const User = require('../models/user');

// @desc    Get page for adding a new user
// @route   GET /admin/
// @access  Private
exports.getAddUser = async (req, res, next) => {
  try {
    const roles = await Role.find({});
    const stores = await BusinessUnit.find({});

    res.render('user/edit-user', {
      pageTitle: 'Korisnik',
      path: '/user',
      editing: false,
      hasError: false,
      validationErrors: [],
      user: {},
      oldInput: '',
      errorMessage: '',
      stores: stores,
      roles: roles,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Get a page for edit a user
// @route   GET /admin/edit-user/:userId
// @access  Private
exports.getEditUser = async (req, res, next) => {
  const editMode = req.query.edit;
  const userId = req.params.userId;

  // ne treba?
  const messages = req.flash('errorVal')[0];

  if (!editMode) {
    return res.redirect('/admin/');
  }

  try {
    const user = await User.findById(userId)
      .populate('role')
      .populate('businessUnit');
    const roles = await Role.find({});
    const stores = await BusinessUnit.find({});

    res.render('user/edit-user', {
      pageTitle: 'Korisnik',
      path: '/user',
      editing: true,
      hasError: false,
      validationErrors: [],
      errorMessage: messages,
      user: user,
      oldInput: '',
      errorMessage: '',
      stores: stores,
      roles: roles,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Submit a user change
// @route   POST /admin/edit-user
// @access  Private
exports.postEditUser = async (req, res, next) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const jmbg = req.body.jmbg;
  const businessUnit = req.body.businessUnit;
  const role = req.body.role;
  const startDate = req.body.startDate;
  const username = req.body.username;
  const isActive = req.body.isActive === undefined ? true : false;
  const password = req.body.password;
  const userId = req.body.userId;

  const errors = validationResult(req);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect('/');
    }

    // mislim da ne treba?
    user.firstName = firstName;
    user.lastName = lastName;
    user.jmbg = jmbg;
    user.businessUnit = businessUnit;
    user.role = role;
    user.startDate = startDate;
    user.username = username;
    user.isActive = isActive;
    user.password = password;

    if (!errors.isEmpty()) {
      const newErrors = errors.array().filter((er) => {
        console.log(er);
        return er.msg !== 'Invalid value';
      });

      const roles = await Role.find({});
      const stores = await BusinessUnit.find({});

      return res.render(`user/edit-user`, {
        pageTitle: 'Korisnik',
        path: '/user',
        editing: true,
        hasError: true,
        validationErrors: errors.array(),
        user: { _id: userId, role, businessUnit },
        oldInput: {
          firstName,
          lastName,
          jmbg,
          businessUnit,
          role,
          startDate,
          username,
          password,
        },
        errorMessage: newErrors[0].msg,
        stores: stores,
        roles: roles,
      });
    }

    await User.findByIdAndUpdate(userId, {
      firstName,
      lastName,
      jmbg,
      businessUnit,
      role,
      startDate,
      username,
      password,
      isActive,
    });

    // optimizirati?
    const savedUser = await User.find({ jmbg })
      .populate('role')
      .populate('businessUnit');

    return res.render('user/user-created', {
      pageTitle: 'Korisnik',
      path: '/user',
      editing: true,
      user: savedUser,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Submit a new user
// @route   POST /admin/add-user
// @access  Private
exports.postAddUser = async (req, res, next) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const jmbg = req.body.jmbg;
  const businessUnit = req.body.businessUnit;
  const role = req.body.role;
  const startDate = req.body.startDate;
  const username = await ifUsernameExists(
    firstName.toLowerCase() + '.' + lastName.toLowerCase()
  );

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const newErrors = errors.array().filter((er) => {
      console.log(er);
      return er.msg !== 'Invalid value';
    });

    const roles = await Role.find({});
    const stores = await BusinessUnit.find({});

    return res.render('user/edit-user', {
      pageTitle: 'Dodavanje korisnika',
      path: '/user',
      editing: false,
      hasError: false,
      validationErrors: errors.array(),
      user: {},
      oldInput: { firstName, lastName, jmbg, businessUnit, role, startDate },
      errorMessage: newErrors[0].msg,
      stores: stores,
      roles: roles,
    });
  }

  const user = new User({
    firstName,
    lastName,
    password: '0000',
    username: username,
    role,
    jmbg,
    businessUnit,
    startDate,
    isActive: true,
  });

  try {
    await user.save();
    const savedUser = await User.find({ jmbg })
      .populate('role')
      .populate('businessUnit');
    res.render('user/user-created', {
      pageTitle: 'Dodavanje korisnika',
      editing: false,
      path: '/user',
      user: savedUser,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Get a user search page
// @route   GET /admin/user
// @access  Private
exports.getUser = async (req, res, next) => {
  const search = req.query.search;
  let users;
  try {
    if (search) {
      users = await User.fuzzySearch(search)
        .populate('role')
        .populate('businessUnit');
    }
    res.render('user/user-search', {
      pageTitle: 'Pretraga korisnika',
      path: '/user-search',
      user: users,
      hasError: '',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Get a password change page
// @route   GET /change-password
// @access  Private
exports.getChangePassword = async (req, res, next) => {
  const user = req.session.user;
  try {
    const retrivedUser = await User.findById(user._id).populate('role');

    if (!retrivedUser) {
      return res.redirect('/');
    }

    res.render('user/change-password', {
      pageTitle: 'Promjena password',
      path: '/change-password',
      validationErrors: [],
      errorMessage: '',
      obligatory: false,
      role: retrivedUser.role.role,
      message: '',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Submit a password change
// @route   POST /change-password
// @access  Private
exports.postChangePassword = async (req, res, next) => {
  const user = req.session.user;
  const password = req.body.password;

  const errors = validationResult(req);

  if (!user) {
    return res.render('access-denied', {
      pageTitle: 'Pristup odbijen',
      path: '',
    });
  }
  try {
    const retrivedUser = await User.findById(user._id).populate('role');

    if (!errors.isEmpty()) {
      const newErrors = errors.array().filter((er) => {
        console.log(er);
        return er.msg !== 'Invalid value';
      });

      return res.render('user/change-password', {
        pageTitle: 'Promjena password',
        path: '/change-password',
        validationErrors: errors.array(),
        errorMessage: newErrors[0].msg,
        obligatory: false,
        role: retrivedUser.role.role,
        message: '',
      });
    }

    if (!retrivedUser) {
      return res.render('access-denied', {
        pageTitle: 'Pristup odbijen',
        path: '',
      });
    }
    retrivedUser.password = password;
    await retrivedUser.save();

    return res.render('user/change-password', {
      pageTitle: 'Promjena password',
      path: '/change-password',
      validationErrors: [],
      errorMessage: '',
      obligatory: false,
      role: retrivedUser.role.role,
      message: 'Password uspješno izmijenjen!',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// Helper function to check if username exists and handle that case
async function ifUsernameExists(username) {
  try {
    const ifExists = await User.findOne({ username });
    let newUsername = username;

    if (ifExists) {
      newUsername = username + new Date().getMilliseconds();
    }

    return newUsername;
  } catch (e) {
    console.log(e);
  }
}
