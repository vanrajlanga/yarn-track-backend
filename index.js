import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./src/config/db.js";
import authRoutes from "./src/routes/auth.js";
import orderRoutes from "./src/routes/orders.js";
import changeRequestRoutes from "./src/routes/changeRequests.js";
import orderItemsRoutes from "./src/routes/orderItems.js";
import userRoutes from "./src/routes/users.js";
// Import models to ensure they're initialized before database sync
import "./src/models/index.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/change-requests", changeRequestRoutes);
app.use("/api/order-items", orderItemsRoutes);
app.use("/api/users", userRoutes);

// Test database connection
app.get("/api/test", async (req, res) => {
	try {
		await sequelize.authenticate();
		res.json({ message: "Database connection successful" });
	} catch (error) {
		console.error("Database connection error:", error);
		res.status(500).json({ error: "Database connection failed" });
	}
});

// Initialize database and start server
const startServer = async () => {
	try {
		// Just check connection but don't sync automatically on server start
		// This prevents accidental schema changes in production
		await sequelize.authenticate();
		console.log("Database connection established successfully");

		app.listen(port, () => {
			console.log(`Server is running on port ${port}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
	}
};

startServer();
