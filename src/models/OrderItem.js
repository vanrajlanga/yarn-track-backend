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
			allowNull: true,
		},
		slNumber: {
			type: DataTypes.STRING(20),
			allowNull: true,
		},
		quantity: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
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
