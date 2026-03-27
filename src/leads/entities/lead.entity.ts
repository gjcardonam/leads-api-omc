import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum LeadSource {
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  LANDING_PAGE = 'landing_page',
  REFERIDO = 'referido',
  OTRO = 'otro',
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  nombre: string;

  @Column({ length: 255, unique: true })
  @Index()
  email: string;

  @Column({ length: 50, nullable: true })
  telefono: string;

  @Column({ type: 'enum', enum: LeadSource })
  @Index()
  fuente: LeadSource;

  @Column({ length: 255, nullable: true })
  producto_interes: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  presupuesto: number;

  @Column({ default: false })
  deleted: boolean;

  @CreateDateColumn()
  @Index()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
