import { Model, DataTypes } from "sequelize";
import sequelize from "../config/db.js";

class Order extends Model {}

Order.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		sdyNumber: {
			type: DataTypes.STRING(20),
			allowNull: false,
		},
		date: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		partyName: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		deliveryParty: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		salespersonId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: "Order",
		tableName: "orders",
		timestamps: true,
		createdAt: "created_at",
		updatedAt: "updated_at",
	}
);

// Define associations later after all models are defined

export default Order;
