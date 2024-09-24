/**
 * Description: Main entry point for the Express application. This file contains the code to set up the Express
 * application, including middleware, routes, and error handling.
 */

/**
 * Module dependencies.
 * creating HTTP errors, Express framework, handling file and directory paths,
 * middleware for parsing cookies, HTTP request logger middleware, handling sessions,
 * loading environment variables from a .env file
 */
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
require('dotenv').config();

/**
 * Route handlers.
 * index page, user-related pages, and detection-related pages
 * User model for database operations
 */
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const detectRouter = require('./routes/detect');
const UserModel = require('./models/UserModel');

// Initialize the Express application
const app = express();

// Set the directory for the views and the view engine to Pug
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

/**
 * Middleware setup
 * HTTP request logger, parsing JSON and URL-encoded request bodies, parsing cookies,
 * serve static files from the public directory, handling sessions
 */
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    // Secret for session encryption
    secret: process.env.SESSION_SECRET,
    // Don't save session if it hasn't been modified
    resave: false,
    // Save session even if it's new
    saveUninitialized: true
}));

/**
 *
 */
// Middleware to fetch user pages and attach them to the response locals
app.use(async (req, res, next) => {
    if (req.session.user) {
        try {
            const pages = await UserModel.getAccessiblePages(req.session.user.email);
            // Attach user to response locals
            res.locals.user = req.session.user;
            // Attach user pages to response locals
            res.locals.pages = pages;
        } catch (error) {
            // Log error if fetching pages fails
            console.error('Error fetching user pages:', error);
        }
    }
    // Proceed to the next middleware
    next();
});

/**
 * Routes handlers
 * index page, user-related pages, and detection-related pages
 */
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/detect', detectRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    // Create a 404 error and pass it to the next middleware
    next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
    // Set error message in response locals and show detailed error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // Set response status to error status or 500 and render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;