const User = require('../models/user');
// ubaciti error handling
module.exports = function (role, role2) {
  return async (req, res, next) => {
    if (!req.session.isLoggedIn) {
      return res.redirect('/login');
    }

    try {
      const user = await User.findById(req.session.user._id).populate('role');
      if (role !== user.role.role && role2 !== user.role.role) {
        return res.status(422).render('access-denied', {
          pageTitle: 'Pristup odbijen',
          path: '',
        });
      }
      next();
    } catch (e) {}
  };
};
