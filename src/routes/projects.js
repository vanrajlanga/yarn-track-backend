import express from "express";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";

// NOTE: Project, Yarn, and Pattern models have been removed from the application

const router = express.Router();

// Projects endpoints have been disabled as the related models were removed
router.get("/", authenticateToken, async (req, res) => {
	res.status(404).json({
		message: "Project functionality has been removed from the application",
	});
});

// Get single project - disabled
router.get("/:id", authenticateToken, async (req, res) => {
	res.status(404).json({
		message: "Project functionality has been removed from the application",
	});
});

// Create project - disabled
router.post("/", authenticateToken, async (req, res) => {
	res.status(404).json({
		message: "Project functionality has been removed from the application",
	});
});

// Update project - disabled
router.put("/:id", authenticateToken, async (req, res) => {
	res.status(404).json({
		message: "Project functionality has been removed from the application",
	});
});

// Delete project - disabled
router.delete("/:id", authenticateToken, async (req, res) => {
	res.status(404).json({
		message: "Project functionality has been removed from the application",
	});
});

export default router;
