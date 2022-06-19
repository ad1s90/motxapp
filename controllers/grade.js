const { validationResult } = require('express-validator');

const User = require('../models/user');
const Grade = require('../models/grade');

// @desc    Get page for adding a new grade - for supervisor
// @route   GET /grade
// @access  Private
exports.getAddGrades = async (req, res, next) => {
  const supervisor = req.session.user;

  try {
    const employees = await User.find({
      businessUnit: supervisor.businessUnit,
      isActive: true,
    });

    const newEmp = employees.filter((e) => {
      return e._id.toString() !== supervisor._id.toString();
    });

    return res.render('grade/add-grade', {
      pageTitle: 'Ocjene',
      path: '/grades',
      validationErrors: [{}],
      errorMessage: '',
      oldInput: {},
      user: supervisor,
      employees: newEmp,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Submit grades
// @route   POST /add-grade
// @access  Private
exports.postAddGrades = async (req, res, next) => {
  let employeeIds = req.body.employeeId;
  const creator = req.body.userId;
  let result = true;
  const errors = validationResult(req);

  if (!Array.isArray(employeeIds)) {
    employeeIds = [employeeIds];
  }

  if (!errors.isEmpty()) {
    const newErrors = errors.array().filter((er) => {
      console.log(er);
      return er.msg !== 'Invalid value';
    });
    const supervisor = req.session.user;

    try {
      const employees = await User.find({
        businessUnit: supervisor.businessUnit,
        isActive: true,
      });

      const newEmp = employees.filter((e) => {
        return e._id.toString() !== supervisor._id.toString();
      });

      return res.render('grade/add-grade', {
        pageTitle: 'Ocjene',
        path: '/grades',
        validationErrors: [{}],
        errorMessage: newErrors[0].msg,
        oldInput: {},
        user: supervisor,
        employees: newEmp,
      });
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }

  try {
    const supervisorData = await User.findById(creator).populate('role');

    console.log(supervisorData);

    employeeIds.forEach(async (e) => {
      const id = '_' + e;
      const expedity = req.body[id][0];
      const expertise = req.body[id][1];
      const willingness = req.body[id][2];
      const helpfulness = req.body[id][3];
      const comment =
        req.body[id][4].length > 0
          ? supervisorData.firstName +
            ' ' +
            supervisorData.lastName +
            ' (' +
            supervisorData.role.role +
            '): ' +
            req.body[id][4]
          : '';

      if (!expedity || !expertise || !willingness || !helpfulness) {
        result = false;
      }

      const grade = new Grade({
        creator,
        employeeId: e,
        expedity,
        expertise,
        willingness,
        helpfulness,
        comment,
      });
      if (result) {
        await grade.save();
      }
    });
    if (!result) {
      return res.render('grade-error', {
        pageTitle: 'Error',
        path: '/grades',
      });
    }

    return res.render('grade/grade-created', {
      pageTitle: 'Ocjene',
      path: '/grades',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Get page for full report - admin
// @route   GET /grade/grade-full-report
// @access  Private
exports.getGradeReport = async (req, res, next) => {
  res.render('grade/grade-full-report', {
    pageTitle: 'Ocjene',
    path: '/grades',
    hasError: '',
    validationErrors: [],
    date: {},
    data: '',
    isData: false,
  });
};

// @desc    Submit for full report
// @route   POST /grade/grade-full-report
// @access  Private
exports.postGradeReport = async (req, res, next) => {
  const fromDate = new Date(req.body.fromDate).toISOString();
  const toDate = new Date(req.body.toDate).toISOString();

  try {
    const data = await Grade.find({}).populate(
      'employeeId creator',
      'firstName lastName jmbg'
    );

    const avg = await Grade.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(fromDate),
            $lte: new Date(toDate),
          },
        },
      },
      {
        $group: {
          _id: '$employeeId',
          comment: { $push: '$comment' },
          expedity: { $avg: '$expedity' },
          expertise: { $avg: '$expertise' },
          willingness: { $avg: '$willingness' },
          helpfulness: { $avg: '$helpfulness' },
        },
      },
      {
        $addFields: {
          roundedExpedity: { $round: ['$expedity', 2] },
          roundedExpertise: { $round: ['$expertise', 2] },
          roundedWillingness: { $round: ['$willingness', 2] },
          roundedHelpfulness: { $round: ['$helpfulness', 2] },
        },
      },
    ]);

    const newData = await User.populate(avg, { path: '_id' });

    res.render('grade/grade-full-report', {
      pageTitle: 'Ocjene',
      path: '/grades',
      hasError: '',
      validationErrors: [],
      date: { fDate: dateTransform(fromDate), tDate: dateTransform(toDate) },
      data: newData,
      isData: true,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Get page for a grade report per user - admin
// @route   GET /grade/report/:userId
// @access  Private
exports.getUserReport = async (req, res, next) => {
  const userId = req.params.userId;

  try {
    const grades = await Grade.find({ employeeId: userId })
      .populate({ path: 'creator', populate: { path: 'role' } })
      .sort({ createdAt: -1 });
    grades.map((g) => {
      g.formatedDate = dateTransform(g.createdAt.toISOString());
    });

    res.render('grade/grade-user-report', {
      pageTitle: 'Ocjene',
      path: '/grades',
      hasError: '',
      grades: grades,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Get page for a grade entry - admin
// @route   GET /grade/grade-entry-report
// @access  Private
exports.getGradeEntryPerUser = async (req, res, next) => {
  const search = req.query.search;
  let users;
  try {
    if (search) {
      users = await User.fuzzySearch(search)
        .populate('role')
        .populate('businessUnit');
    }

    res.render('grade/grade-entry-search', {
      pageTitle: 'Ocjene',
      path: '/entry-search',
      hasError: '',
      validationErrors: [],
      user: users,
      isData: true,
      data: {},
    });
  } catch (err) {
    const error = new Error(err);
    err.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Submit for a grade entry report - admin
// @route   POST /grade/grade-entry-report
// @access  Private
exports.getGradeEntry = async (req, res, next) => {
  const employeeId = req.params.employeeId;

  try {
    const dates = await Grade.find({ creator: employeeId }).distinct(
      'createdAt'
    );

    const user = await User.findById(employeeId).populate('role');
    dates.map((d) => {
      d.date = d.toString();
      d.formatedDate = dateTransform(d.toISOString());
    });

    res.render('grade/grade-entry-report', {
      pageTitle: 'Ocjene',
      path: '/entry-search',
      hasError: '',
      validationErrors: [],
      dates: dates,
      user: user,
      isData: true,
      data: {},
    });
  } catch (err) {
    const error = new Error(err);
    err.httpStatusCode = 500;
    return next(error);
  }
};

// @desc    Delete grade entry - admin
// @route   POST /grade/delete-grade-entry
// @access  Private
exports.postDeleteGradeEntry = async (req, res, next) => {
  const employeeId = req.body.employeeId;
  const createdAt = req.body.createdAt;

  try {
    await Grade.deleteMany({ creator: employeeId, createdAt: createdAt });

    const grades = await Grade.find({ creator: employeeId });

    const filteredGrades = grades.filter((g) => {
      return g.createdAt.toString() === createdAt;
    });

    filteredGrades.forEach(async (g) => {
      await Grade.deleteOne({ _id: g._id });
    });

    const dates = await Grade.find({ creator: employeeId }).distinct(
      'createdAt'
    );

    const user = await User.findById(employeeId).populate('role');
    dates.map((d) => {
      d.formatedDate = dateTransform(d.toISOString());
    });

    res.render('grade/grade-entry-report', {
      pageTitle: 'Ocjene',
      path: '/entry-search',
      hasError: '',
      validationErrors: [],
      dates: dates,
      user: user,
      isData: true,
      data: {},
    });
  } catch (err) {
    const error = new Error(err);
    err.httpStatusCode = 500;
    return next(error);
  }
};

// Helper function for date transformation
function dateTransform(date) {
  const arrDate = date.split('T')[0].split('-');
  date = arrDate[2] + '.' + arrDate[1] + '.' + arrDate[0] + '.';
  return date;
}
