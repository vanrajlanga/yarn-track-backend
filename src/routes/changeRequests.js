import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { ChangeRequest, Order, User } from "../models/index.js";
import sequelize from "../config/db.js";

const router = Router();

// Get all change requests with filtering
router.get("/", authenticateToken, async (req, res) => {
	try {
		const { status, orderId } = req.query;
		const where = {};

		// Apply status filter if provided
		if (status) {
			where.status = status;
		}

		// Apply orderId filter if provided
		if (orderId) {
			where.orderId = orderId;
		}

		// Role-based filtering
		if (req.user.role === "factory") {
			where.requestedBy = req.user.id;
		} else if (req.user.role === "operator") {
			where.requestedBy = req.user.id;
		}

		const changeRequests = await ChangeRequest.findAll({
			where,
			include: [
				{
					model: Order,
					attributes: [
						"id",
						"sdyNumber",
						"partyName",
						"deliveryParty",
					],
				},
				{
					model: User,
					as: "requester",
					attributes: ["id", "username", "role"],
				},
				{
					model: User,
					as: "approver",
					attributes: ["id", "username", "role"],
				},
			],
			order: [["created_at", "DESC"]],
		});

		res.json(changeRequests);
	} catch (error) {
		console.error("Error fetching change requests:", error);
		console.error(error);
		res.status(500).json({ error: "Failed to fetch change requests" });
	}
});

// Create a new change request
router.post("/", authenticateToken, async (req, res) => {
	const transaction = await sequelize.transaction();

	try {
		const { orderId, field, oldValue, newValue, reason } = req.body;

		// Validate required fields
		if (
			!orderId ||
			!field ||
			oldValue === undefined ||
			newValue === undefined ||
			!reason
		) {
			return res.status(400).json({
				error: "All fields are required: orderId, field, oldValue, newValue, reason",
			});
		}

		// Get the referenced order
		const order = await Order.findByPk(orderId);
		if (!order) {
			return res.status(404).json({ error: "Order not found" });
		}

		// Check if user is authorized to request changes
		const isAuthorized = (() => {
			// Factory role can only edit deliveryParty
			if (req.user.role === "factory" && field === "deliveryParty") {
				return true;
			}

			// Operator role can edit anything except date, when order is cancelled or has an issue
			if (req.user.role === "operator" && field !== "date") {
				return true;
			}

			return false;
		})();

		if (!isAuthorized) {
			return res.status(403).json({
				error: "Not authorized to request changes to this field",
			});
		}

		// Create the change request
		const changeRequest = await ChangeRequest.create(
			{
				orderId,
				requestedBy: req.user.id,
				field,
				oldValue,
				newValue,
				reason,
				status: "pending",
			},
			{ transaction }
		);

		await transaction.commit();

		// Get the complete change request with relations
		const completeChangeRequest = await ChangeRequest.findByPk(
			changeRequest.id,
			{
				include: [
					{
						model: Order,
						attributes: [
							"id",
							"sdyNumber",
							"partyName",
							"deliveryParty",
						],
					},
					{
						model: User,
						as: "requester",
						attributes: ["id", "username", "role"],
					},
				],
			}
		);

		res.status(201).json(completeChangeRequest);
	} catch (error) {
		await transaction.rollback();
		console.error("Error creating change request:", error);
		res.status(500).json({ error: "Failed to create change request" });
	}
});

