import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import User from './User';
import OrderStatusHistory from './OrderStatusHistory';

export type OrderStatus = 
  | 'received' 
  | 'dyeing' 
  | 'dyeing_complete' 
  | 'conning' 
  | 'conning_complete' 
  | 'packing' 
  | 'packed';

@Table({
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
export default class Order extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    unique: true
  })
  sdyNumber!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  date!: Date;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  partyName!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  deliveryParty!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  salespersonId!: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false
  })
  denier!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false
  })
  slNumber!: string;

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
    allowNull: false,
    defaultValue: 'received'
  })
  currentStatus!: OrderStatus;

  @BelongsTo(() => User)
  salesperson!: User;

  @HasMany(() => OrderStatusHistory)
  statusHistory!: OrderStatusHistory[];
} 