const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: "vubaoanhdung@gmail.com",
		subject: "Welcome",
		text: `Welcome to the app, ${name}. Let me know how you get along with the app.`,
	});
};

const sendCancelEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: "vubaoanhdung@gmail.com",
		subject: "See you later",
		text: `I'm sorry that you're leaving, ${name}. If there is anything that we can do to make it better, please let us know`,
	});
};

module.exports = {
	sendWelcomeEmail,
	sendCancelEmail,
};
