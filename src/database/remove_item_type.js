/**
 * Migration script to remove the itemType field from order_items table.
 * This script should be run to update the database schema after removing the itemType field from the code.
 */
import sequelize from "../config/db.js";

async function removeItemTypeFromOrderItems() {
	try {
		console.log(
			"Starting migration to remove itemType from order_items table..."
		);

		// Check if the column exists before attempting to remove it
		const [columnResults] = await sequelize.query(
			"SHOW COLUMNS FROM order_items LIKE 'itemType'"
		);

		if (columnResults.length > 0) {
			console.log("Removing itemType column from order_items table...");
			await sequelize.query(
				"ALTER TABLE order_items DROP COLUMN itemType"
			);
			console.log(
				"Successfully removed itemType column from order_items table."
			);
		} else {
			console.log("itemType column doesn't exist, no changes needed.");
		}

		console.log("Migration completed successfully.");
	} catch (error) {
		console.error("Error removing itemType from order_items:", error);
		throw error;
	} finally {
		await sequelize.close();
	}
}

removeItemTypeFromOrderItems().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});
