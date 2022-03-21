const { validationResult } = require('express-validator');

const Role = require('../models/role');

// get za dodavanje funkcije
exports.getAddRole = async (req, res, next) => {
  const message = req.flash('success');

  try {
    const roles = await Role.find({});

    res.render('role/edit-role', {
      pageTitle: 'Kreiranje fukncije',
      path: '/role',
      editing: false,
      hasError: false,
      validationErrors: [],
      message: message,
      roles: roles,
      oldInput: '',
      errorMessage: '',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// post za dodavanje funkcije
exports.postAddRole = async (req, res, next) => {
  const desc = req.body.role;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const newErrors = errors.array().filter((er) => {
      console.log(er);
      return er.msg !== 'Invalid value';
    });

    try {
      const roles = await Role.find({});

      return res.render('role/edit-role', {
        pageTitle: 'Kreiranje funckije',
        path: '/role',
        editing: false,
        hasError: true,
        message: {},
        roles: roles,
        validationErrors: errors.array(),
        oldInput: { desc },
        errorMessage: newErrors[0].msg,
      });
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }

  try {
    const role = new Role({ role: desc });
    await role.save();
    req.flash('success', 'Funkcija uspješno kreirana!');
    await req.session.save(() => {
      return res.redirect('/admin/add-role');
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// get za izmjenu funkcije
exports.getEditRole = async (req, res, next) => {
  const roleId = req.params.roleId;

  try {
    const role = await Role.findById(roleId);
    const roles = await Role.find({});

    res.render('role/edit-role', {
      pageTitle: 'Kreiranje fukncije',
      path: '/role',
      editing: true,
      hasError: false,
      validationErrors: [],
      message: {},
      roles: roles,
      oldInput: { desc: role.role, roleId: role._id },
      errorMessage: '',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// post za izmjenu funkcije
exports.postEditRole = async (req, res, next) => {
  const role = req.body.role;
  const roleId = req.body.roleId;
  const errors = validationResult(req);

  try {
    if (!roleId) {
      return res.redirect('/admin/add-role');
    }

    if (!errors.isEmpty()) {
      const newErrors = errors.array().filter((er) => {
        console.log(er);
        return er.msg !== 'Invalid value';
      });

      const roles = await Role.find({});
      return res.render('role/edit-role', {
        pageTitle: 'Kreiranje fukncije',
        path: '/role',
        editing: true,
        hasError: false,
        validationErrors: errors.array(),
        message: {},
        roles: roles,
        oldInput: {},
        errorMessage: newErrors[0].msg,
      });
    }

    await Role.findByIdAndUpdate(roleId, { role });
    const roles = await Role.find({});

    res.render('role/edit-role', {
      pageTitle: 'Kreiranje fukncije',
      path: '/role',
      editing: true,
      hasError: false,
      validationErrors: [],
      message: 'Izmjena uspješno snimljena',
      roles: roles,
      oldInput: { desc: role.role },
      errorMessage: '',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
