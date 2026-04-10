const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middlewares/authMiddleware');
const User = require('../models/User');

// Mocking dependencies
jest.mock('jsonwebtoken');
jest.mock('../models/User');

describe('Auth Middleware - verifyToken', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {
        authorization: 'Bearer mock-token'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should call next if token is valid and session matches', async () => {
    jwt.verify.mockReturnValue({ id: 'user-id', email: 'test@test.com' });
    User.findById.mockResolvedValue({
      id: 'user-id',
      currentSessionToken: 'mock-token'
    });

    await verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if session has been hijacked (token mismatch)', async () => {
    jwt.verify.mockReturnValue({ id: 'user-id', email: 'test@test.com' });
    User.findById.mockResolvedValue({
      id: 'user-id',
      currentSessionToken: 'DIFFERENT-token'
    });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'SESSION_COLLISION'
    }));
  });

  it('should return 401 if no token is provided', async () => {
    req.headers.authorization = undefined;

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
