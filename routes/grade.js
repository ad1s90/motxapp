const express = require('express');
const { body } = require('express-validator');

const router = express.Router();
const gradeController = require('../controllers/grade');
const isAuth = require('../middleware/is-auth');
const Grade = require('../models/grade');

router.get('/', isAuth('Šef', 'Zamjenik'), gradeController.getAddGrades);

router.post(
  '/add-grade',
  [
    body('userId').custom(async (value, { req }) => {
      const grade = await Grade.find({ creator: value })
        .sort({ createdAt: -1 })
        .limit(1);

      if (grade.length > 0) {
        const oneDay = 1000 * 60 * 60 * 24;
        const createdAt = new Date(grade[0].createdAt);
        const dateNow = new Date();

        const diffInTime = dateNow.getTime() - createdAt.getTime();
        const diffInDays = Math.round(diffInTime / oneDay);

        if (diffInDays < 25) {
          return Promise.reject(
            `Ocjene su već unesene, molimo Vas da pokušate za ${
              25 - diffInDays
            } dana!`
          );
        }
      }
    }),
  ],
  isAuth('Šef', 'Zamjenik'),
  gradeController.postAddGrades
);

router.get(
  '/grade-full-report',
  isAuth('Admin'),
  gradeController.getGradeReport
);

router.post(
  '/grade-full-report',
  isAuth('Admin'),
  gradeController.postGradeReport
);

router.get('/report/:userId', isAuth('Admin'), gradeController.getUserReport);

router.get(
  '/grade-entry-report',
  isAuth('Admin'),
  gradeController.getGradeEntryPerUser
);

router.get(
  '/grade-entry-report/:employeeId',
  isAuth('Admin'),
  gradeController.getGradeEntry
);

router.post(
  '/delete-grade-entry',
  isAuth('Admin'),
  gradeController.postDeleteGradeEntry
);

module.exports = router;
