import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";
import OrderItem from "../models/OrderItem.js";

/**
 * Migration script to update existing order_items with the itemType field
 */
async function updateOrderItemsWithItemType() {
	try {
		console.log(
			"Starting migration to add itemType to existing order items..."
		);

		// Check if the column exists
		const columns = await sequelize.query(
			"SHOW COLUMNS FROM order_items LIKE 'itemType'",
			{ type: QueryTypes.SELECT }
		);

		// Add column if it doesn't exist
		if (columns.length === 0) {
			console.log("Adding itemType column to order_items table...");
			await sequelize.query(
				"ALTER TABLE order_items ADD COLUMN itemType ENUM('denier', 'sl_quantity') NOT NULL DEFAULT 'sl_quantity'"
			);
		} else {
			console.log(
				"itemType column already exists, skipping column creation."
			);
		}

		// Update existing records based on denier and slNumber values
		console.log(
			"Updating existing records with appropriate itemType values..."
		);
		const result = await sequelize.query(`
      UPDATE order_items 
      SET itemType = CASE 
        WHEN denier IS NOT NULL AND denier != '' AND (slNumber IS NULL OR slNumber = '') THEN 'denier' 
        ELSE 'sl_quantity' 
      END
    `);

		console.log(
			"Records updated:",
			result[0].affectedRows || "Unknown number of"
		);
		console.log("Migration completed successfully!");
	} catch (error) {
		console.error("Error updating order_items with itemType:", error);
	} finally {
		console.log("Closing database connection...");
		await sequelize.close();
		console.log("Database connection closed. Migration process complete.");
		process.exit(0);
	}
}

// Run the migration
updateOrderItemsWithItemType().catch((err) => {
	console.error("Fatal error in migration:", err);
	process.exit(1);
});
