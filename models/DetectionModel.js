const pool = require('../database');

async function startSession(email) {
    // print insert statement
    console.log('INSERT INTO detection_sessions (email) VALUES (?)', [email]);
    const [result] = await pool.execute(
        'INSERT INTO detection_sessions (email) VALUES (?)',
        [email]
    );
    return result.insertId;
}

async function saveDetection(email, sessionID, detections) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        for (const detection of detections) {
            const { itemName, boundingBox, confidence, imagePath } = detection;
            // print insert statements
            console.log('INSERT INTO detection (email, itemName, boundingBox, confidence, imagePath, sourceType) VALUES (?, ?, ?, ?, ?, ?)',
                [email, itemName, JSON.stringify(boundingBox), confidence, imagePath, 'webcam']);
            console.log(`INSERT INTO detection_stats (email, itemName, detectionCount, lastDetected) VALUES (?, ?, 1, NOW())
                ON DUPLICATE KEY UPDATE detectionCount = detectionCount + 1, lastDetected = NOW()`,
                [email, itemName]);
            await connection.execute(
                'INSERT INTO detection (email, itemName, boundingBox, confidence, imagePath, sourceType) VALUES (?, ?, ?, ?, ?, ?)',
                [email, itemName, JSON.stringify(boundingBox), confidence, imagePath, 'webcam']
            );
            await connection.execute(
                `INSERT INTO detection_stats (email, itemName, detectionCount, lastDetected) VALUES (?, ?, 1, NOW()) 
                ON DUPLICATE KEY UPDATE detectionCount = detectionCount + 1, lastDetected = NOW()`,
                [email, itemName]
            );
        }
        console.log('UPDATE detection_sessions SET totalDetections = totalDetections + ? WHERE sessionID = ?', [detections.length, sessionID]);
        await connection.execute(
            'UPDATE detection_sessions SET totalDetections = totalDetections + ? WHERE sessionID = ?',
            [detections.length, sessionID]
        );
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function endSession(sessionID) {
    await pool.execute(
        'UPDATE detection_sessions SET endTime = NOW() WHERE sessionID = ?',
        [sessionID]
    );
}

module.exports = {
    startSession,
    saveDetection,
    endSession
};