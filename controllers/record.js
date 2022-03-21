const { validationResult } = require('express-validator');

const BusinessUnit = require('../models/business-unit');
const User = require('../models/user');
const Role = require('../models/role');
const Record = require('../models/record');

const ITEMS_PER_PAGE = 10;

// get za dodavanje sankcije
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

// get za izmjenu sankcije
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

// post funckija za submit izmjene sankcije
exports.postEditRecord = async (req, res, next) => {
  const recordId = req.body.recordId;
  const updatedDate = req.body.date;
  const updatedDescription = req.body.description;
  const updatedAmount = req.body.amount;

  const errors = validationResult(req);

  try {
    // ubaciti šta ako nema recorda?
    // preći na mongoose update?
    const record = await Record.findById(recordId);
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

// Dodaje novu sankciju
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

// search uposlenika
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

// izvještaj sankcija za korisnika
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

// zbirni izvještaj get page
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

// generisanje zbirnog izvještaja
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

// brisanje sankcije
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

// search regex
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// pomoćna fukncija za traženje sankcije i formiratiranje datuma
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

function dateTransform(date) {
  const arrDate = date.split('T')[0].split('-');
  date = arrDate[2] + '.' + arrDate[1] + '.' + arrDate[0] + '.';
  return date;
}
