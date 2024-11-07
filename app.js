const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
require('dotenv').config();

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const detectRouter = require('./routes/detect');
const realTimeDetectRouter = require('./routes/realTimeDetect');
const analyticsRouter = require('./routes/analytics');
const viewObjectsRouter = require('./routes/viewObjects');
const UserModel = require('./models/UserModel');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' })); // Increase the limit for JSON bodies
app.use(express.urlencoded({ extended: false, limit: '50mb' })); // Increase the limit for URL-encoded bodies
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.use(async (req, res, next) => {
    if (req.session.user) {
        try {
            const pages = await UserModel.getAccessiblePages(req.session.user.email);
            res.locals.user = req.session.user;
            res.locals.pages = pages;
        } catch (error) {
            console.error('Error fetching user pages:', error);
        }
    }
    next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/detect', detectRouter);
app.use('/realTimeDetect', realTimeDetectRouter);
app.use('/analytics', analyticsRouter);
app.use('/viewObjects', viewObjectsRouter);

app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;