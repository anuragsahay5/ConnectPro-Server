const jwt = require('jsonwebtoken'); // Importing JSON Web Token library
const dotenv = require('dotenv'); // Importing library to load environment variables from .env file
dotenv.config(); // Loading environment variables from .env file

module.exports = function authenticationMiddleware(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      if (error) {
        // Token is not valid
        return res.status(401).json({ msg: 'Token is not valid' });
      } else {
        // Token is valid, store the decoded user object in the request for future use
        req.user = decoded.user;
        next(); // Proceed to the next middleware or route handler
      }
    });
  } catch (err) {
    // Something went wrong with the authentication middleware
    console.error('Something went wrong with authentication middleware');
    res.status(500).json({ msg: 'Server Error' });
  }
};
