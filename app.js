const express = require('express');
const path = require('path');
const signup = require('./routes/signup');
const usersRouter = require('./routes/users');


const createApp = () => {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/', signup);
    app.use('/users', usersRouter);

    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || 500;
        
        res.status(statusCode).json({
            status: err.status || 'error',
            message: err.message,
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    });

    return app;
};

module.exports = createApp;