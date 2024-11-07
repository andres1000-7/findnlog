const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const { saveDetection, startSession, endSession } = require('../models/DetectionModel');
const fs = require('fs');
const path = require('path');

// TODO:

router.get('/', async (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const currentPage = '/realTimeDetect';
    const email = req.session.user.email;
    const previousPage = req.session.currentPage;

    const isVerified = await UserModel.verifyUser(email, currentPage, previousPage);
    if (isVerified) {
        req.session.currentPage = currentPage;
        res.render('realTimeDetect', { user: req.session.user });
    } else {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.redirect('/');
        });
    }
});

router.post('/start', async (req, res) => {
    const { email } = req.session.user;
    const { selectedObjects } = req.body;

    console.log("In /start route. Selected objects: ", selectedObjects);

    try {
        const sessionID = await startSession(email);
        res.json({ sessionID });
    } catch (error) {
        console.error('Error starting detection session:', error);
        res.status(500).json({ error: 'Failed to start detection session' });
    }
});

router.post('/log', async (req, res) => {
    const { email } = req.session.user;
    const { sessionID, detections, dataUrl } = req.body;

    try {
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const imagePath = path.join(__dirname, '../public/images', `detection_${Date.now()}.png`);
        fs.writeFileSync(imagePath, base64Data, 'base64');

        detections.forEach(detection => {
            detection.imagePath = `/images/${path.basename(imagePath)}`;
        });

        await saveDetection(email, sessionID, detections);
        res.status(200).json({ message: 'Detections logged successfully' });
    } catch (error) {
        console.error('Error logging detections:', error);
        res.status(500).json({ error: 'Failed to log detections' });
    }
});

router.post('/end', async (req, res) => {
    const { sessionID } = req.body;

    try {
        await endSession(sessionID);
        res.status(200).json({ message: 'Detection session ended successfully' });
    } catch (error) {
        console.error('Error ending detection session:', error);
        res.status(500).json({ error: 'Failed to end detection session' });
    }
});

module.exports = router;