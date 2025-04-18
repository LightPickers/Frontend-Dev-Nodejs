const express = require('express');
const router = express.Router();
const config = require('../config/index');
const { dataSource } = require('../db/data-source');

const usersController = require('../controllers/users');
const handleErrorAsync = require('../utils/handleErrorAsync');

router.get('/profile', handleErrorAsync(usersController.getUserProfile));
router.post('/auth/verify', handleErrorAsync(usersController.varifyAuth));

module.exports = router;