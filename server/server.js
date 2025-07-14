const http = require('http');
const db = require('./db');
const url = require('url');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const sendTaskAssignmentEmail = require('./sendMail');

const saltRounds = 10;

const server = http.createServer((req, res) => {
	const parsedUrl = url.parse(req.url, true);
	const { pathname, query } = parsedUrl;

	res.setHeader('Content-Type', 'application/json');

	// Get all users
	if (req.method === 'GET' && pathname === '/users') {
		db.query('SELECT id, name, email, role FROM users', (err, results) => {
			if (err) {
				res.writeHead(500);
				res.end(JSON.stringify({ message: 'Server error' }));
			} else {
				res.end(JSON.stringify(results));
			}
		});

		// Register user
	} else if (req.method === 'POST' && pathname === '/users') {
		let body = '';
		req.on('data', chunk => (body += chunk.toString()));
		req.on('end', () => {
			const { name, email, password, role } = JSON.parse(body);

			if (!name || !email || !password) {
				res.writeHead(400);
				res.end(JSON.stringify({ message: 'Missing required fields' }));
				return;
			}

			bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
				if (err) {
					res.writeHead(500);
					res.end(JSON.stringify({ message: 'Error hashing password' }));
					return;
				}

				const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
				const values = [name, email, hashedPassword, role || 'user'];

				db.query(sql, values, (err, result) => {
					if (err) {
						res.writeHead(500);
						res.end(JSON.stringify({ message: 'Database error', error: err.message }));
					} else {
						res.writeHead(201);
						res.end(JSON.stringify({ message: 'User created', user_id: result.insertId }));
					}
				});
			});
		});

		// Edit user
	} else if (req.method === 'POST' && pathname === '/users/edit') {
		let body = '';
		req.on('data', chunk => (body += chunk.toString()));
		req.on('end', () => {
			const { user_id, name, email, role } = JSON.parse(body);
			if (!user_id || (!name && !email && !role)) {
				res.writeHead(400);
				res.end(JSON.stringify({ message: 'Missing required fields' }));
				return;
			}

			const updates = [];
			const values = [];
			if (name) {
				updates.push('name = ?');
				values.push(name);
			}
			if (email) {
				updates.push('email = ?');
				values.push(email);
			}
			if (role) {
				updates.push('role = ?');
				values.push(role);
			}
			values.push(user_id);
			const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

			db.query(sql, values, (err, result) => {
				if (err) {
					res.writeHead(500);
					res.end(JSON.stringify({ message: 'Database error', error: err.message }));
				} else {
					res.writeHead(200);
					res.end(JSON.stringify({ message: 'User updated' }));
				}
			});
		});

		// Delete user
	} else if (req.method === 'POST' && pathname === '/users/delete') {
		let body = '';
		req.on('data', chunk => (body += chunk.toString()));
		req.on('end', () => {
			const { user_id } = JSON.parse(body);
			if (!user_id) {
				res.writeHead(400);
				res.end(JSON.stringify({ message: 'Missing user_id' }));
				return;
			}

			db.query('DELETE FROM users WHERE id = ?', [user_id], (err, result) => {
				if (err) {
					res.writeHead(500);
					res.end(JSON.stringify({ message: 'Database error', error: err.message }));
				} else {
					res.writeHead(200);
					res.end(JSON.stringify({ message: 'User deleted' }));
				}
			});
		});

		// Assign task
	} else if (req.method === 'POST' && pathname === '/tasks') {
		let body = '';
		req.on('data', chunk => (body += chunk.toString()));
		req.on('end', () => {
			const { title, description, assigned_to, deadline } = JSON.parse(body);

			if (!title || !assigned_to || !deadline) {
				res.writeHead(400);
				res.end(JSON.stringify({ message: 'Missing required fields' }));
				return;
			}

			const sql = `INSERT INTO tasks (title, description, assigned_to, deadline) VALUES (?, ?, ?, ?)`;
			db.query(sql, [title, description || '', assigned_to, deadline], (err, result) => {
				if (err) {
					res.writeHead(500);
					res.end(JSON.stringify({ message: 'Database error', error: err.message }));
				} else {
					db.query('SELECT email FROM users WHERE id = ?', [assigned_to], (e, rows) => {
						if (!e && rows.length > 0) {
							sendTaskAssignmentEmail(rows[0].email, title, deadline);
						}
					});
					res.writeHead(201);
					res.end(JSON.stringify({ message: 'Task assigned', task_id: result.insertId }));
				}
			});
		});

		// Get tasks for user
	} else if (req.method === 'GET' && pathname === '/tasks') {
		const userId = query.user_id;
		if (!userId) {
			res.writeHead(400);
			res.end(JSON.stringify({ message: 'Missing user_id' }));
			return;
		}
		db.query('SELECT * FROM tasks WHERE assigned_to = ? ORDER BY created_at DESC', [userId], (err, rows) => {
			if (err) {
				res.writeHead(500);
				res.end(JSON.stringify({ message: 'Database error', error: err.message }));
			} else {
				res.writeHead(200);
				res.end(JSON.stringify(rows));
			}
		});

		// Update task status
	} else if (req.method === 'POST' && pathname === '/tasks/update') {
		let body = '';
		req.on('data', chunk => (body += chunk.toString()));
		req.on('end', () => {
			const { task_id, status } = JSON.parse(body);
			const valid = ['Pending', 'In Progress', 'Completed'];
			if (!task_id || !status || !valid.includes(status)) {
				res.writeHead(400);
				res.end(JSON.stringify({ message: 'Invalid task id or status' }));
				return;
			}
			db.query('UPDATE tasks SET status = ? WHERE id = ?', [status, task_id], (err, result) => {
				if (err) {
					res.writeHead(500);
					res.end(JSON.stringify({ message: 'Database error', error: err.message }));
				} else if (result.affectedRows === 0) {
					res.writeHead(404);
					res.end(JSON.stringify({ message: 'Task not found' }));
				} else {
					res.writeHead(200);
					res.end(JSON.stringify({ message: 'Task status updated' }));
				}
			});
		});
	} else if (req.method === 'POST' && pathname === '/login') {
		let body = '';
		req.on('data', chunk => (body += chunk.toString()));
		req.on('end', () => {
			const { email, password } = JSON.parse(body);
			if (!email || !password) {
				res.writeHead(400);
				res.end(JSON.stringify({ message: 'Email and password required' }));
				return;
			}
			db.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
				if (err) {
					res.writeHead(500);
					res.end(JSON.stringify({ message: 'Database error' }));
				} else if (rows.length === 0) {
					res.writeHead(401);
					res.end(JSON.stringify({ message: 'Invalid credentials' }));
				} else {
					const user = rows[0];
					bcrypt.compare(password, user.password, (err, match) => {
						if (err || !match) {
							res.writeHead(401);
							res.end(JSON.stringify({ message: 'Invalid credentials' }));
						} else {
							delete user.password;
							res.writeHead(200);
							res.end(JSON.stringify({ message: 'Login successful', user }));
						}
					});
				}
			});
		});

		// Static file fallback
	} else if (req.method === 'GET') {
		const publicPath = path.join(__dirname, '../public');
		const filePath = path.join(publicPath, pathname === '/' ? 'login.html' : pathname);
		fs.readFile(filePath, (err, data) => {
			if (!err) {
				const ext = path.extname(filePath).slice(1);
				const types = { html: 'text/html', js: 'text/javascript', css: 'text/css' };
				res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
				res.end(data);
			} else {
				res.writeHead(404);
				res.end(JSON.stringify({ message: 'File not found' }));
			}
		});
	} else {
		res.writeHead(404);
		res.end(JSON.stringify({ message: 'Not found' }));
	}
});

server.listen(3000, () => {
	console.log('Server running on http://localhost:3000');
});
