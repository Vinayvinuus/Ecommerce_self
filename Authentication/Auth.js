const jwt = require("jsonwebtoken");

// JWT Secret Key
//const JWT_SECRET = 'b2y';


// Middleware for JWT verification for login user
const verifyToken = (req, res, next) => {

  const bearerheader = req.headers['authorization'];
  const bearer = bearerheader.split(' ');
    const bearertoken = bearer[1];
    //const token = req.headers.authorization;
  
    if (!bearertoken) {
      return res.status(403).json({ message: 'Access Denied: No token provided' });
    }
  
    jwt.verify(bearertoken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
  
      console.log("token is verified", decoded);
      req.userId = decoded.userId;
      next();
    });
  };



//check roles
const checkRole = (permission) => {
  return (req, res, next) => {
      const bearerheader = req.headers['authorization'];
      const bearer = bearerheader.split(' ');
      const bearertoken = bearer[1];
      
      if (!bearertoken) {
          return res.status(403).json({ message: 'Access Denied: No token provided' });
      }

      jwt.verify(bearertoken, process.env.JWT_SECRET, (err, decoded) => {
          if (err) {
              return res.status(401).json({ message: 'Unauthorized' });
          }

          const userRole = decoded.role;
          if (permission === userRole) {
              //req.role = userRole;
              next();
          } else {
              return res.status(403).json({ message: 'Unauthorized access' });
          }
      });
  };
};
module.exports = {verifyToken,checkRole};