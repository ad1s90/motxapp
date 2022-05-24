const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const recordController = require('../controllers/record');
const isAuth = require('../middleware/is-auth');
const passwordCheck = require('../middleware/password-check');

router.get(
  '/add-record/:userId',
  isAuth('Interna kontrola'),
  recordController.getAddRecord
);

router.get(
  '/edit-record/:recordId',
  isAuth('Interna kontrola'),
  recordController.getEditRecord
);

router.get(
  '/report/:userId',
  isAuth('Interna kontrola'),
  recordController.getReport
);

router.get(
  '/fullreport',
  isAuth('Interna kontrola'),
  recordController.getFullReport
);

router.get(
  '/multientry',
  isAuth('Interna kontrola'),
  recordController.entryPerBunit
);

router.get(
  '/multientry/:bUnitId',
  isAuth('Interna kontrola'),
  recordController.getBUnit
);

router.post(
  '/multientry',
  isAuth('Interna kontrola'),
  recordController.submitRecordPerBUnit
);

router.post(
  '/fullreport',
  isAuth('Interna kontrola'),
  recordController.postFullReport
);

router.post(
  '/add-record',
  [
    body('amount')
      .notEmpty()
      .isNumeric()
      .withMessage('Iznos mora biti broj')
      .trim(),
    body('description')
      .notEmpty()
      .withMessage('Opis ne može biti prazan')
      .trim(),
    body('date')
      .notEmpty()
      .isDate()
      .withMessage('Datum treba da u formatu mm/dd/yyyy')
      .trim(),
  ],
  isAuth('Interna kontrola'),
  recordController.postAddRecord
);

router.post(
  '/edit-record',
  [
    body('amount')
      .notEmpty()
      .isNumeric()
      .withMessage('Iznos mora biti broj')
      .trim(),
    body('description')
      .notEmpty()
      .withMessage('Opis ne može biti prazan')
      .trim(),
    body('date')
      .notEmpty()
      .isDate()
      .withMessage('Datum treba da u formatu mm.dd.yyyy')
      .trim(),
  ],
  isAuth('Interna kontrola'),
  recordController.postEditRecord
);

router.delete(
  '/report/:recordId',
  isAuth('Interna kontrola'),
  recordController.deleteRecord
);

router.get(
  '/record',
  isAuth('Interna kontrola'),
  recordController.getEmployees
);

module.exports = router;
