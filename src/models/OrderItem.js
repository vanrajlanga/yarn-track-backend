import { Model, DataTypes } from "sequelize";
import sequelize from "../config/db.js";

class OrderItem extends Model {}

OrderItem.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		orderId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		denier: {
			type: DataTypes.STRING(20),
			allowNull: true, // Can be null since it's now independent
		},
		slNumber: {
			type: DataTypes.STRING(20),
			allowNull: true, // Can be null since it's now independent
		},
		quantity: {
			type: DataTypes.INTEGER,
			allowNull: true, // Can be null if not applicable to denier
			defaultValue: 1,
		},
		itemType: {
			type: DataTypes.ENUM("denier", "sl_quantity"),
			allowNull: false,
			defaultValue: "denier",
		},
	},
	{
		sequelize,
		modelName: "OrderItem",
		tableName: "order_items",
		timestamps: true,
		createdAt: "created_at",
		updatedAt: "updated_at",
	}
);

export default OrderItem;
