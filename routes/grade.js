const express = require('express');
const { body } = require('express-validator');

const router = express.Router();
const gradeController = require('../controllers/grade');
const isAuth = require('../middleware/is-auth');
const Grade = require('../models/grade');

// get za dodavanje ocjena
router.get('/', isAuth('Šef', 'Zamjenik'), gradeController.getAddGrades);

// post za dodavanje ocjene
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

// get za puni izvještaj
router.get('/grade-full-report', gradeController.getGradeReport);

// post za puni izvještaj
router.post('/grade-full-report', gradeController.postGradeReport);

// get za izvještaj po useru
router.get('/report/:userId', gradeController.getUserReport);

// get za izvještaj unosa ocjena
router.get('/grade-entry-report', gradeController.getGradeEntryPerUser);

// post za izvještaj unosa
router.get('/grade-entry-report/:employeeId', gradeController.getGradeEntry);

// post za brisanje entrija
router.post('/delete-grade-entry', gradeController.postDeleteGradeEntry);

module.exports = router;
