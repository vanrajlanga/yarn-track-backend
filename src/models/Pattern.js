import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

class Pattern extends Model {}

Pattern.init({
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  difficulty: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'beginner'
  }
}, {
  sequelize,
  modelName: 'Pattern',
  tableName: 'patterns',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Pattern;