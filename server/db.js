const mysql = require('mysql2');

const db = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'task_manager',
});

db.connect(err => {
	if (err) {
		console.error('DB connection error:', err);
	} else {
		console.log('Connected to MySQL');
	}
});

module.exports = db;
