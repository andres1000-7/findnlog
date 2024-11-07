const pool = require('../database');

async function getDetectionStats(email) {
    const [rows] = await pool.execute(
        'SELECT itemName, detectionCount, lastDetected FROM detection_stats WHERE email = ?',
        [email]
    );
    return rows;
}

async function getDetectionSessions(email) {
    const [rows] = await pool.execute(
        'SELECT sessionID, startTime, endTime, totalDetections FROM detection_sessions WHERE email = ?',
        [email]
    );
    return rows;
}

module.exports = {
    getDetectionStats,
    getDetectionSessions
};