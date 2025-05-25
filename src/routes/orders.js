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
import ExcelJS from 'exceljs'; // Import exceljs
import { format } from 'date-fns'; // Import format from date-fns

const router = Router();

// Get all orders with filters and pagination
router.get("/", authenticateToken, async (req, res) => {
	try {
		const { status, searchTerm, salespersonId, startDate, endDate, page, limit } =
			req.query;

		const where = {};

		// Apply role-based filtering
		if (req.user?.role === "sales") {
			where.salespersonId = req.user.id;
		}
		// Add condition for admin role to see all orders
		else if (req.user?.role === "admin") {
			// Admin can see all orders, no salespersonId filter needed
		}
		// Remove status filter for main order
		// if (status && status !== "all") {
		// 	where.currentStatus = status;
		// }

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

		// Pagination
		const pageNumber = parseInt(page, 10) || 1;
		const limitNumber = parseInt(limit, 10) || 10; // Default to 10 items per page
		const offset = (pageNumber - 1) * limitNumber;

		const { count, rows } = await Order.findAndCountAll({
			where,
			include: [
				// Remove OrderStatusHistory include
				// {
				// 	model: OrderStatusHistory,
				// 	include: [{ model: User, attributes: ["id", "username"] }],
				// 	order: [["createdAt", "DESC"]],
				// },
				{
					model: OrderItem,
					as: "items",
					// Include OrderStatusHistory for order items
					include: [{
						model: OrderStatusHistory,
						as: "statusHistory",
						include: [{ model: User, attributes: ['id', 'username'] }],
						order: [['created_at', 'DESC']]
					}]
				},
				{
					model: User,
					as: "salesperson",
					attributes: ["id", "username"],
				},
			],
			order: [["date", "DESC"]],
			limit: limitNumber,
			offset: offset,
			distinct: true,
			col: 'id',
		});

		console.log("Pagination Info:");
		console.log(`Page: ${pageNumber}, Limit: ${limitNumber}, Offset: ${offset}`);
		console.log(`Total Count: ${count}, Rows Returned: ${rows.length}`);
		console.log("Returned Rows:", JSON.stringify(rows, null, 2));

		res.json({ orders: rows, totalCount: count });
	} catch (error) {
		console.error("Error fetching orders:", error);
		res.status(500).json({ error: "Failed to fetch orders" });
	}
});

