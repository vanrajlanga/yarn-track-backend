import { Model, DataTypes } from "sequelize";
import sequelize from "../config/db.js";

class ChangeRequest extends Model {}

ChangeRequest.init(
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
		requestedBy: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		approvedBy: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		field: {
			type: DataTypes.STRING(50),
			allowNull: false,
			comment: "The field that is requested to be changed",
		},
		oldValue: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		newValue: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		status: {
			type: DataTypes.ENUM("pending", "approved", "rejected"),
			defaultValue: "pending",
			allowNull: false,
		},
		reason: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		adminNote: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		isEditUsed: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false,
			comment:
				"Tracks whether the approved change request has been used for editing",
		},
	},
	{
		sequelize,
		modelName: "ChangeRequest",
		tableName: "change_requests",
		timestamps: true,
		createdAt: "created_at",
		updatedAt: "updated_at",
	}
);

export default ChangeRequest;
