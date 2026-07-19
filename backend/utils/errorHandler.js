/**
 * 错误处理工具
 */

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * 统一的成功响应格式
 */
function successResponse(res, data = null, message = 'Success', statusCode = 200) {
  res.status(statusCode).json({
    code: 0,
    message,
    data,
  });
}

/**
 * 统一的错误响应格式
 */
function errorResponse(res, error, statusCode = 500, message = '服务器错误') {
  console.error('错误:', error);
  res.status(statusCode).json({
    code: statusCode,
    message: message || error.message || '未知错误',
    data: null,
  });
}

/**
 * 异步路由处理包装器
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  successResponse,
  errorResponse,
  asyncHandler,
};
