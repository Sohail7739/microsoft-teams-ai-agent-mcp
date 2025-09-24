const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-client');

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_AUTHORITY = `https://login.microsoftonline.com/${AZURE_TENANT_ID}`;

// JWKS client for token validation
const client = jwksClient({
  jwksUri: `${AZURE_AUTHORITY}/discovery/v2.0/keys`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Middleware to authenticate Azure AD tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  jwt.verify(token, getKey, {
    audience: AZURE_CLIENT_ID,
    issuer: `${AZURE_AUTHORITY}/v2.0`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    // Verify tenant
    if (decoded.tid !== AZURE_TENANT_ID) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid tenant' 
      });
    }

    req.user = decoded;
    next();
  });
}

// Middleware to check if user has required roles
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
