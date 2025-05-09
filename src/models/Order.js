import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

class Order extends Model {}

Order.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sdyNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  partyName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  deliveryParty: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  salespersonId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  denier: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  slNumber: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  currentStatus: {
    type: DataTypes.ENUM(
      'received',
      'dyeing',
      'dyeing_complete',
      'conning',
      'conning_complete',
      'packing',
      'packed'
    ),
    allowNull: false,
    defaultValue: 'received'
  }
}, {
  sequelize,
  modelName: 'Order',
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define associations later after all models are defined

export default Order;