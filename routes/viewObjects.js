const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const pool = require('../database');
const moment = require('moment');

router.get('/', async (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const currentPage = '/viewObjects';
    const email = req.session.user.email;
    const previousPage = req.session.currentPage;

    const isVerified = await UserModel.verifyUser(email, currentPage, previousPage);
    if (isVerified) {
        req.session.currentPage = currentPage;
        res.render('viewObjects', { user: req.session.user, objects: [] });
    } else {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.redirect('/');
        });
    }
});

router.post('/filter', async (req, res) => {
    const { selectedObjects, startDate, endDate } = req.body;
    const email = req.session.user.email;

    let query = 'SELECT * FROM detection WHERE email = ?';
    const params = [email];

    if (selectedObjects && selectedObjects.length > 0) {
        query += ' AND itemName IN (?)';
        params.push(selectedObjects);
    }

    if (startDate) {
        query += ' AND dateTime >= ?';
        params.push(startDate);
    }

    if (endDate) {
        query += ' AND dateTime <= ?';
        params.push(endDate);
    }

    try {
        const [objects] = await pool.execute(query, params);
        res.render('viewObjects', { user: req.session.user, objects, moment });
    } catch (error) {
        console.error('Error fetching detection objects:', error);
        res.status(500).json({ error: 'Failed to fetch detection objects' });
    }
});

module.exports = router;