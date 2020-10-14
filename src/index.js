const express = require("express");

// connect to database
require("./db/mongoose"); // file will run

// models
const userRouter = require("./routers/users");
const taskRouter = require("./routers/tasks");

const app = express();
const port = process.env.PORT;

// Maintainain
// app.use((req, res, next) => {
// 	res
// 		.status(503)
// 		.send("Sorry, we are maintaining the server, please come back later");
// });

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
	console.log("Server is up on port " + port);
});
