import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

class OrderStatusHistory extends Model {}

OrderStatusHistory.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'received',
      'dyeing',
      'dyeing_complete',
      'conning',
      'conning_complete',
      'packing',
      'packed'
    ),
    allowNull: false
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'OrderStatusHistory',
  tableName: 'order_status_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default OrderStatusHistory;