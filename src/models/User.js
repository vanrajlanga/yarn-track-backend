import { Model, DataTypes } from "sequelize";
import sequelize from "../config/db.js";

class User extends Model {}

User.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		username: {
			type: DataTypes.STRING(50),
			allowNull: false,
			unique: true,
		},
		email: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true,
		},
		password: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		role: {
			type: DataTypes.ENUM("admin", "sales", "operator", "factory"),
			allowNull: false,
			defaultValue: "sales",
		},
		deletedAt: {
			type: DataTypes.DATE,
			allowNull: true,
		},
	},
	{
		modelName: "User",
		tableName: "users",
		timestamps: true,
		createdAt: "created_at",
		updatedAt: "updated_at",
		paranoid: true,
		sequelize,
	}
);

export default User;
