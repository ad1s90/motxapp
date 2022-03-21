const express = require('express');
const { body } = require('express-validator');

const roleController = require('../controllers/role');
const Role = require('../models/role');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// get za početnu za kreiranje funkcije
router.get('/add-role', isAuth('Admin'), roleController.getAddRole);

// post za kreiranje funkcije
router.post(
  '/add-role',
  [
    body('role')
      .notEmpty()
      .withMessage('Naziv funkcije ne može biti prazan')
      .trim()
      .custom(async (value, { req }) => {
        const role = await Role.findOne({ role: req.body.role });

        if (role) {
          return Promise.reject('Funkcija sa odabranim imenom već postoji!');
        }
      }),
  ],
  isAuth('Admin'),
  roleController.postAddRole
);

// get za izmjenu funkcije
router.get('/edit-role/:roleId', isAuth('Admin'), roleController.getEditRole);

// post za izmjenu funkcije
router.post(
  '/edit-role',
  [
    body('role')
      .notEmpty()
      .withMessage('Naziv funkcije ne može biti prazan')
      .trim()
      .custom(async (value, { req }) => {
        const role = await Role.findOne({ role: req.body.role });

        if (role) {
          return Promise.reject(
            'Funkcija sa odabranim imenom već postoji! Molimo Vas da ponovo odaberete funkciju koju želite izmjeniti.'
          );
        }
      }),
  ],
  isAuth('Admin'),
  roleController.postEditRole
);

module.exports = router;
