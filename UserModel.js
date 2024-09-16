// UserModel.js
const bcrypt = require('bcrypt');
const pool = require('./database');

class UserModel {
    static async createUser(email, password, firstName, lastName) {
        const hashing = await bcrypt.hash(password, 10);
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute(
                'INSERT INTO user (email, hashing, firstName, lastName) VALUES (?, ?, ?, ?)',
                [email, hashing, firstName, lastName]
            );
            await connection.execute(
                'INSERT INTO roleuser (email, roleID, dateAssign) VALUES (?, ?, CURDATE())',
                [email, 'role2'] // Assign 'user' role by default
            );
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async validateUser(email, password) {
        const [rows] = await pool.execute(
            'SELECT hashing FROM user WHERE email = ?',
            [email]
        );
        if (rows.length === 0) return false;
        return bcrypt.compare(password, rows[0].hashing);
    }

    static async getUserPages(email) {
        const [rows] = await pool.execute(
            `SELECT DISTINCT w.pageURL, w.pageTitle, m.title as menuTitle
             FROM roleuser ru
                      JOIN rolewebpage rw ON ru.roleID = rw.roleID
                      JOIN webpage w ON rw.pageURL = w.pageURL
                      JOIN menuElement m ON w.menuID = m.menuID
             WHERE ru.email = ?
             ORDER BY m.menuID, w.pageTitle`,
            [email]
        );
        return rows;
    }

    static async checkPreviousPage(currentPage, previousPage) {
        const [rows] = await pool.execute(
            'SELECT * FROM webpageprevious WHERE currentpageURL = ? AND previouspageURL = ?',
            [currentPage, previousPage]
        );
        return rows.length > 0;
    }
}

module.exports = UserModel;