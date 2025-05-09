import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./src/config/db.js";
import projectRoutes from "./src/routes/projects.js";
import authRoutes from "./src/routes/auth.js";
import orderRoutes from "./src/routes/orders.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/orders", orderRoutes);

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
		await sequelize.sync();
		console.log("Database synchronized successfully");

		app.listen(port, () => {
			console.log(`Server is running on port ${port}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
	}
};

startServer();
