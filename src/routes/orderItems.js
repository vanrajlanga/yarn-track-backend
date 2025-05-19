import express from "express";
import { OrderItem, Order } from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// PUT /api/order-items/:id/status
router.put("/:id/status", authenticateToken, async (req, res) => {
	try {
		const { status } = req.body;
		const orderItem = await OrderItem.findByPk(req.params.id);

		if (!orderItem) {
			return res.status(404).json({ error: "Order item not found" });
		}

		// Update the status
		await orderItem.update({ status });
		const updatedItem = await OrderItem.findByPk(req.params.id);

		res.json(updatedItem);
	} catch (error) {
		console.error("Error updating order item status:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
