const { validationResult } = require('express-validator');

const BusinessUnit = require('../models/business-unit');
const User = require('../models/user');
const Role = require('../models/role');
const Record = require('../models/record');
const { path } = require('express/lib/application');

const ITEMS_PER_PAGE = 10;

// @desc    Get page for adding a new record
// @route   GET /ic/add-record/:userId
// @access  Private
exports.getAddRecord = async (req, res, next) => {
  const page = +req.query.page || 1;
  const userId = req.params.userId;

  const messages = req.flash('errorVal')[0];

  try {
    const user = await User.findById(userId);
    const totalItems = await Record.find({ userId }).countDocuments();
    const records = await getRecords(userId, page, ITEMS_PER_PAGE);

    res.render('record/add-record', {
      pageTitle: 'Sankcije',
      path: '/record',
      editing: '',
      hasError: '',
      validationErrors: [],
      user: user,
      oldInput: '',
      errorMessage: messages,
      records: records,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Get page for editing a record
// @route   GET /ic/edit-record/:recordId
// @access  Private
exports.getEditRecord = async (req, res, next) => {
  const editMode = req.query.edit;

  if (!editMode) {
    return res.redirect('/ic/');
  }

  const page = +req.query.page || 1;

  const recordId = req.params.recordId;
  try {
    const rec = await Record.findById(recordId);
    const userId = rec.userId;
    const user = await User.findById(userId);

    rec.date = rec.date.substring(0, 10);

    const totalItems = await Record.find({ userId }).countDocuments();
    const records = await getRecords(userId, page, ITEMS_PER_PAGE);

    res.render('record/add-record', {
      pageTitle: 'Sankcije',
      path: '/record',
      editing: editMode,
      hasError: '',
      validationErrors: [],
      user: user,
      errorMessage: '',
      oldInput: '',
      records: records,
      record: rec,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Edit a record
// @route   POST /ic/edit-record
// @access  Private
exports.postEditRecord = async (req, res, next) => {
  const recordId = req.body.recordId;
  const updatedDate = req.body.date;
  const updatedDescription = req.body.description;
  const updatedAmount = req.body.amount;

  const errors = validationResult(req);

  try {
    // preći na mongoose update?
    const record = await Record.findById(recordId);
    if (!record) {
      return res.redirect('/');
    }

    const userId = record.userId;
    record.date = updatedDate;
    record.description = updatedDescription;
    record.amount = updatedAmount;

    if (!errors.isEmpty()) {
      const newErrors = errors.array();
      req.flash('error', newErrors);
      req.flash(
        'errorVal',
        'Izmjena nije snimljena, sva polja moraju biti popunjena!'
      );
      await req.session.save(() => {
        return res.redirect('/ic/add-record/' + userId);
      });
    }

    await record.save();
    res.redirect('/ic/add-record/' + userId);
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Submit a new record
// @route   POST /ic/add-record
// @access  Private
exports.postAddRecord = async (req, res, next) => {
  const date = req.body.date ? new Date(req.body.date).toISOString() : '';
  const description = req.body.description;
  const amount = req.body.amount;
  const userId = req.body.userId;
  const creator = req.session.user;

  const errors = validationResult(req);

  const page = +req.query.page || 1;

  if (!errors.isEmpty()) {
    const newErrors = errors.array().filter((er) => {
      return er.msg !== 'Invalid value';
    });

    const user = await User.findById(userId);
    const records = await getRecords(userId, page, ITEMS_PER_PAGE);
    const totalItems = await Record.find({ userId }).countDocuments();

    return res.status(422).render('record/add-record', {
      pageTitle: 'Sankcije',
      path: '/record',
      editing: '',
      hasError: '',
      records: records,
      validationErrors: errors.array(),
      user: user,
      errorMessage: newErrors[0].msg,
      oldInput: { date, description, amount },
      record: '',
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    });
  }

  const record = new Record({
    date,
    description,
    amount,
    creator,
    userId,
  });

  try {
    await record.save();
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
  res.redirect('/ic/add-record/' + userId);
};

// @desc    Employee search
// @route   POST /ic/record
// @access  Private
exports.getEmployees = async (req, res, next) => {
  const search = req.query.search;
  let users;

  if (search) {
    try {
      users = await User.fuzzySearch(search)
        .populate('role')
        .populate('businessUnit');

      if (Object.keys(users).length === 0 || !users) {
        return res.render('record/employee-search.ejs', {
          pageTitle: 'Sankcije',
          path: '/record',
          editing: '',
          hasError: true,
          errorMessage:
            'Korisnik pod traženim imenom ili prezimenom nije pronađen!',
          validationErrors: [],
          employees: users,
        });
      }

      res.render('record/employee-search.ejs', {
        pageTitle: 'Sankcije',
        path: '/record',
        editing: '',
        hasError: '',
        validationErrors: [],
        employees: users,
      });
    } catch (e) {
      console.log(e);
    }
  } else {
    res.render('record/employee-search.ejs', {
      pageTitle: 'Sankcije',
      path: '/record',
      editing: '',
      hasError: '',
      validationErrors: [],
      employees: [],
    });
  }
};

// @desc    Get page for record report per user
// @route   GET /ic/report/:userId
// @access  Private
exports.getReport = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const records = await Record.find({ userId }).sort({ date: 'desc' });

    records.map((r) => {
      const arrDate = r.date.split('T')[0].split('-');
      r.date = arrDate[2] + '.' + arrDate[1] + '.' + arrDate[0] + '.';
    });

    res.render('record/report', {
      pageTitle: 'Izvještaj',
      path: '/report',
      editing: '',
      hasError: '',
      validationErrors: [],
      records: records,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Get page for a full record report
// @route   GET /ic/report/:userId
// @access  Private
exports.getFullReport = async (req, res, next) => {
  res.render('record/full-report', {
    pageTitle: 'Zbirni izvještaj',
    path: '/full-report',
    editing: '',
    hasError: '',
    isData: true,
    validationErrors: [],
    data: '',
  });
};

// @desc    Generate a full report
// @route   GET /ic/fullreport
// @access  Private
exports.postFullReport = async (req, res, next) => {
  const fromDate = new Date(req.body.fromDate).toISOString();
  const toDate = new Date(req.body.toDate).toISOString();

  try {
    const users = await User.find({}).select(
      'id jmbg firstName lastName businessUnit'
    );

    const records = await Record.find({}).populate('userId');
    const sum = await Record.aggregate([
      {
        $match: {
          // filter to limit to whatever is of importance
          date: {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },
      { $group: { _id: '$userId', sum: { $sum: '$amount' } } },
    ]);

    const data = await User.populate(sum, { path: '_id' });
    const isData = data.length > 0 ? true : false;

    res.render('record/full-report', {
      pageTitle: 'Zbirni izvještaj',
      path: '/full-report',
      editing: '',
      hasError: '',
      isData: isData,
      date: { fDate: dateTransform(fromDate), tDate: dateTransform(toDate) },
      validationErrors: [],
      data: data,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Delete a record
// @route   POST /ic/delete-record/userId
// @access  Private
exports.deleteRecord = async (req, res, next) => {
  const recordId = req.params.recordId;
  try {
    await Record.deleteOne({ _id: recordId });
    res.status(200).json({ message: 'Success!' });
  } catch (e) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Get search for business units
// @route   GET /ic/multientry
// @access  Private
exports.entryPerBunit = async (req, res, next) => {
  const search = req.query.search;
  let bUnits;

  if (search) {
    try {
      bUnits = await BusinessUnit.fuzzySearch(search);

      // checks if result of query is empty
      if (Object.keys(bUnits).length === 0 || !bUnits) {
        return res.render('record/store-search', {
          pageTitle: 'Sankcije',
          path: '/multientry',
          employees: '',
          errorMessage: 'Prodavnica pod traženim imenom nije pronađena',
          bunits: bUnits,
          hasError: true,
        });
      }

      res.render('record/store-search', {
        pageTitle: 'Sankcije',
        path: '/multientry',
        employees: '',
        errorMessage: 'Prodavnica pod traženim imenom nije pronađena',
        bunits: bUnits,
        hasError: false,
      });
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  } else {
    res.render('record/store-search', {
      pageTitle: 'Sankcije',
      path: '/multientry',
      errorMessage: '',
      bunits: [],
      hasError: false,
    });
  }
};

// @desc    Get page for record entry per business unit
// @route   GET /ic/multientry
// @access  Private
exports.getBUnit = async (req, res, next) => {
  const bUnitId = req.params.bUnitId;

  try {
    const bUnit = await BusinessUnit.findById(bUnitId);
    if (!bUnit) {
      res.redirect('/');
    }

    const employees = await User.find({ businessUnit: bUnit._id })
      .populate('role')
      .sort({ role: 'asc' });

    res.render('record/add-record-per-bunit', {
      pageTitle: 'Sankcije',
      path: '/multientry',
      bunits: [],
      errorMessage: '',
      employees: employees,
      hasError: false,
      user: req.session.user,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Submit records per business unit
// @route   POST /ic/multientry
// @access  Private
exports.submitRecordPerBUnit = async (req, res, next) => {
  const date = req.body.date ? new Date(req.body.date).toISOString() : '';
  let employeeIds = req.body.employeeId;
  const creator = req.session.user;
  let successful = [];
  const failed = [];
  const records = [];

  if (!Array.isArray(employeeIds)) {
    employeeIds = [employeeIds];
  }

  // vratiti da nije unesen datum
  if (!date) return;

  employeeIds.forEach((e) => {
    const id = '_' + e;
    const amount = req.body[id][0];
    let description = req.body[id][1];

    if (amount === '0' || amount === '') return;
    if (amount !== '0' && description === '') {
      failed.push(e);
      return;
    }

    const record = new Record({
      date,
      description,
      amount,
      creator,
      userId: e,
    });

    records.push(record);
  });

  const unsuccessful = await User.find({ _id: { $in: failed } });
  const savedRecords = await Record.insertMany(records);
  const result = [];

  savedRecords.forEach((r) => {
    result.push(r.userId);
  });

  successful = await User.find({ _id: { $in: result } });

  // dodati i koje su sankcije unesene opis i iznos

  return res.render('record/record-created', {
    pageTitle: 'Sankcije',
    path: '/multientry',
    errorMessage: '',
    hasError: false,
    failed: unsuccessful,
    successful: successful,
  });
};

// util function search record & date formatting
async function getRecords(userId, page, ITEMS_PER_PAGE) {
  const records = await Record.find({ userId })
    .sort({ date: 'desc' })
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);

  records.map((r) => {
    const arrDate = r.date.split('T')[0].split('-');
    r.date = arrDate[2] + '.' + arrDate[1] + '.' + arrDate[0] + '.';
  });

  return records;
}

// util function for date transformation
function dateTransform(date) {
  const arrDate = date.split('T')[0].split('-');
  date = arrDate[2] + '.' + arrDate[1] + '.' + arrDate[0] + '.';
  return date;
}
