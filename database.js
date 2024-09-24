/**
 * Description: This file contains the code to create a MySQL connection pool using environment variables.
 * The connection is implemented with security in mind, using environment variables to store sensitive information.
 */

/**
 * Module dependencies.
 * MySQL client for Node.js with Promise support, where promise means to handle asynchronous operations
 * Load environment variables from a .env file
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Create a MySQL connection pool using environment variables.
 * database host, user, password, and name are stored in .env
 * @type {mysql.Pool}
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Wait for connections if none are available
    waitForConnections: true,
    // Maximum number of connections in the pool
    connectionLimit: 10,
    // Maximum number of connection requests in the queue (0 means no limit)
    queueLimit: 0
});

module.exports = pool;