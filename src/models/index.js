import User from "./User.js";
import Order from "./Order.js";
import OrderItem from "./OrderItem.js";
import OrderStatusHistory from "./OrderStatusHistory.js";
import Project from "./Project.js";
import Yarn from "./Yarn.js";
import Pattern from "./Pattern.js";

// Define associations
User.hasMany(Project, { foreignKey: "user_id" });
Project.belongsTo(User, { foreignKey: "user_id" });

Project.hasMany(Yarn, { foreignKey: "project_id" });
Yarn.belongsTo(Project, { foreignKey: "project_id" });

Project.hasMany(Pattern, { foreignKey: "project_id" });
Pattern.belongsTo(Project, { foreignKey: "project_id" });

User.hasMany(Order, { foreignKey: "salespersonId", as: "salesperson" });
Order.belongsTo(User, { foreignKey: "salespersonId", as: "salesperson" });

Order.hasMany(OrderStatusHistory, { foreignKey: "orderId" });
OrderStatusHistory.belongsTo(Order, { foreignKey: "orderId" });

// New association for OrderItems
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

User.hasMany(OrderStatusHistory, { foreignKey: "updatedBy" });
OrderStatusHistory.belongsTo(User, { foreignKey: "updatedBy" });

export { User, Order, OrderItem, OrderStatusHistory, Project, Yarn, Pattern };
