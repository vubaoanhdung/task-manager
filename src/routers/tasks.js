const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = new express.Router();

router.post("/tasks", auth, async (req, res) => {
	const task = new Task({
		...req.body,
		owner: req.user._id,
	});
	try {
		await task.save();
		res.status(201).send(task);
	} catch (error) {
		res.status(400).send();
	}
});

// GET /tasks?completed=true or false
// Pagination: limit skip => GET /tasks?limit=10&skip=20
// GET /tasks/?sortBy=createdAt:desc
router.get("/tasks", auth, async (req, res) => {
	const match = {};
	if (req.query.completed) {
		match.completed = req.query.completed === "true";
	}

	const sort = {};
	if (req.query.sortBy) {
		const parts = req.query.sortBy.split(":");
		sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
	}

	try {
		const user = req.user;
		await user
			.populate({
				path: "tasks",
				match,
				options: {
					limit: parseInt(req.query.limit),
					skip: parseInt(req.query.skip),
					sort,
				},
			})
			.execPopulate();
		const tasks = user.tasks;
		res.send(tasks);
	} catch (error) {
		res.status(400).send();
	}
});

router.get("/tasks/:id", auth, async (req, res) => {
	const _id = req.params.id;
	try {
		const task = await Task.findOne({ _id, owner: req.user._id });
		if (!task) {
			return res.status(404).send();
		}
		res.send(task);
	} catch (error) {
		res.status(400).send();
	}
});

router.patch("/tasks/:id", auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowUpdates = ["description", "completed"];
	const isValidOperation = updates.every((update) => {
		return allowUpdates.includes(update);
	});

	if (!isValidOperation) {
		return res.status(400).send({
			Error: "Invalid operation",
		});
	}
	try {
		const task = await Task.findOne({
			_id: req.params.id,
			owner: req.user._id,
		});
		if (!task) {
			return res.status(404).send();
		}
		updates.forEach((update) => {
			task[update] = req.body[update];
		});
		await task.save();
		res.send(task);
	} catch (error) {
		res.status(404).send(error);
	}
});

router.delete("/tasks/:id", auth, async (req, res) => {
	try {
		const task = await Task.findOneAndDelete({
			_id: req.params.id,
			owner: req.user._id,
		});
		if (!task) {
			res.status(404).send();
		}
		res.send(task);
	} catch (error) {
		res.status(500).send();
	}
});

module.exports = router;
