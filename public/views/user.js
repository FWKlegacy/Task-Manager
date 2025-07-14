const userId = sessionStorage.getItem('user_id');
const role = sessionStorage.getItem('role');

if (!userId || role !== 'user') {
	window.location.href = 'login.html';
}

function fetchTasks() {
	const userId = document.getElementById('userId').value;
	if (!userId) return alert('Please enter your user ID');

	fetch(`/tasks?user_id=${userId}`)
		.then(res => res.json())
		.then(tasks => {
			const container = document.getElementById('tasks');
			container.innerHTML = '';

			if (tasks.length === 0) {
				container.innerHTML = '<p>No tasks assigned.</p>';
				return;
			}

			tasks.forEach(task => {
				const div = document.createElement('div');
				div.className = 'task';
				div.innerHTML = `
					<h3>${task.title}</h3>
					<p>${task.description}</p>
					<p><strong>Deadline:</strong> ${task.deadline}</p>
					<p><strong>Status:</strong> 
						<select onchange="updateStatus(${task.id}, this.value)">
							<option ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
							<option ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
							<option ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
						</select>
					</p>
				`;
				container.appendChild(div);
			});
		})
		.catch(err => {
			console.error(err);
			alert('Failed to load tasks.');
		});
}

function updateStatus(taskId, status) {
	fetch('/tasks/update', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ task_id: taskId, status }),
	})
		.then(res => res.json())
		.then(data => {
			alert(data.message);
		})
		.catch(err => {
			console.error(err);
			alert('Failed to update task status.');
		});
}
document.getElementById('loadBtn').addEventListener('click', fetchTasks);

function logout() {
	sessionStorage.clear();
	window.location.href = 'login.html';
}
