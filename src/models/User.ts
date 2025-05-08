import { Table, Column, Model, DataType } from 'sequelize-typescript';

export type UserRole = 'admin' | 'sales' | 'operator' | 'factory';

@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
export default class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true
  })
  username!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true
  })
  email!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  password!: string;

  @Column({
    type: DataType.ENUM('admin', 'sales', 'operator', 'factory'),
    allowNull: false,
    defaultValue: 'sales'
  })
  role!: UserRole;
} 