import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Buffalo } from '../../buffalo/entities/buffalo.entity';

@Entity('lots')
export class Lot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nomeLote: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tamanhoArea: number;

  @Column({ type: 'varchar', length: 20 })
  unidadeMedida: string; // hectares, m², etc.

  @Column({ type: 'integer', nullable: true })
  qtdComporta?: number;

  @Column({ type: 'varchar', length: 50, default: 'Ativo' })
  status: string; // Ativo, Manutenção

  // Relacionamento com User (responsável)
  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel?: User;

  @Column({ type: 'uuid', nullable: true })
  responsavel_id?: string;

  // Relacionamento reverso com Buffalo
  @OneToMany(() => Buffalo, (buffalo) => buffalo.localizacao)
  buffalos?: Buffalo[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}