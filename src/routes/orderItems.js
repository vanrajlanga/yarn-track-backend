import express from "express";
import { OrderItem, Order, OrderStatusHistory, User } from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// PUT /api/order-items/:id/status - Update order item status and create history
router.put("/:id/status", authenticateToken, async (req, res) => {
	try {
		const { status } = req.body;
		const orderItemId = req.params.id;

		const orderItem = await OrderItem.findByPk(orderItemId);

		if (!orderItem) {
			return res.status(404).json({ error: "Order item not found" });
		}

		// Add permission check for updating item status (only operator)
		if (req.user.role !== "factory") {
			return res.status(403).json({ error: "Not authorized to update order item status" });
		}

		// Update the status
		await orderItem.update({ status });

		// Create status history entry for the item
		await OrderStatusHistory.create({
			orderItemId: orderItemId,
			status: status,
			updatedBy: req.user.id,
		});

		// Fetch the updated item with its history
		const updatedItem = await OrderItem.findByPk(orderItemId, {
			include: [{
				model: OrderStatusHistory,
				as: "statusHistory",
				include: [{ model: User, attributes: ['id', 'username'] }],
				order: [['created_at', 'DESC']]
			}]
		});

		res.json(updatedItem);
	} catch (error) {
		console.error("Error updating order item status:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /api/order-items/:id/history - Get status history for an order item
router.get("/:id/history", authenticateToken, async (req, res) => {
	try {
		const orderItemId = req.params.id;

		// Check if the user has permission to view the order item's history
		// This could involve checking if they have permission to view the parent order
		// For simplicity, assuming if they can access this endpoint, they can view history

		const history = await OrderStatusHistory.findAll({
			where: { orderItemId: orderItemId },
			include: [{
				model: User,
				attributes: ['id', 'username']
			}],
			order: [['created_at', 'ASC']] // Order history chronologically
		});

		if (!history || history.length === 0) {
			return res.status(404).json({ error: "Status history not found for this item" });
		}

		res.json(history);
	} catch (error) {
		console.error("Error fetching order item history:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
