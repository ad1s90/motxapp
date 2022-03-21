const { validationResult } = require('express-validator');
const BusinessUnit = require('../models/business-unit');

// get za dodavanje prodavnicve
exports.getBUnit = async (req, res, next) => {
  const message = req.flash('success');

  try {
    const bUnits = await BusinessUnit.find({}).sort({ number: 1 });

    res.render('business-unit/edit-business-unit', {
      pageTitle: 'Kreiranje prodavnice',
      path: '/bunit',
      editing: false,
      hasError: false,
      validationErrors: [],
      message: message,
      user: {},
      bUnits: bUnits,
      oldInput: '',
      errorMessage: '',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// post za dodavanje prodavnice
exports.postAddBUnit = async (req, res, next) => {
  const bUnitName = req.body.name;
  const bUnitNumber = req.body.number;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const newErrors = errors.array().filter((er) => {
      console.log(er);
      return er.msg !== 'Invalid value';
    });

    try {
      const bUnits = await BusinessUnit.find({}).sort({ number: 1 });

      return res.render('business-unit/edit-business-unit', {
        pageTitle: 'Kreiranje funckije',
        path: '/bunit',
        editing: false,
        hasError: true,
        message: {},
        validationErrors: errors.array(),
        bUnits: bUnits,
        user: {},
        oldInput: { bUnitName, bUnitNumber },
        errorMessage: newErrors[0].msg,
      });
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }

  try {
    const bUnit = new BusinessUnit({ name: bUnitName, number: bUnitNumber });
    await bUnit.save();
    req.flash('success', 'Prodavnica uspješno kreirana!');
    await req.session.save(() => {
      return res.redirect('/admin/add-bunit');
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// get za izmjenu prodavnice
exports.getEditBUnit = async (req, res, next) => {
  const bUnitId = req.params.bUnitId;

  try {
    const bUnit = await BusinessUnit.findById(bUnitId);
    const bUnits = await BusinessUnit.find({}).sort({ number: 1 });

    res.render('business-unit/edit-business-unit', {
      pageTitle: 'Izmjena prodavnice',
      path: '/bunit',
      editing: true,
      hasError: false,
      validationErrors: [],
      message: {},
      bUnits: bUnits,
      oldInput: {
        bUnitName: bUnit.name,
        bUnitNumber: bUnit.number,
        bUnitId: bUnit._id,
      },
      errorMessage: '',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// post za izmjenu prodavnice
exports.postEditBUnit = async (req, res, next) => {
  const bUnitName = req.body.name;
  const bUnitNumber = req.body.number;
  const bUnitId = req.body.bUnitId;
  const errors = validationResult(req);

  try {
    if (!bUnitId) {
      return res.redirect('/admin/add-bunit');
    }

    if (!errors.isEmpty()) {
      const newErrors = errors.array().filter((er) => {
        console.log(er);
        return er.msg !== 'Invalid value';
      });
      const bUnits = await BusinessUnit.find({}).sort({ number: 1 });
      return res.render('business-unit/edit-business-unit', {
        pageTitle: 'Kreiranje prodavnice',
        path: '/bunit',
        editing: true,
        hasError: false,
        validationErrors: errors.array(),
        message: {},
        bUnits: bUnits,
        oldInput: {},
        errorMessage: newErrors[0].msg,
      });
    }

    await BusinessUnit.findByIdAndUpdate(bUnitId, {
      name: bUnitName,
      number: bUnitNumber,
    });
    const bUnits = await BusinessUnit.find({}).sort({ number: 1 });

    res.render('business-unit/edit-business-unit', {
      pageTitle: 'Kreiranje prodavnice',
      path: '/bunit',
      editing: false,
      hasError: false,
      validationErrors: [],
      message: 'Izmjena uspješno snimljena',
      bUnits: bUnits,
      oldInput: {},
      errorMessage: '',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
