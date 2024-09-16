// routes/detect.js
const express = require('express');
const router = express.Router();
const UserModel = require('../UserModel');

router.get('/', async (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const cameFromWelcome = await UserModel.checkPreviousPage('/detect', '/welcome');
    if (!cameFromWelcome) {
        res.redirect('/welcome');
        return;
    }

    res.render('detect', { title: 'Live Object Detection' });
});

module.exports = router;