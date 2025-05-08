import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Project from './Project';

@Table({
  tableName: 'yarn',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
export default class Yarn extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  project_id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  name!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  brand!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  color!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  weight!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false
  })
  quantity!: number;

  @Column({
    type: DataType.ENUM('g', 'oz', 'm', 'yd'),
    allowNull: false
  })
  unit!: 'g' | 'oz' | 'm' | 'yd';

  @BelongsTo(() => Project)
  project!: Project;
} 