import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";
import "reflect-metadata";

dotenv.config();

const sequelize = new Sequelize({
	dialect: "mysql",
	host: process.env.DB_HOST || "localhost",
	username: process.env.DB_USER || "root",
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_NAME || "yarn_track",
	logging: false,
});

export default sequelize;
