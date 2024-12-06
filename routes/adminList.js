const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const pool = require('../database');

router.get('/', async (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const currentPage = '/adminList';
    const email = req.session.user.email;
    const previousPage = req.session.currentPage;

    const isVerified = await UserModel.verifyUser(email, currentPage, previousPage);
    if (isVerified) {
        req.session.currentPage = currentPage;
        const [users] = await pool.execute('SELECT email, firstName, lastName FROM user WHERE email IN (SELECT email FROM roleuser WHERE roleID = "role2")');
        res.render('adminList', { user: req.session.user, users, success: req.query.success, error: req.query.error });
    } else {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.redirect('/');
        });
    }
});

router.post('/delete', async (req, res) => {
    const { email } = req.body;
    try {
        await pool.execute('DELETE FROM user WHERE email = ?', [email]);
        await pool.execute('DELETE FROM roleuser WHERE email = ?', [email]);
        res.redirect('/adminList?success=User deleted successfully');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.redirect('/adminList?error=Failed to delete user');
    }
});

router.post('/search', async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await pool.execute('SELECT email, firstName, lastName FROM user WHERE email = ? AND email IN (SELECT email FROM roleuser WHERE roleID = "role2")', [email]);
        res.render('adminList', { user: req.session.user, users, success: req.query.success, error: req.query.error });
    } catch (error) {
        console.error('Error searching user:', error);
        res.redirect('/adminList?error=Failed to search user');
    }
});

module.exports = router;