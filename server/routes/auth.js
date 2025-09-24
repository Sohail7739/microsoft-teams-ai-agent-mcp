const express = require('express');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Azure AD configuration
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

// Validate Azure AD token
function validateAzureToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: AZURE_CLIENT_ID,
      issuer: `${AZURE_AUTHORITY}/v2.0`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

// Get user info from Teams context
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Extract user information from token
    const userInfo = {
      id: user.oid || user.sub,
      name: user.name || user.preferred_username,
      email: user.email || user.preferred_username,
      tenantId: user.tid,
      roles: user.roles || []
    };

    res.json({
      success: true,
      user: userInfo
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
});

// Validate Teams SSO token
router.post('/validate', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = await validateAzureToken(token);
    
    // Check if user belongs to the correct tenant
    if (decoded.tid !== AZURE_TENANT_ID) {
      return res.status(403).json({
        success: false,
        error: 'Invalid tenant'
      });
    }

    res.json({
      success: true,
      user: {
        id: decoded.oid || decoded.sub,
        name: decoded.name || decoded.preferred_username,
        email: decoded.email || decoded.preferred_username,
        tenantId: decoded.tid,
        roles: decoded.roles || []
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Get Teams context
router.get('/context', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      context: {
        user: {
          id: user.oid || user.sub,
          name: user.name || user.preferred_username,
          email: user.email || user.preferred_username
        },
        tenant: {
          id: user.tid
        },
        teams: {
          appId: AZURE_CLIENT_ID,
          tenantId: AZURE_TENANT_ID
        }
      }
    });
  } catch (error) {
    console.error('Error getting Teams context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Teams context'
    });
  }
});

module.exports = router;
