const express = require("express");
const User = require("../models/user");
const router = new express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const { sendWelcomeEmail, sendCancelEmail } = require("../emails/account");

router.post("/users", async (req, res) => {
	const user = new User(req.body);
	try {
		await user.save();
		sendWelcomeEmail(user.email, user.name);
		const token = await user.generateAuthToken();
		res.status(201).send({ user, token });
	} catch (e) {
		res.status(400).send(e);
	}
});

router.post("/users/login", async (req, res) => {
	try {
		const user = await User.findByCredentials(
			req.body.email,
			req.body.password
		);

		const token = await user.generateAuthToken();
		res.send({ user, token });
	} catch (error) {
		res.status(400).send();
	}
});

router.post("/users/logout", auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter((token) => {
			return token.token !== req.token;
		});
		await req.user.save();
		res.send();
	} catch (error) {
		res.status(500).send();
	}
});

router.post("/users/logoutAll", auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (error) {
		res.status(500).send(error);
	}
});

router.get("/users/me", auth, async (req, res) => {
	res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowUpdates = ["name", "email", "password", "age"];
	const isValidOperation = updates.every((update) => {
		return allowUpdates.includes(update);
	});

	if (!isValidOperation) {
		return res.status(400).send({ Error: "Invalid operation" });
	}

	try {
		updates.forEach((update) => {
			req.user[update] = req.body[update];
		});
		await req.user.save();
		res.send(req.user);
	} catch (error) {
		res.status(404).send(error);
	}
});

router.delete("/users/me", auth, async (req, res) => {
	try {
		const email = req.user.email;
		const name = req.user.name;
		// const user = await User.findByIdAndDelete(req.user._id);
		await req.user.remove();
		sendCancelEmail(email, name);
		res.send(req.user);
	} catch (error) {
		res.status(404).send(error);
	}
});

const upload = multer({
	limits: {
		fileSize: 1000000,
	},
	fileFilter(req, file, callback) {
		if (!file.originalname.match(".(jpg|jpeg|png)$")) {
			return callback(
				new Error("Please upload a file with either extensions: jpg, jpeg, png")
			);
		}
		callback(undefined, true);
	},
});
router.post(
	"/users/me/avatar",
	auth,
	upload.single("avatar"),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer)
			.resize(250, 250)
			.png()
			.toBuffer();
		req.user.avatar = buffer;
		await req.user.save();
		res.send();
	},
	(error, req, res, next) => {
		res.status(400).send({ Error: error.message });
	}
);

router.delete("/users/me/avatar", auth, async (req, res) => {
	try {
		req.user.avatar = undefined;
		await req.user.save();
		res.send();
	} catch (error) {
		res.status(400).send();
	}
});

router.get("/users/:id/avatar", async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user || !user.avatar) {
			throw new Error();
		}

		res.set("Content-Type", "image/png");
		res.send(user.avatar);
	} catch (error) {
		res.status(404).send();
	}
});

module.exports = router;
