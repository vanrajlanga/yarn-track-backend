import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
	Order,
	OrderStatusHistory,
	OrderItem,
	User,
	ChangeRequest,
} from "../models/index.js";
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
			orderItems,
		} = req.body;

		// Check if user has permission to create orders (only operator role can create)
		if (!req.user || req.user.role !== "operator") {
			return res
				.status(403)
				.json({ error: "Not authorized to create orders" });
		}

		// Validate required fields
		if (!sdyNumber || !date || !partyName || !salespersonId) {
			return res
				.status(400)
				.json({ error: "Basic order information is required" });
		}

		// Require at least one order item
		if (
			!orderItems ||
			!orderItems.length ||
			!orderItems.some(
				(item) =>
					(item.denier && item.denier.trim()) ||
					(item.slNumber && item.slNumber.trim())
			)
		) {
			return res.status(400).json({
				error: "At least one item with Denier or SL Number is required",
			});
		}

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

		// Create order items
		if (orderItems && orderItems.length) {
			await Promise.all(
				orderItems
					.filter(
						(item) =>
							(item.denier && item.denier.trim()) ||
							(item.slNumber && item.slNumber.trim())
					)
					.map((item) => {
						return OrderItem.create(
							{
								orderId: order.id,
								denier: item.denier,
								slNumber: item.slNumber,
								quantity: item.quantity || 1,
							},
							{ transaction }
						);
					})
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

		// Handle duplicate SDY number error
		if (
			error.name === "SequelizeUniqueConstraintError" &&
			error.errors?.[0]?.path === "idx_sdy_number"
		) {
			return res.status(400).json({
				error: "An order with this SDY number already exists",
				field: "sdyNumber",
			});
		}

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

		// Check if user has permission to update status (only factory and operator)
		if (!["factory", "operator"].includes(req.user.role)) {
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

// Update an order (with change request)
router.patch("/:id", authenticateToken, async (req, res) => {
	const transaction = await sequelize.transaction();

	try {
		const { id } = req.params;
		const updateData = req.body;

		// Check if user has permission to edit orders (only factory and operator)
		if (!["factory", "operator"].includes(req.user.role)) {
			await transaction.rollback();
			return res
				.status(403)
				.json({ error: "Not authorized to edit orders" });
		}

		// Find the order
		const order = await Order.findByPk(id);
		if (!order) {
			await transaction.rollback();
			return res.status(404).json({ error: "Order not found" });
		}

		// Remove date from update data to prevent changing it
		if (updateData.date && updateData.date !== order.date) {
			await transaction.rollback();
			return res.status(400).json({ error: "Date cannot be modified" });
		}

		// For factory role, only allow editing deliveryParty
		if (req.user.role === "factory") {
			const { deliveryParty } = updateData;
			if (Object.keys(updateData).length > 1 || !deliveryParty) {
				await transaction.rollback();
				return res.status(403).json({
					error: "Factory role can only edit the Delivery Party field",
				});
			}
			// Update only the delivery party
			await order.update({ deliveryParty }, { transaction });
		} else {
			// For operator role, update all fields
			await order.update(updateData, { transaction });
		}

		if (updateData.orderItems) {
			// Validate that we have at least one valid item
			const validItems = updateData.orderItems.filter(
				(item) =>
					(item.denier && item.denier.trim()) ||
					(item.slNumber && item.slNumber.trim())
			);

			if (validItems.length === 0) {
				await transaction.rollback();
				return res.status(400).json({
					error: "At least one item with Denier or SL Number is required",
				});
			}

			// Delete existing items
			await OrderItem.destroy({
				where: { orderId: order.id },
				transaction,
			});

			// Create new items, ensuring quantity is a number
			await Promise.all(
				validItems.map((item) =>
					OrderItem.create(
						{
							orderId: order.id,
							denier: item.denier?.trim() || null,
							slNumber: item.slNumber?.trim() || null,
							quantity: parseInt(item.quantity, 10) || 1,
						},
						{ transaction }
					)
				)
			);
		}

		await transaction.commit();

		// Fetch the updated order with all its relations
		const updatedOrder = await Order.findByPk(id, {
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

		res.json(updatedOrder);
	} catch (error) {
		await transaction.rollback();
		console.error("Error updating order:", error);
		res.status(500).json({ error: "Failed to update order" });
	}
});

// Request change to an order (for factory and operator roles)
router.post("/:id/request-change", authenticateToken, async (req, res) => {
	try {
		const { id } = req.params;
		const { requestType } = req.body;

		if (!req.user) {
			return res.status(401).json({ error: "User not authenticated" });
		}

		// Only factory and operator roles can request changes
		if (!["factory", "operator"].includes(req.user.role)) {
			return res.status(403).json({
				error: "Only factory and operator roles can request changes",
			});
		}

		const order = await Order.findByPk(id);
		if (!order) {
			return res.status(404).json({ error: "Order not found" });
		}

		// Create a simplified change request
		const changeRequest = await ChangeRequest.create({
			orderId: order.id,
			requestedBy: req.user.id,
			// For simplified requests, just store the role as the field
			field:
				req.user.role === "factory" ? "deliveryParty" : "general_edit",
			oldValue: "Not specified", // Simplified flow doesn't capture specific values
			newValue: "To be provided after approval",
			reason: `Change requested by ${req.user.role} user`,
			status: "pending",
		});

		// Return the change request
		res.status(201).json({
			message: "Change request has been submitted for admin approval",
			changeRequest,
		});
	} catch (error) {
		console.error("Error creating change request:", error);
		res.status(500).json({ error: "Failed to create change request" });
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
