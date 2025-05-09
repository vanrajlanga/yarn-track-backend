import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

class Yarn extends Model {}

Yarn.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  weight: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  unit: {
    type: DataTypes.ENUM('g', 'oz', 'm', 'yd'),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Yarn',
  tableName: 'yarn',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Yarn;