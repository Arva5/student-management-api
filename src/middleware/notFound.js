/**
 * Middleware to handle 404 - Route Not Found
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = notFound;