// Approve or reject a change request (admin only)
router.patch("/:id/process", authenticateToken, async (req, res) => {
	const transaction = await sequelize.transaction();

	try {
		const { id } = req.params;
		const { status, adminNote } = req.body;

		// Validate required parameters
		if (!status || !["approved", "rejected"].includes(status)) {
			return res.status(400).json({
				error: "Valid status (approved or rejected) is required",
			});
		}

		// Check if user is admin
		if (req.user.role !== "admin") {
			return res.status(403).json({
				error: "Only admins can approve or reject change requests",
			});
		}

		// Find the change request
		const changeRequest = await ChangeRequest.findByPk(id);
		if (!changeRequest) {
			return res.status(404).json({ error: "Change request not found" });
		}

		// Update the change request
		await changeRequest.update(
			{
				status,
				approvedBy: req.user.id,
				adminNote,
			},
			{ transaction }
		); // If approved, we simply update the request status - no need to modify the order
		if (status === "approved") {
			const order = await Order.findByPk(changeRequest.orderId);
			if (!order) {
				await transaction.rollback();
				return res
					.status(404)
					.json({ error: "Associated order not found" });
			}

			// No need to update the order itself anymore
			// The approval status on the change request is sufficient
		}

		await transaction.commit();

		// Get the updated change request with associations
		const updatedChangeRequest = await ChangeRequest.findByPk(id, {
			include: [
				{
					model: Order,
					attributes: [
						"id",
						"sdyNumber",
						"partyName",
						"deliveryParty",
					],
				},
				{
					model: User,
					as: "requester",
					attributes: ["id", "username", "role"],
				},
				{
					model: User,
					as: "approver",
					attributes: ["id", "username", "role"],
				},
			],
		});

		res.json(updatedChangeRequest);
	} catch (error) {
		await transaction.rollback();
		console.error("Error processing change request:", error);
		res.status(500).json({ error: "Failed to process change request" });
	}
});

// Mark an approved change request as used
router.patch("/:id/mark-used", authenticateToken, async (req, res) => {
	const transaction = await sequelize.transaction();

	try {
		const { id } = req.params;

		// Find the change request
		const changeRequest = await ChangeRequest.findByPk(id);
		if (!changeRequest) {
			await transaction.rollback();
			return res.status(404).json({ error: "Change request not found" });
		}

		// Check if change request is approved
		if (changeRequest.status !== "approved") {
			await transaction.rollback();
			return res.status(400).json({
				error: "Only approved change requests can be marked as used",
			});
		}

		// Check if change request has already been used
		if (changeRequest.isEditUsed) {
			await transaction.rollback();
			return res
				.status(400)
				.json({ error: "This change request has already been used" });
		}

		// Check if the user was the requester of this change
		if (changeRequest.requestedBy !== req.user.id) {
			await transaction.rollback();
			return res.status(403).json({
				error: "Only the user who requested the change can mark it as used",
			});
		}

		// Update the change request
		await changeRequest.update(
			{
				isEditUsed: true,
			},
			{ transaction }
		);

		await transaction.commit();

		// Get the updated change request with associations
		const updatedChangeRequest = await ChangeRequest.findByPk(id, {
			include: [
				{
					model: Order,
					attributes: [
						"id",
						"sdyNumber",
						"partyName",
						"deliveryParty",
					],
				},
				{
					model: User,
					as: "requester",
					attributes: ["id", "username", "role"],
				},
				{
					model: User,
					as: "approver",
					attributes: ["id", "username", "role"],
				},
			],
		});

		res.json(updatedChangeRequest);
	} catch (error) {
		await transaction.rollback();
		console.error("Error marking change request as used:", error);
		res.status(500).json({
			error: "Failed to mark change request as used",
		});
	}
});

// Note: The mark-used route was consolidated above

// Get a specific change request by ID
router.get("/:id", authenticateToken, async (req, res) => {
	try {
		const { id } = req.params;

		const changeRequest = await ChangeRequest.findByPk(id, {
			include: [
				{
					model: Order,
					attributes: [
						"id",
						"sdyNumber",
						"partyName",
						"deliveryParty",
					],
				},
				{
					model: User,
					as: "requester",
					attributes: ["id", "username", "role"],
				},
				{
					model: User,
					as: "approver",
					attributes: ["id", "username", "role"],
				},
			],
		});

		if (!changeRequest) {
			return res.status(404).json({ error: "Change request not found" });
		}

		// Check permissions based on user role
		const hasPermission = (() => {
			// Admin can view all change requests
			if (req.user.role === "admin") return true;

			// Users can see their own requests
			if (changeRequest.requestedBy === req.user.id) return true;

			return false;
		})();

		if (!hasPermission) {
			return res
				.status(403)
				.json({ error: "Not authorized to view this change request" });
		}

		res.json(changeRequest);
	} catch (error) {
		console.error("Error fetching change request:", error);
		res.status(500).json({ error: "Failed to fetch change request" });
	}
});

export default router;
