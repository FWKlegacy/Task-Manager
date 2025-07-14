const api = 'https://task-manager-production-588c.up.railway.app';
const userId = sessionStorage.getItem('user_id');
const role = sessionStorage.getItem('role');

if (!userId || role !== 'admin') {
	window.location.href = 'login.html';
}

document.getElementById('addUserForm').addEventListener('submit', async e => {
	e.preventDefault();
	const form = e.target;
	const user = {
		name: form.name.value,
		email: form.email.value,
		password: form.password.value,
		role: form.role.value,
	};

	const res = await fetch(`${api}/users`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(user),
	});
	const data = await res.json();
	showAlert(data.message, res.ok ? 'success' : 'error');
	form.reset();
	loadUsers();
});

function assignTask() {
	const title = document.getElementById('title').value;
	const description = document.getElementById('description').value;
	const assigned_to = document.getElementById('assignedTo').value;
	const deadline = document.getElementById('deadline').value;

	if (!title || !assigned_to || !deadline) {
		showAlert('Please fill all required task fields', 'error');
		return;
	}

	fetch(`${api}/tasks`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ title, description, assigned_to, deadline }),
	})
		.then(res => res.json().then(data => ({ ok: res.ok, data })))
		.then(({ ok, data }) => {
			showAlert(data.message || 'Task assigned', ok ? 'success' : 'error');
		})
		.catch(() => showAlert('Error assigning task', 'error'));
}

function editUser() {
	const user_id = document.getElementById('editUserId').value;
	const name = document.getElementById('editName').value;
	const email = document.getElementById('editEmail').value;
	const role = document.getElementById('editRole').value;

	if (!user_id) {
		showAlert('User ID is required to edit', 'error');
		return;
	}

	fetch(`${api}/users/edit`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ user_id, name, email, role }),
	})
		.then(res => res.json().then(data => ({ ok: res.ok, data })))
		.then(({ ok, data }) => {
			showAlert(data.message || 'User updated', ok ? 'success' : 'error');
			loadUsers();
		})
		.catch(() => showAlert('Error editing user', 'error'));
}

function deleteUser() {
	const user_id = document.getElementById('editUserId').value;
	if (!user_id) {
		showAlert('User ID is required to delete', 'error');
		return;
	}

	fetch(`${api}/users/delete`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ user_id }),
	})
		.then(res => res.json().then(data => ({ ok: res.ok, data })))
		.then(({ ok, data }) => {
			showAlert(data.message || 'User deleted', ok ? 'success' : 'error');
			loadUsers();
		})
		.catch(() => showAlert('Error deleting user', 'error'));
}

function showAlert(message, type = 'success') {
	const alertBox = document.getElementById('alert');
	alertBox.textContent = message;
	alertBox.className = `alert ${type}`;
	alertBox.style.display = 'block';

	setTimeout(() => {
		alertBox.textContent = '';
		alertBox.className = 'alert';
		alertBox.style.display = 'none';
	}, 3000);
}

async function loadUsers() {
	const res = await fetch(`${api}/users`);
	const users = await res.json();
	const tbody = document.querySelector('#userTable tbody');
	tbody.innerHTML = '';
	users.forEach(user => {
		const row = document.createElement('tr');
		row.innerHTML = `
			<td>${user.id}</td>
			<td>${user.name}</td>
			<td>${user.email}</td>
			<td>${user.role}</td>
		`;
		tbody.appendChild(row);
	});
}

function logout() {
	sessionStorage.clear();
	window.location.href = 'login.html';
}

loadUsers();
