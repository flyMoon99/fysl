const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { jwtConfig, bcryptConfig } = require('../../../shared/config/auth');
const { Admin, Member } = require('../models');

// JWT Token生成
const generateToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn
  });
};

// JWT Token验证
const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    return null;
  }
};

// 密码加密
const hashPassword = async (password) => {
  return await bcrypt.hash(password, bcryptConfig.saltRounds);
};

// 密码验证
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// 管理员认证中间件
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: '未提供认证令牌',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: '认证令牌无效或已过期',
        code: 'AUTH_TOKEN_INVALID'
      });
    }

    // 验证管理员是否存在且激活
    const admin = await Admin.findByPk(decoded.id);
    if (!admin || !admin.isActive()) {
      return res.status(401).json({
        error: '管理员账户不存在或已被禁用',
        code: 'AUTH_ADMIN_INACTIVE'
      });
    }

    // 将管理员信息添加到请求对象
    req.admin = admin;
    req.user = admin; // 兼容性
    next();
  } catch (error) {
    console.error('管理员认证错误:', error);
    return res.status(500).json({
      error: '认证过程中发生错误',
      code: 'AUTH_ERROR'
    });
  }
};

// 会员认证中间件
const authenticateMember = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: '未提供认证令牌',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: '认证令牌无效或已过期',
        code: 'AUTH_TOKEN_INVALID'
      });
    }

    // 验证会员是否存在且激活
    const member = await Member.findByPk(decoded.id);
    if (!member || !member.isActive()) {
      return res.status(401).json({
        error: '会员账户不存在或已被禁用',
        code: 'AUTH_MEMBER_INACTIVE'
      });
    }

    // 将会员信息添加到请求对象
    req.member = member;
    req.user = member; // 兼容性
    next();
  } catch (error) {
    console.error('会员认证错误:', error);
    return res.status(500).json({
      error: '认证过程中发生错误',
      code: 'AUTH_ERROR'
    });
  }
};

// 超级管理员权限验证中间件
const requireSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      error: '需要管理员权限',
      code: 'AUTH_ADMIN_REQUIRED'
    });
  }

  if (!req.admin.isSuperAdmin()) {
    return res.status(403).json({
      error: '需要超级管理员权限',
      code: 'AUTH_SUPER_ADMIN_REQUIRED'
    });
  }

  next();
};

// 管理员权限验证中间件（普通管理员或超级管理员）
const requireAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      error: '需要管理员权限',
      code: 'AUTH_ADMIN_REQUIRED'
    });
  }

  next();
};

// 可选认证中间件（不强制要求认证）
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        // 根据token中的role字段来判断用户类型
        if (decoded.role === 'admin') {
          const admin = await Admin.findByPk(decoded.id);
          if (admin && admin.isActive()) {
            req.admin = admin;
            req.user = admin;
            req.userType = 'admin';
          }
        } else if (decoded.role === 'member') {
          const member = await Member.findByPk(decoded.id);
          if (member && member.isActive()) {
            req.member = member;
            req.user = member;
            req.userType = 'member';
          }
        } else {
          // 兼容旧版本token，尝试查找管理员然后会员
          const admin = await Admin.findByPk(decoded.id);
          if (admin && admin.isActive()) {
            req.admin = admin;
            req.user = admin;
            req.userType = 'admin';
          } else {
            const member = await Member.findByPk(decoded.id);
            if (member && member.isActive()) {
              req.member = member;
              req.user = member;
              req.userType = 'member';
            }
          }
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('可选认证错误:', error);
    next(); // 继续执行，不阻止请求
  }
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authenticateAdmin,
  authenticateMember,
  requireSuperAdmin,
  requireAdmin,
  optionalAuth
};
