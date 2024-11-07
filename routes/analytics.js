const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const { getDetectionStats, getDetectionSessions } = require('../models/AnalyticsModel');

router.get('/', async (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const currentPage = '/analytics';
    const email = req.session.user.email;
    const previousPage = req.session.currentPage;

    const isVerified = await UserModel.verifyUser(email, currentPage, previousPage);
    if (isVerified) {
        req.session.currentPage = currentPage;
        const stats = await getDetectionStats(email);
        const sessions = await getDetectionSessions(email);
        res.render('analytics', { user: req.session.user, stats, sessions });
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