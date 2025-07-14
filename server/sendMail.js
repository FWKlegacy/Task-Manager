const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'wanjalawafulabrevian@gmail.com',
		pass: 'rndb xiza wmnn yjkl',
	},
});

function sendTaskAssignmentEmail(to, taskTitle, deadline) {
	const mailOptions = {
		from: '"Task Manager" wanjalawafulabrevian@gmail.com',
		to,
		subject: 'New Task Assigned',
		html: `
      <h3>You have been assigned a new task</h3>
      <p><strong>Title:</strong> ${taskTitle}</p>
      <p><strong>Deadline:</strong> ${deadline}</p>
      <p>Please log in to the system to update your task status.</p>
    `,
	};

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.error('Email error:', error.message);
		} else {
			console.log('Email sent:', info.response);
		}
	});
}

module.exports = sendTaskAssignmentEmail;
