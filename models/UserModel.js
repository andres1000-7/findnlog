const bcrypt = require('bcrypt');
const pool = require('../database');

class UserModel {
    static async createUser(email, password, firstName, lastName) {
        const hashing = await bcrypt.hash(email + password, 12);
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [existingUser] = await connection.execute(
                'SELECT email FROM user WHERE email = ?',
                [email]
            );
            if (existingUser.length > 0) {
                throw new Error('User already exists');
            }
            await connection.execute(
                'INSERT INTO user (email, hashing, firstName, lastName) VALUES (?, ?, ?, ?)',
                [email, hashing, firstName, lastName]
            );
            await connection.execute(
                'INSERT INTO roleuser (email, roleID, dateAssign) VALUES (?, ?, CURDATE())',
                [email, 'role2']
            );
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async authenticate(email, password) {
        const [rows] = await pool.execute(
            'SELECT hashing FROM user WHERE email = ?',
            [email]
        );
        if (rows.length === 0) return false;
        return bcrypt.compare(email + password, rows[0].hashing);
    }

    static async verifyUser(email, currentPage, previousPage) {
        const [rows] = await pool.execute(
            `SELECT user.email, roleuser.roleID, user.firstName
             FROM roleuser, role, rolewebpage, webpage, user, webpageprevious
             WHERE user.email = roleuser.email AND user.email = ? AND role.roleID = roleuser.roleID AND
             rolewebpage.roleID = role.roleID AND rolewebpage.pageURL = webpage.pageURL AND webpage.pageURL = ? AND
             webpage.pageURL = webpageprevious.currentpageURL AND webpageprevious.previousPageURL = ?`,
            [email, currentPage, previousPage]
        );
        return rows.length > 0;
    }

    static async getAccessiblePages(email) {
        const [rows] = await pool.execute(
            `SELECT rolewebpage.pageURL, menuElement.title, webpage.pageTitle
             FROM roleuser, role, rolewebpage, menuElement, webpage
             WHERE roleuser.roleID = role.roleID AND role.roleID = rolewebpage.roleID AND menuElement.menuID = webpage.menuID
             AND rolewebpage.pageURL = webpage.pageURL AND email = ?
             ORDER BY menuElement.title, webpage.pageTitle`,
            [email]
        );
        return rows;
    }
}

module.exports = UserModel;