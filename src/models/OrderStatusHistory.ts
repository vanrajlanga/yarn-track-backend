import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Order, { OrderStatus } from './Order';
import User from './User';

@Table({
  tableName: 'order_status_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
export default class OrderStatusHistory extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  orderId!: number;

  @Column({
    type: DataType.ENUM(
      'received',
      'dyeing',
      'dyeing_complete',
      'conning',
      'conning_complete',
      'packing',
      'packed'
    ),
    allowNull: false
  })
  status!: OrderStatus;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  updatedBy!: number;

  @BelongsTo(() => Order)
  order!: Order;

  @BelongsTo(() => User)
  user!: User;
} 