import dotenv from "dotenv";
import sequelize from "../config/db.js";
import "../models/index.js"; // Import models to ensure they're initialized before sync

dotenv.config();

async function syncModels() {
	try {
		console.log("Starting database synchronization...");

		// First test connection
		await sequelize.authenticate();
		console.log("Database connection established successfully");

		// This will create tables if they don't exist
		// and alter tables if they exist but need to be updated
		// according to model definitions
		await sequelize.sync({ alter: true });

		console.log("Database schema has been successfully synchronized");
		process.exit(0);
	} catch (error) {
		console.error("Error synchronizing database schema:", error);
		console.error(error.stack);
		process.exit(1);
	}
}

syncModels();
