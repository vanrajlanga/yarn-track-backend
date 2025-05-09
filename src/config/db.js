import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import 'reflect-metadata';
import User from '../models/User.js';
import Order from '../models/Order.js';
import OrderStatusHistory from '../models/OrderStatusHistory.js';
import Project from '../models/Project.js';
import Yarn from '../models/Yarn.js';
import Pattern from '../models/Pattern.js';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'yarn_track',
  models: [User, Order, OrderStatusHistory, Project, Yarn, Pattern],
  logging: false
});

export default sequelize;