const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const userController = require('../controllers/user');
const BusinessUnit = require('../models/business-unit');
const Role = require('../models/role');
const User = require('../models/user');
const isAuth = require('../middleware/is-auth');

router.get('/', isAuth('Admin'), userController.getAddUser);

router.get('/user', isAuth('Admin'), userController.getUser);

router.get('/edit-user/:userId', isAuth('Admin'), userController.getEditUser);

router.post(
  '/add-user',
  [
    body('firstName')
      .notEmpty()
      .trim()
      .withMessage('Polje ime mora biti popunjeno!'),
    body('lastName')
      .notEmpty()
      .trim()
      .withMessage('Polje prezime mora biti popunjeno!'),
    body(
      'jmbg',
      'Polje jmbg mora biti popunjeno brojem koji sadrži minimalno 13 cifri!'
    )
      .isNumeric()
      .isLength({ min: 13 })
      .notEmpty()
      .trim()
      .custom(async (value, { req }) => {
        const user = await User.findOne({ jmbg: value });
        if (user) {
          return Promise.reject('Korisnik sa odabranim JMBG već postoji!');
        }
      }),
    body('startDate')
      .notEmpty()
      .isDate()
      .withMessage('Datum treba da u formatu mm/dd/yyyy')
      .trim(),
    body('businessUnit').custom(async (value, { req }) => {
      const bUnit = await BusinessUnit.findById(value);
      if (!bUnit) {
        return Promise.reject('Molimo Vas odaberite poslovnu jedinicu.');
      }
    }),
    body('role').custom(async (value, { req }) => {
      const role = await Role.findById(value);
      if (!role) {
        return Promise.reject('Molimo Vas odaberite funkciju.');
      }
    }),
  ],
  isAuth('Admin'),
  userController.postAddUser
);

router.post(
  '/edit-user',
  [
    body('firstName')
      .notEmpty()
      .trim()
      .withMessage('Polje ime mora biti popunjeno!'),
    body('lastName')
      .notEmpty()
      .trim()
      .withMessage('Polje prezime mora biti popunjeno!'),
    body('username')
      .notEmpty()
      .trim()
      .withMessage('Polje prezime mora biti popunjeno!')
      .custom(async (value, { req }) => {
        const user = await User.findOne({ username: value });
        if (user && user._id.toString() !== req.body.userId) {
          return Promise.reject(
            'Korisnik sa odabranim korisničkim imenom već postoji!'
          );
        }
      }),
    body('password')
      .notEmpty()
      .trim()
      .withMessage('Polje prezime mora biti popunjeno!'),
    body(
      'jmbg',
      'Polje jmbg mora biti popunjeno brojem koji sadrži minimalno 13 cifri!'
    )
      .isNumeric()
      .isLength({ min: 13 })
      .notEmpty()
      .trim()
      .custom(async (value, { req }) => {
        const user = await User.findOne({ jmbg: value });
        if (user && user._id.toString() !== req.body.userId) {
          return Promise.reject('Korisnik sa odabranim JMBG već postoji!');
        }
      }),
    body('startDate')
      .notEmpty()
      .isDate()
      .withMessage('Datum treba da u formatu mm/dd/yyyy')
      .trim(),
    body('businessUnit').custom(async (value, { req }) => {
      const bUnit = await BusinessUnit.findById(value);
      if (!bUnit) {
        return Promise.reject('Molimo Vas odaberite poslovnu jedinicu.');
      }
    }),
    body('role').custom(async (value, { req }) => {
      const role = await Role.findById(value);
      if (!role) {
        return Promise.reject('Molimo Vas odaberite funkciju.');
      }
    }),
  ],
  isAuth('Admin'),
  userController.postEditUser
);

router.get('/change-password', userController.getChangePassword);

router.post(
  '/change-password',
  [
    body('password')
      .isLength({ min: 5 })
      .custom(async (value, { req }) => {
        const regEx = /^(?=.*\d)(?=.*[A-Za-z]+).{5,}$/;
        if (!regEx.test(value)) {
          return Promise.reject(
            'Password mora sadržati minimalno pet karaktera, te najmanje jedan broj i jedno slovo.'
          );
        }
      }),
    body('password').custom(async (value, { req }) => {
      const password = req.body.password;
      const confirmedPassword = req.body.passwordConfirmation;
      if (password !== confirmedPassword) {
        return Promise.reject(
          'Password i potvrđeni password se ne podudaraju! Molimo Vas da pokušate ponovo!'
        );
      }
    }),
  ],
  userController.postChangePassword
);

module.exports = router;
