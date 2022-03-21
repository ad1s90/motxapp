const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const recordController = require('../controllers/record');
const isAuth = require('../middleware/is-auth');

// get za dodavanje sankcije

router.get(
  '/add-record/:userId',
  isAuth('Interna kontrola'),
  recordController.getAddRecord
);

// get za izmjenu sankcije
router.get(
  '/edit-record/:recordId',
  isAuth('Interna kontrola'),
  recordController.getEditRecord
);

// izvještaj sankcija za korisnika
router.get(
  '/report/:userId',
  isAuth('Interna kontrola'),
  recordController.getReport
);

// get zbirni izvještaj
router.get(
  '/fullreport',
  isAuth('Interna kontrola'),
  recordController.getFullReport
);

// post zbirni izvještaj
router.post(
  '/fullreport',
  isAuth('Interna kontrola'),
  recordController.postFullReport
);

// post za dodvanje sankcije
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

// post za izmjenu sankcije
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

// brisanje sankcije
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
