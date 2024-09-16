// routes/index.js
const express = require('express');
const router = express.Router();
const UserModel = require('../UserModel');

router.get('/', function (req, res, next) {
    res.render('index', {title: 'Login or Sign Up'});
});

router.post('/login', async (req, res) => {
    try {
        const isValid = await UserModel.validateUser(req.body.email, req.body.password);
        if (isValid) {
            req.session.user = {email: req.body.email};
            res.redirect('/welcome');
        } else {
            res.render('index', {error: 'Invalid email or password'});
        }
    } catch (error) {
        res.render('index', {error: 'Error validating user'});
    }
});

router.post('/signup', async (req, res) => {
    try {
        await UserModel.createUser(req.body.email, req.body.password, req.body.firstName, req.body.lastName);
        res.redirect('/');
    } catch (error) {
        res.render('index', {error: 'Error creating user'});
    }
});

router.get('/welcome', async (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }
    try {
        const userPages = await UserModel.getUserPages(req.session.user.email);
        res.render('welcome', {user: req.session.user, pages: userPages});
    } catch (error) {
        res.render('welcome', {error: 'Error fetching user pages'});
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

module.exports = router;