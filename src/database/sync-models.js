import dotenv from "dotenv";
import sequelize from "../config/db.js";
import {
	User,
	ChangeRequest,
	Order,
	OrderItem,
	OrderStatusHistory,
} from "../models/index.js";

dotenv.config();

async function syncModels() {
	try {
		console.log("Starting database synchronization...");

		// First test connection
		await sequelize.authenticate();
		console.log("Database connection established successfully");

		// Sync all models using alter: true which is safer for existing data
		console.log("Syncing all models...");

		// First sync models with no dependencies
		console.log("Syncing User model...");
		await User.sync({ alter: true });

		console.log("Syncing Order model...");
		await Order.sync({ alter: true });

		console.log("Syncing OrderItem model...");
		await OrderItem.sync({ alter: true });

		console.log("Syncing OrderStatusHistory model...");
		await OrderStatusHistory.sync({ alter: true });

		console.log("Syncing ChangeRequest model...");
		await ChangeRequest.sync({ alter: true });

		console.log("Database schema has been successfully synchronized");
		process.exit(0);
	} catch (error) {
		console.error("Error synchronizing database schema:", error);
		console.error(error.stack);
		process.exit(1);
	}
}

syncModels();
