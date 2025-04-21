const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const handleErrorAsync = require('../utils/handleErrorAsync');
const AppError = require('../utils/appError');

router.post('/v1/users/signup', handleErrorAsync(usersController.signup));

router.use((req, res, next) => {
    next(new AppError(404, 'Route not found'));
});

module.exports = router;