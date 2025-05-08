import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import 'reflect-metadata';
import User from '../models/User';
import Order from '../models/Order';
import OrderStatusHistory from '../models/OrderStatusHistory';
import Project from '../models/Project';
import Yarn from '../models/Yarn';
import Pattern from '../models/Pattern';

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