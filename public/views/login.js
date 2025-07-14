const api = 'https://task-manager-production-588c.up.railway.app';
document.getElementById('loginForm').addEventListener('submit', async e => {
	e.preventDefault();

	const email = document.getElementById('email').value;
	const password = document.getElementById('password').value;

	try {
		const res = await fetch(`${api}/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
		});

		if (!res.ok) {
			throw new Error('Login failed');
		}

		const data = await res.json();

		// Storing user info in session storage
		sessionStorage.setItem('user_id', data.user.id);
		sessionStorage.setItem('role', data.user.role);
		sessionStorage.setItem('name', data.user.name);

		// Redirect based on role
		if (data.user.role === 'admin') {
			window.location.href = 'admin.html';
		} else {
			window.location.href = 'user.html';
		}
	} catch (err) {
		showAlert('Invalid email or password', 'error');
	}
});

function showAlert(message, type = 'error') {
	const alertBox = document.getElementById('error');
	if (alertBox) {
		alertBox.innerText = message;
	}
}