// Export orders with filters
router.get("/export", authenticateToken, async (req, res) => {
	try {
		const { status, searchTerm, salespersonId, startDate, endDate } = req.query;

		const where = {};

		// Apply role-based filtering
		if (req.user?.role === "sales") {
			where.salespersonId = req.user.id;
		}
		// Add condition for admin role to see all orders
		else if (req.user?.role === "admin") {
			// Admin can see all orders, no salespersonId filter needed
		}

		// Apply status filter for export
		if (status && status !== "all") {
			// For export, we need to filter based on the most recent status of the order items
			// This requires joining with OrderStatusHistory and potentially grouping
			// A simpler approach for now is to fetch all relevant orders and filter in memory
			// or adjust the Sequelize query significantly. Let's start with fetching all and refining.
			// A more robust solution would involve a complex JOIN and WHERE clause on OrderStatusHistory aliases.
			// For this iteration, we will fetch based on main order filters and assume status filtering is less critical for the bulk export.
			// A truly accurate status filter would require filtering by the latest status of each item within the order.
			// To keep this simple for the initial export, the status filter will not be applied at the main order level query.
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

		// Fetch orders (without pagination for export)
		const orders = await Order.findAll({
			where,
			include: [
				{
					model: OrderItem,
					as: "items",
					include: [{
						model: OrderStatusHistory,
						as: "statusHistory",
						include: [{ model: User, attributes: ['id', 'username'] }],
						order: [['created_at', 'DESC']]
					}]
				},
				{
					model: User,
					as: "salesperson",
					attributes: ["id", "username"],
				},
			],
			order: [["date", "DESC"]],
		});

		// Create a new workbook and worksheet
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Orders');

		// Define columns
		worksheet.columns = [
			{ header: 'SDY Number', key: 'sdyNumber', width: 15 },
			{ header: 'Order Date', key: 'date', width: 15 },
			{ header: 'Party Name', key: 'partyName', width: 25 },
			{ header: 'Delivery Party', key: 'deliveryParty', width: 25 },
			{ header: 'Salesperson', key: 'salesperson', width: 20 },
			{ header: 'Item Denier', key: 'denier', width: 15 },
			{ header: 'Item SL Number', key: 'slNumber', width: 15 },
			{ header: 'Item Quantity', key: 'quantity', width: 10 },
			{ header: 'Item Status', key: 'itemStatus', width: 15 },
			{ header: 'Item Status Updated By', key: 'itemStatusUpdatedBy', width: 20 },
		];

		// Add rows to the worksheet
		orders.forEach(order => {
			// Add main order row
			worksheet.addRow({
				sdyNumber: order.sdyNumber,
				date: format(new Date(order.date), 'yyyy-MM-dd'),
				partyName: order.partyName,
				deliveryParty: order.deliveryParty,
				salesperson: order.salesperson?.username,
				// Leave item columns empty for the main order row
				denier: '',
				slNumber: '',
				quantity: '',
				itemStatus: '',
				itemStatusUpdatedBy: '',
			});

			// Add item rows
			if (order.items && order.items.length > 0) {
				order.items.forEach(item => {
					// Find the most recent status history entry for the item
					const latestStatusHistory = item.statusHistory
						? item.statusHistory.reduce((latest, current) => {
							return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
						}, item.statusHistory[0])
						: null;

					worksheet.addRow({
						// Leave main order columns empty for item rows, or repeat if preferred
						sdyNumber: '', // Or order.sdyNumber
						date: '', // Or format(new Date(order.date), 'yyyy-MM-dd')
						partyName: '', // Or order.partyName
						deliveryParty: '', // Or order.deliveryParty
						salesperson: '', // Or order.salesperson?.username
						denier: item.denier,
						slNumber: item.slNumber,
						quantity: item.quantity,
						itemStatus: latestStatusHistory?.status || 'N/A',
						itemStatusUpdatedBy: latestStatusHistory?.User?.username || 'N/A',
					});
				});
			} else {
				// Add a row indicating no items if necessary (optional)
				worksheet.addRow({
					// Repeat main order details for context if no items
					sdyNumber: order.sdyNumber,
					date: format(new Date(order.date), 'yyyy-MM-dd'),
					partyName: order.partyName,
					deliveryParty: order.deliveryParty,
					salesperson: order.salesperson?.username,
					denier: 'N/A', // Indicate no items
					slNumber: 'N/A',
					quantity: 0,
					itemStatus: 'N/A',
					itemStatusUpdatedBy: 'N/A',
				});
			}
		});

		// Generate the buffer
		const buffer = await workbook.xlsx.writeBuffer();

		// Set response headers
		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		);
		res.setHeader(
			'Content-Disposition',
			'attachment; filename=' + `orders_export_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`
		);

		// Send the buffer
		res.send(buffer);

	} catch (error) {
		console.error("Error exporting orders:", error);
		res.status(500).json({ error: "Failed to export orders" });
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

		// Validate required fields (excluding sdyNumber for new orders)
		if (!date || !partyName || !salespersonId) {
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
				// Remove initial currentStatus setting
				// currentStatus: "received",
			},
			{ transaction }
		);

		// Create order items
		if (orderItems && orderItems.length) {
			// Create initial status for each item and create history entry
			await Promise.all(
				orderItems
					.filter(
						(item) =>
							(item.denier && item.denier.trim()) ||
							(item.slNumber && item.slNumber.trim())
					)
					.map(async (item) => {
						const createdItem = await OrderItem.create(
							{
								orderId: order.id,
								denier: item.denier,
								slNumber: item.slNumber,
								quantity: item.quantity || 1,
								status: "received", // Set initial status for item
							},
							{ transaction }
						);
						// Create initial status history entry for the item
						await OrderStatusHistory.create({
							orderItemId: createdItem.id,
							status: "received",
							updatedBy: req.user.id,
						}, { transaction });
						return createdItem; // Return the created item for Promise.all
					})
			);
		}

		// Remove Create initial status history entry for order
		// await OrderStatusHistory.create({
		// 	orderId: order.id,
		// 	status: "received",
		// 	updatedBy: req.user.id,
		// }, { transaction });

		await transaction.commit();

		// Fetch the complete order with relations (including updated items and their history)
		const completeOrder = await Order.findByPk(order.id, {
			include: [
				// Remove OrderStatusHistory include
				// {
				// 	model: OrderStatusHistory,
				// 	include: [{ model: User, attributes: ["id", "username"] }],
				// 	order: [["createdAt", "DESC"]],
				// },
				{
					model: OrderItem,
					as: "items",
					// Include OrderStatusHistory for order items
					include: [{
						model: OrderStatusHistory,
						as: "statusHistory",
						include: [{ model: User, attributes: ['id', 'username'] }],
						order: [['created_at', 'DESC']]
					}]
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

// Remove Update order status route
// router.patch("/:id/status", authenticateToken, async (req, res) => {
// 	try {
// 		const { id } = req.params;
// 		const { status } = req.body;

// 		if (!req.user) {
// 			return res.status(401).json({ error: "User not authenticated" });
// 		}

// 		const order = await Order.findByPk(id);
// 		if (!order) {
// 			return res.status(404).json({ error: "Order not found" });
// 		}

// 		// Check if user has permission to update status (only operator)
// 		if (req.user.role !== "operator") {
// 			return res
// 				.status(403)
// 				.json({ error: "Not authorized to update order status" });
// 		}

// 		// Update order status
// 		await order.update({ currentStatus: status });

// 		// Create status history entry
// 		await OrderStatusHistory.create({
// 			orderId: order.id,
// 			status,
// 			updatedBy: req.user.id,
// 		});

// 		// Fetch updated order with relations
// 		const updatedOrder = await Order.findByPk(id, {
// 			include: [
// 				{
// 					model: OrderStatusHistory,
// 					include: [{ model: User, attributes: ["id", "username"] }],
// 					order: [["createdAt", "DESC"]],
// 				},
// 				{
// 					model: OrderItem,
// 					as: "items",
// 				},
// 				{
// 					model: User,
// 					as: "salesperson",
// 					attributes: ["id", "username"],
// 				},
// 			],
// 		});

// 		res.json(updatedOrder);
// 	} catch (error) {
// 		console.error("Error updating order status:", error);
// 		res.status(500).json({ error: "Failed to update order status" });
// 	}
// });

// Update an order (with change request)
router.patch("/:id", authenticateToken, async (req, res) => {
	const transaction = await sequelize.transaction();

	try {
		const { id } = req.params;
		const updateData = req.body;

		// Check if user has permission to edit orders
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

		// Check if factory user has already used their one-time edit
		if (req.user.role === "factory" && order.factoryOneTimeEditUsed) {
			await transaction.rollback();
			return res.status(403).json({
				error: "Factory role has already used their one-time edit for this order. Please request a change.",
			});
		}

		// Remove date from update data to prevent changing it
		if (updateData.date && updateData.date !== order.date) {
			await transaction.rollback();
			return res.status(400).json({ error: "Date cannot be modified" });
		}

		// For factory role, handle one-time edit of deliveryParty and sdyNumber
		if (req.user.role === "factory") {
			const { deliveryParty, sdyNumber } = updateData;

			// Prepare update object, only including fields present in updateData
			const factoryUpdate = {};
			if (deliveryParty !== undefined) factoryUpdate.deliveryParty = deliveryParty;
			if (sdyNumber !== undefined) factoryUpdate.sdyNumber = sdyNumber;

			// Ensure at least one of the editable fields is being updated
			if (Object.keys(factoryUpdate).length === 0) {
				await transaction.rollback();
				return res.status(400).json({ error: "No valid fields provided for factory edit." });
			}

			// Validate required fields for factory edit if they are being updated
			if (deliveryParty !== undefined && !deliveryParty.trim()) {
				await transaction.rollback();
				return res.status(400).json({ error: "Delivery Party cannot be empty." });
			}
			// SDY Number validation is handled by the model's allowNull: false constraint on creation
			// but for update, we should ensure if it's provided, it's not empty
			if (sdyNumber !== undefined && !sdyNumber.trim()) {
				await transaction.rollback();
				return res.status(400).json({ error: "SDY Number cannot be empty." });
			}

			// Update allowed fields and mark one-time edit as used
			await order.update({ ...factoryUpdate, factoryOneTimeEditUsed: true }, { transaction });

		} else if (req.user.role === "operator") {
			// For operator role, update all allowed fields
			// Exclude factoryOneTimeEditUsed from operator updates
			const operatorUpdateData = { ...updateData };
			delete operatorUpdateData.factoryOneTimeEditUsed;
			await order.update(operatorUpdateData, { transaction });

		} else {
			// Sales and Admin roles are not allowed to edit
			await transaction.rollback();
			return res.status(403).json({ error: "Not authorized to edit orders" });
		}

		// Order item updates will be handled by a separate endpoint
		// if (updateData.orderItems) {
		// 	// Validate that we have at least one valid item
		// 	const validItems = updateData.orderItems.filter(
		// 		(item) =>
		// 			(item.denier && item.denier.trim()) ||
		// 			(item.slNumber && item.slNumber.trim())
		// 	);

		// 	if (validItems.length === 0) {
		// 		await transaction.rollback();
		// 		return res.status(400).json({
		// 			error: "At least one item with Denier or SL Number is required",
		// 		});
		// 	}

		// 	// Delete existing items
		// 	await OrderItem.destroy({
		// 		where: { orderId: order.id },
		// 		transaction,
		// 	});

		// 	// Create new items, ensuring quantity is a number
		// 	await Promise.all(
		// 		validItems.map((item) =>
		// 			OrderItem.create(
		// 				{
		// 					orderId: order.id,
		// 					denier: item.denier?.trim() || null,
		// 					slNumber: item.slNumber?.trim() || null,
		// 					quantity: parseInt(item.quantity, 10) || 1,
		// 				},
		// 				{ transaction }
		// 			)
		// 	);
		// }

		await transaction.commit();

		// Fetch the updated order with all its relations (including updated items and their history)
		const updatedOrder = await Order.findByPk(id, {
			include: [
				{
					model: OrderItem,
					as: "items",
					include: [{
						model: OrderStatusHistory,
						as: "statusHistory",
						include: [{ model: User, attributes: ['id', 'username'] }],
						order: [['created_at', 'DESC']]
					}]
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
// Keep this route as it requests changes to the main order details (like deliveryParty)
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
				req.user.role === "factory" ? "deliveryParty" : "general_edit", // Keep deliveryParty for factory change requests
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
				// Remove OrderStatusHistory include
				// {
				// 	model: OrderStatusHistory,
				// 	include: [{ model: User, attributes: ["id", "username"] }],
				// 	order: [["createdAt", "DESC"]],
				// },
				{
					model: OrderItem,
					as: "items",
					// Include OrderStatusHistory for order items
					include: [{
						model: OrderStatusHistory,
						as: "statusHistory",
						include: [{ model: User, attributes: ['id', 'username'] }],
						order: [['created_at', 'DESC']]
					}]
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
