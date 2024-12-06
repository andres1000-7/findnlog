const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');

router.get('/', async (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const currentPage = '/addUser';
    const email = req.session.user.email;
    const previousPage = req.session.currentPage;

    const isVerified = await UserModel.verifyUser(email, currentPage, previousPage);
    if (isVerified) {
        req.session.currentPage = currentPage;
        res.render('addUser', { user: req.session.user });
    } else {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.redirect('/');
        });
    }
});

router.post('/', async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    try {
        await UserModel.createUser(email, password, firstName, lastName);
        res.redirect('/adminList');
    } catch (error) {
        console.error('Error creating user:', error);
        res.render('addUser', { user: req.session.user, error: 'Failed to create user' });
    }
});

module.exports = router;