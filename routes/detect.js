// routes/detect.js
const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');

router.get('/', async (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const currentPage = '/detect';
    const email = req.session.user.email;
    const previousPage = req.session.currentPage;

    const isVerified = await UserModel.verifyUser(email, currentPage, previousPage);
    if (isVerified) {
        req.session.currentPage = currentPage;
        // const accessiblePages = await UserModel.getAccessiblePages(email);
        res.render('detect', { user: req.session.user });
    } else {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.redirect('/');
        });
    }
});

module.exports = router;