require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

pool.getConnection((err, connection) => {
	if (err) {
		console.error('DB connection error:', err);
	} else {
		console.log('DB connected');
		connection.release();
	}
});

module.exports = pool;
