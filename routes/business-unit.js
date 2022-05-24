const express = require('express');
const { body } = require('express-validator');

const bUnitController = require('../controllers/bussines-unit');
const BusinessUnit = require('../models/business-unit');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/add-bunit', isAuth('Admin'), bUnitController.getBUnit);

router.get(
  '/edit-bunit/:bUnitId',
  isAuth('Admin'),
  bUnitController.getEditBUnit
);

router.post(
  '/add-bunit',
  [
    body('name')
      .notEmpty()
      .withMessage('Naziv prodavnice ne može biti prazan')
      .trim()
      .custom(async (value, { req }) => {
        const bUnitName = await BusinessUnit.findOne({ name: req.body.name });
        if (bUnitName) {
          return Promise.reject('Prodavnica sa odabranim imenom postoji!');
        }
      }),
    body('number')
      .notEmpty()
      .withMessage('Broj prodavnice ne može biti prazan')
      .trim()
      .custom(async (value, { req }) => {
        const bUnitNumber = await BusinessUnit.findOne({
          number: req.body.number,
        });
        if (bUnitNumber) {
          return Promise.reject('Prodavnica sa odabranim brojem već postoji!');
        }
      }),
  ],
  isAuth('Admin'),
  bUnitController.postAddBUnit
);

router.post(
  '/edit-bunit',
  [
    body('name')
      .notEmpty()
      .withMessage('Naziv prodavnice ne može biti prazan')
      .trim()
      .custom(async (value, { req }) => {
        const bUnitName = await BusinessUnit.findOne({ name: req.body.name });
        if (bUnitName && req.body.bUnitId !== bUnitName._id.toString()) {
          return Promise.reject(
            'Prodavnica sa odabranim imenom postoji! Molimo Vas da ponovo odaberete prodavnicu na kojoj želite praviti izmjene.'
          );
        }
      }),
    body('number')
      .notEmpty()
      .withMessage('Broj prodavnice ne može biti prazan')
      .trim()
      .custom(async (value, { req }) => {
        const bUnitNumber = await BusinessUnit.findOne({
          number: req.body.number,
        });
        if (bUnitNumber && req.body.bUnitId !== bUnitNumber._id.toString()) {
          return Promise.reject(
            'Prodavnica sa odabranim brojem već postoji! Molimo Vas da ponovo odaberete prodavnicu na kojoj želite praviti izmjene.'
          );
        }
      }),
  ],
  isAuth('Admin'),
  bUnitController.postEditBUnit
);

module.exports = router;
