const { Admin } = require('../models');
const { generateToken, hashPassword, comparePassword } = require('../middleware/auth');
const { adminTypes, userStatus } = require('../../../shared/config/auth');

// 管理员登录
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        error: '用户名和密码不能为空',
        code: 'INVALID_INPUT'
      });
    }

    // 查找管理员
    const admin = await Admin.findByUsername(username);
    if (!admin) {
      return res.status(401).json({
        error: '用户名或密码错误',
        code: 'AUTH_FAILED'
      });
    }

    // 验证密码
    const isValidPassword = await comparePassword(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: '用户名或密码错误',
        code: 'AUTH_FAILED'
      });
    }

    // 检查账户状态
    if (!admin.isActive()) {
      return res.status(401).json({
        error: '账户已被禁用',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // 生成JWT Token
    const token = generateToken({
      id: admin.id,
      username: admin.username,
      type: admin.type,
      role: 'admin'
    });

    res.json({
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          type: admin.type,
          status: admin.status
        }
      }
    });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({
      error: '登录过程中发生错误',
      code: 'LOGIN_ERROR'
    });
  }
};

// 获取管理员列表
const getAdminList = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const { count, rows } = await Admin.findAndCountAll({
      where,
      attributes: ['id', 'username', 'type', 'status', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      message: '获取管理员列表成功',
      data: {
        admins: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取管理员列表错误:', error);
    res.status(500).json({
      error: '获取管理员列表失败',
      code: 'GET_ADMIN_LIST_ERROR'
    });
  }
};

// 创建管理员
const createAdmin = async (req, res) => {
  try {
    const { username, password, type = 'normal', status = 'active' } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        error: '用户名和密码不能为空',
        code: 'INVALID_INPUT'
      });
    }

    // 检查用户名是否已存在
    const existingAdmin = await Admin.findByUsername(username);
    if (existingAdmin) {
      return res.status(400).json({
        error: '用户名已存在',
        code: 'USERNAME_EXISTS'
      });
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建管理员
    const admin = await Admin.create({
      username,
      password: hashedPassword,
      type,
      status
    });

    res.status(201).json({
      message: '管理员创建成功',
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          type: admin.type,
          status: admin.status,
          created_at: admin.created_at
        }
      }
    });
  } catch (error) {
    console.error('创建管理员错误:', error);
    res.status(500).json({
      error: '创建管理员失败',
      code: 'CREATE_ADMIN_ERROR'
    });
  }
};

// 更新管理员
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, type, status } = req.body;

    // 查找管理员
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        error: '管理员不存在',
        code: 'ADMIN_NOT_FOUND'
      });
    }

    // 检查用户名是否已被其他管理员使用
    if (username && username !== admin.username) {
      const existingAdmin = await Admin.findByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({
          error: '用户名已存在',
          code: 'USERNAME_EXISTS'
        });
      }
    }

    // 更新字段
    const updateData = {};
    if (username) updateData.username = username;
    if (password) updateData.password = await hashPassword(password);
    if (type) updateData.type = type;
    if (status) updateData.status = status;

    await admin.update(updateData);

    res.json({
      message: '管理员更新成功',
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          type: admin.type,
          status: admin.status,
          updated_at: admin.updated_at
        }
      }
    });
  } catch (error) {
    console.error('更新管理员错误:', error);
    res.status(500).json({
      error: '更新管理员失败',
      code: 'UPDATE_ADMIN_ERROR'
    });
  }
};

// 删除管理员
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // 查找管理员
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        error: '管理员不存在',
        code: 'ADMIN_NOT_FOUND'
      });
    }

    // 不能删除超级管理员
    if (admin.isSuperAdmin()) {
      return res.status(403).json({
        error: '不能删除超级管理员',
        code: 'CANNOT_DELETE_SUPER_ADMIN'
      });
    }

    // 不能删除自己
    if (admin.id === req.admin.id) {
      return res.status(403).json({
        error: '不能删除自己的账户',
        code: 'CANNOT_DELETE_SELF'
      });
    }

    await admin.destroy();

    res.json({
      message: '管理员删除成功'
    });
  } catch (error) {
    console.error('删除管理员错误:', error);
    res.status(500).json({
      error: '删除管理员失败',
      code: 'DELETE_ADMIN_ERROR'
    });
  }
};

// 获取管理员详情
const getAdminDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id, {
      attributes: ['id', 'username', 'type', 'status', 'created_at', 'updated_at']
    });

    if (!admin) {
      return res.status(404).json({
        error: '管理员不存在',
        code: 'ADMIN_NOT_FOUND'
      });
    }

    res.json({
      message: '获取管理员详情成功',
      data: { admin }
    });
  } catch (error) {
    console.error('获取管理员详情错误:', error);
    res.status(500).json({
      error: '获取管理员详情失败',
      code: 'GET_ADMIN_DETAIL_ERROR'
    });
  }
};

// 获取当前管理员信息
const getCurrentAdmin = async (req, res) => {
  try {
    const admin = req.admin;
    
    res.json({
      message: '获取当前管理员信息成功',
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          type: admin.type,
          status: admin.status,
          created_at: admin.created_at
        }
      }
    });
  } catch (error) {
    console.error('获取当前管理员信息错误:', error);
    res.status(500).json({
      error: '获取当前管理员信息失败',
      code: 'GET_CURRENT_ADMIN_ERROR'
    });
  }
};

module.exports = {
  adminLogin,
  getAdminList,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminDetail,
  getCurrentAdmin
};
