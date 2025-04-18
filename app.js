const express = require('express');
const path = require('path');
const usersRouter = require('./routes/users');

const createApp = () => {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/users', usersRouter);

    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        req.log?.error?.(err);
        const statusCode = err.status || 500;
        res.status(statusCode).json({
            status: statusCode === 500 ? 'error' : 'failed',
            message: err.message || '伺服器錯誤'
        });
    });

    return app;
};

module.exports = createApp;