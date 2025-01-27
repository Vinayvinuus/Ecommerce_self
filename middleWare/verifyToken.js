const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

        req.user = decoded;  // Attach decoded user details to the request
        console.log('req.user', req.user);
        next();
    });
};

// Middleware to check if user is Admin
const isAdmin = (req, res, next) => {
    if (req.user.RoleID !== 1) {     // RoleID 1 assumed to be Admin
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};
// Middleware for User/Employee Access
const isUser = (req, res, next) => {
    if (req.user.RoleID !== 2) { // RoleID 2 assumed to be User/Employee
      return res.status(403).json({ message: 'Access denied. User/Employee only.' });
    }
    next();
  };

// Middleware for Customer Access
const isCustomer = (req, res, next) => {
  console.log('RoleID', req.user.RoleID);
    if (req.user.RoleID !== 3) { // RoleID 3 assumed to be Customer
      return res.status(403).json({ message: 'Access denied. Customers only.' });
    }
    next();
  };

module.exports = { verifyToken, isAdmin, isUser, isCustomer};
