import User from "./User.js";
import Order from "./Order.js";
import OrderItem from "./OrderItem.js";
import OrderStatusHistory from "./OrderStatusHistory.js";
import ChangeRequest from "./ChangeRequest.js";

// Define associations
User.hasMany(Order, { foreignKey: "salespersonId", as: "salesperson" });
Order.belongsTo(User, { foreignKey: "salespersonId", as: "salesperson" });

// Remove old association for OrderStatusHistory with Order
// Order.hasMany(OrderStatusHistory, { foreignKey: "orderId" });
// OrderStatusHistory.belongsTo(Order, { foreignKey: "orderId" });

// New association for OrderItems
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

// New association for OrderStatusHistory with OrderItem
OrderItem.hasMany(OrderStatusHistory, { foreignKey: "orderItemId", as: "statusHistory" });
OrderStatusHistory.belongsTo(OrderItem, { foreignKey: "orderItemId" });

User.hasMany(OrderStatusHistory, { foreignKey: "updatedBy" });
OrderStatusHistory.belongsTo(User, { foreignKey: "updatedBy" });

// ChangeRequest associations
Order.hasMany(ChangeRequest, { foreignKey: "orderId" });
ChangeRequest.belongsTo(Order, { foreignKey: "orderId" });

User.hasMany(ChangeRequest, {
	foreignKey: "requestedBy",
	as: "requestedChanges",
});
ChangeRequest.belongsTo(User, { foreignKey: "requestedBy", as: "requester" });

User.hasMany(ChangeRequest, {
	foreignKey: "approvedBy",
	as: "approvedChanges",
});
ChangeRequest.belongsTo(User, { foreignKey: "approvedBy", as: "approver" });

export { User, Order, OrderItem, OrderStatusHistory, ChangeRequest };
