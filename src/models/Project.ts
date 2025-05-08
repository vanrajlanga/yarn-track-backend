import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import User from './User';
import Yarn from './Yarn';
import Pattern from './Pattern';

@Table({
  tableName: 'projects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
export default class Project extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  user_id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description!: string;

  @Column({
    type: DataType.ENUM('active', 'completed', 'archived'),
    defaultValue: 'active'
  })
  status!: 'active' | 'completed' | 'archived';

  @BelongsTo(() => User)
  user!: User;

  @HasMany(() => Yarn)
  yarns!: Yarn[];

  @HasMany(() => Pattern)
  patterns!: Pattern[];
} 