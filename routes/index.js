const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');

router.get('/', (req, res) => {
    res.render('index', { title: 'Login or Sign Up' });
});

router.post('/login', async (req, res) => {
    try {
        const user = await UserModel.authenticate(req.body.email, req.body.password);
        if (user) {
            // console.log('User authenticated');
            req.session.user = { email: req.body.email };
            req.session.currentPage = '/login';
            res.redirect('/welcome');
        } else {
            res.render('index', {error: 'Invalid email or password'});
        }
    } catch (error) {
        res.render('index', { error: 'Error authenticating user' });
    }
});

router.post('/signup', async (req, res) => {
    try {
        await UserModel.createUser(req.body.email, req.body.password, req.body.firstName, req.body.lastName);
        res.redirect('/');
    } catch (error) {
        res.render('index', { error: error.message || 'Error creating user' });
    }
});

router.get('/welcome', async (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const currentPage = '/welcome';
    const email = req.session.user.email;
    const previousPage = req.session.currentPage;

    const isVerified = await UserModel.verifyUser(email, currentPage, previousPage);
    if (isVerified) {
        req.session.currentPage = currentPage;
        // const accessiblePages = await UserModel.getAccessiblePages(email);
        res.render('welcome', { user: req.session.user });
    } else {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.redirect('/');
        });
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