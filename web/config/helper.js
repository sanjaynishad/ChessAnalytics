module.exports = {
  
  // admin > master teacher > teacher > student

  ensureAuthenticated: function (req, res, next) {
    if (req.session.user) {
      return next();
    } else {
      res.redirect('/login');
    }
  }
};
