const { Admin, Member } = require('../models');
const { generateToken, comparePassword } = require('../middleware/auth');

// 通用登录验证
const validateLogin = async (username, password, userType) => {
  let user;
  
  if (userType === 'admin') {
    user = await Admin.findByUsername(username);
  } else if (userType === 'member') {
    user = await Member.findByUsername(username);
  }
  
  if (!user) {
    return { success: false, error: '用户名或密码错误' };
  }
  
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    return { success: false, error: '用户名或密码错误' };
  }
  
  if (!user.isActive()) {
    return { success: false, error: '账户已被禁用' };
  }
  
  return { success: true, user };
};

// 获取用户信息
const getUserInfo = async (req, res) => {
  try {
    const user = req.user;
    const userType = req.userType;
    
    if (!user) {
      return res.status(401).json({
        error: '未找到用户信息',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const userInfo = {
      id: user.id,
      username: user.username,
      type: userType,
      status: user.status
    };
    
    // 根据用户类型添加特定信息
    if (userType === 'admin') {
      userInfo.adminType = user.type;
    } else if (userType === 'member') {
      userInfo.lastLoginAt = user.last_login_at;
    }
    
    res.json({
      message: '获取用户信息成功',
      data: { user: userInfo }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      error: '获取用户信息失败',
      code: 'GET_USER_INFO_ERROR'
    });
  }
};

// 验证Token
const verifyToken = async (req, res) => {
  try {
    const user = req.user;
    const userType = req.userType;
    
    if (!user) {
      return res.status(401).json({
        error: 'Token无效',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.json({
      message: 'Token验证成功',
      data: {
        valid: true,
        userType,
        userId: user.id
      }
    });
  } catch (error) {
    console.error('Token验证错误:', error);
    res.status(500).json({
      error: 'Token验证失败',
      code: 'TOKEN_VERIFY_ERROR'
    });
  }
};

// 登出（客户端处理，这里提供接口用于记录）
const logout = async (req, res) => {
  try {
    // 这里可以添加登出日志记录逻辑
    // 例如记录登出时间、IP等
    
    res.json({
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      error: '登出失败',
      code: 'LOGOUT_ERROR'
    });
  }
};

module.exports = {
  validateLogin,
  getUserInfo,
  verifyToken,
  logout
};
