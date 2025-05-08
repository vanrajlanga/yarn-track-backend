import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Project from './Project';

@Table({
  tableName: 'patterns',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
export default class Pattern extends Model {
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
    type: DataType.TEXT,
    allowNull: true
  })
  description!: string;

  @Column({
    type: DataType.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'beginner'
  })
  difficulty!: 'beginner' | 'intermediate' | 'advanced';

  @BelongsTo(() => Project)
  project!: Project;
} 