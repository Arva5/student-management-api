const express = require('express');
const router = express.Router();
const { getHealthStatus } = require('../controllers/health.controller');

// GET /api/health
router.get('/', getHealthStatus);

module.exports = router;
