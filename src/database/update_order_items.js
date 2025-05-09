import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";

/**
 * Migration script to update the order_items table
 * by adding the itemType column and altering constraints
 */
async function updateOrderItemsTable() {
	try {
		// Check if itemType column already exists to avoid errors
		const columns = await sequelize.query(
			"SHOW COLUMNS FROM order_items LIKE 'itemType'",
			{ type: QueryTypes.SELECT }
		);

		if (columns.length === 0) {
			// Add the itemType column
			await sequelize.query(
				"ALTER TABLE order_items ADD COLUMN itemType ENUM('denier', 'sl_quantity') NOT NULL DEFAULT 'denier'"
			);

			// Modify constraints for denier, slNumber, and quantity columns
			await sequelize.query(
				"ALTER TABLE order_items MODIFY denier VARCHAR(20) NULL"
			);
			await sequelize.query(
				"ALTER TABLE order_items MODIFY slNumber VARCHAR(20) NULL"
			);
			await sequelize.query(
				"ALTER TABLE order_items MODIFY quantity INT NULL DEFAULT 1"
			);

			console.log("Successfully updated order_items table");
		} else {
			console.log("Migration already applied, skipping");
		}

		// Update existing records to set appropriate itemType values
		await sequelize.query(`
      UPDATE order_items 
      SET itemType = CASE 
        WHEN denier IS NOT NULL AND slNumber IS NULL THEN 'denier' 
        WHEN slNumber IS NOT NULL THEN 'sl_quantity'
        ELSE 'denier' END
    `);

		console.log("Successfully updated existing records");
	} catch (error) {
		console.error("Error updating order_items table:", error);
	} finally {
		await sequelize.close();
	}
}

// Run the migration
updateOrderItemsTable();
