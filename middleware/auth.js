const { auth } = require('express-oauth2-jwt-bearer');

// Auth0 JWT verification middleware
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  tokenSigningAlg: 'RS256'
});

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  tokenSigningAlg: 'RS256',
  credentialsRequired: false
});

// Authorization middleware for specific permissions
const checkPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permissions = req.auth.permissions || [];
    
    const hasPermission = requiredPermissions.every(permission =>
      permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have the required permissions'
      });
    }

    next();
  };
};

module.exports = {
  checkJwt,
  optionalAuth,
  checkPermissions
};
