var authenticationMiddleware = { 
  "apiRequests": function (req, res, next) {
      if (req.isAuthenticated()) {
        return next()
      }
      res.status(200).json({'error': 'User not authorised'});      
   },
  "viewRequests": function (req, res, next) {
      if (req.isAuthenticated()) {
        return next()
      } 
      res.redirect('/sign-in');      
    }

}
module.exports = authenticationMiddleware;