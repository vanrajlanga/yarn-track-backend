import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { Order, OrderStatusHistory, OrderItem, User } from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";

const router = Router();

// Get all orders with filters
router.get("/", authenticateToken, async (req, res) => {
	try {
		const { status, searchTerm, salespersonId, startDate, endDate } =
			req.query;

		const where = {};

		// Apply role-based filtering
		if (req.user?.role === "sales") {
			where.salespersonId = req.user.id;
		} else if (req.user?.role === "factory") {
			where.currentStatus = {
				[Op.notIn]: ["received", "packed"],
			};
		}

		// Apply status filter
		if (status && status !== "all") {
			where.currentStatus = status;
		}

		// Apply search filter
		if (searchTerm) {
			where[Op.or] = [
				{ sdyNumber: { [Op.like]: `%${searchTerm}%` } },
				{ partyName: { [Op.like]: `%${searchTerm}%` } },
				{ deliveryParty: { [Op.like]: `%${searchTerm}%` } },
			];
		}

		// Apply salesperson filter
		if (salespersonId && salespersonId !== "all") {
			where.salespersonId = salespersonId;
		}

		// Apply date range filter
		if (startDate) {
			where.date = {
				...where.date,
				[Op.gte]: new Date(startDate),
			};
		}
		if (endDate) {
			where.date = {
				...where.date,
				[Op.lte]: new Date(endDate),
			};
		}

		const orders = await Order.findAll({
			where,
			include: [
				{
					model: OrderStatusHistory,
					include: [{ model: User, attributes: ["id", "username"] }],
					order: [["createdAt", "DESC"]],
				},
				{
					model: OrderItem,
					as: "items",
				},
				{
					model: User,
					as: "salesperson",
					attributes: ["id", "username"],
				},
			],
			order: [["date", "DESC"]],
		});

		res.json(orders);
	} catch (error) {
		console.error("Error fetching orders:", error);
		res.status(500).json({ error: "Failed to fetch orders" });
	}
});

// Create new order
router.post("/", authenticateToken, async (req, res) => {
	const transaction = await sequelize.transaction();

	try {
		const {
			sdyNumber,
			date,
			partyName,
			deliveryParty,
			salespersonId,
			deniers,
			slNumbersWithQuantities,
		} = req.body;

		// Validate required fields
		if (
			!sdyNumber ||
			!date ||
			!partyName ||
			!deliveryParty ||
			!salespersonId
		) {
			return res
				.status(400)
				.json({ error: "Basic order information is required" });
		}

		// Require at least some denier or SL number entries
		if (
			(!deniers || !deniers.length) &&
			(!slNumbersWithQuantities || !slNumbersWithQuantities.length)
		) {
			return res
				.status(400)
				.json({
					error: "At least one Denier or SL Number with Quantity is required",
				});
		}

		// Check if user has permission to create orders
		if (!req.user || !["admin", "operator"].includes(req.user.role)) {
			return res
				.status(403)
				.json({ error: "Not authorized to create orders" });
		}

		// Create order with initial status
		const order = await Order.create(
			{
				sdyNumber,
				date,
				partyName,
				deliveryParty,
				salespersonId,
				currentStatus: "received",
			},
			{ transaction }
		);

		// Create denier items
		if (deniers && deniers.length) {
			await Promise.all(
				deniers.map((denier) =>
					OrderItem.create(
						{
							orderId: order.id,
							denier,
							itemType: "denier",
						},
						{ transaction }
					)
				)
			);
		}

		// Create SL number items with quantities
		if (slNumbersWithQuantities && slNumbersWithQuantities.length) {
			await Promise.all(
				slNumbersWithQuantities.map((item) =>
					OrderItem.create(
						{
							orderId: order.id,
							slNumber: item.slNumber,
							quantity: item.quantity,
							itemType: "sl_quantity",
						},
						{ transaction }
					)
				)
			);
		}

		// Create initial status history entry
		await OrderStatusHistory.create(
			{
				orderId: order.id,
				status: "received",
				updatedBy: req.user.id,
			},
			{ transaction }
		);

		await transaction.commit();

		// Fetch the complete order with relations
		const completeOrder = await Order.findByPk(order.id, {
			include: [
				{
					model: OrderStatusHistory,
					include: [{ model: User, attributes: ["id", "username"] }],
				},
				{
					model: OrderItem,
					as: "items",
				},
				{
					model: User,
					as: "salesperson",
					attributes: ["id", "username"],
				},
			],
		});

		res.status(201).json(completeOrder);
	} catch (error) {
		await transaction.rollback();
		console.error("Error creating order:", error);
		res.status(500).json({ error: "Failed to create order" });
	}
});

// Update order status
router.patch("/:id/status", authenticateToken, async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		if (!req.user) {
			return res.status(401).json({ error: "User not authenticated" });
		}

		const order = await Order.findByPk(id);
		if (!order) {
			return res.status(404).json({ error: "Order not found" });
		}

		// Check if user has permission to update status
		const canUpdate = (() => {
			if (req.user.role === "admin") return true;
			if (req.user.role === "factory") {
				return (
					order.currentStatus !== "received" &&
					order.currentStatus !== "packed"
				);
			}
			if (req.user.role === "operator") {
				return order.currentStatus === "received";
			}
			return false;
		})();

		if (!canUpdate) {
			return res
				.status(403)
				.json({ error: "Not authorized to update order status" });
		}

		// Update order status
		await order.update({ currentStatus: status });

		// Create status history entry
		await OrderStatusHistory.create({
			orderId: order.id,
			status,
			updatedBy: req.user.id,
		});

		// Fetch updated order with relations
		const updatedOrder = await Order.findByPk(id, {
			include: [
				{
					model: OrderStatusHistory,
					include: [{ model: User, attributes: ["id", "username"] }],
					order: [["createdAt", "DESC"]],
				},
				{
					model: OrderItem,
					as: "items",
				},
				{
					model: User,
					as: "salesperson",
					attributes: ["id", "username"],
				},
			],
		});

		res.json(updatedOrder);
	} catch (error) {
		console.error("Error updating order status:", error);
		res.status(500).json({ error: "Failed to update order status" });
	}
});

// Get order details
router.get("/:id", authenticateToken, async (req, res) => {
	try {
		const { id } = req.params;

		if (!req.user) {
			return res.status(401).json({ error: "User not authenticated" });
		}

		const order = await Order.findByPk(id, {
			include: [
				{
					model: OrderStatusHistory,
					include: [{ model: User, attributes: ["id", "username"] }],
					order: [["createdAt", "DESC"]],
				},
				{
					model: OrderItem,
					as: "items",
				},
				{
					model: User,
					as: "salesperson",
					attributes: ["id", "username"],
				},
			],
		});

		if (!order) {
			return res.status(404).json({ error: "Order not found" });
		}

		// Check if user has permission to view this order
		if (req.user.role === "sales" && order.salespersonId !== req.user.id) {
			return res
				.status(403)
				.json({ error: "Not authorized to view this order" });
		}

		res.json(order);
	} catch (error) {
		console.error("Error fetching order details:", error);
		res.status(500).json({ error: "Failed to fetch order details" });
	}
});

export default router;
