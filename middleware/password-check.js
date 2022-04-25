const User = require('../models/user');

module.exports = async function (req, res, next) {
  try {
    const user = await User.findById(req.session.user._id).populate('role');

    if (user.password === '0000') {
      if (!user) {
        return res.redirect('/');
      }

      return res.render('user/change-password', {
        pageTitle: 'Promjena password',
        path: 'change-password',
        validationErrors: [],
        errorMessage: '',
        obligatory: true,
        role: user.role.role,
        message: '',
      });
    }
    next();
  } catch (e) {}
};
