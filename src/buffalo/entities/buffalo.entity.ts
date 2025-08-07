import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Lot } from '../../lot/entities/lot.entity';

export enum SexoEnum {
  MACHO = 'Macho',
  FEMEA = 'Femea',
}

export enum MaturidadeEnum {
  BEZERRO = 'Bezerro',
  NOVILHA = 'Novilha',
  VACA = 'Vaca',
  TOURO = 'Touro',
}

export enum StatusEnum {
  ATIVA = 'Ativa',
  DESCARTADA = 'Descartada',
}

export enum ProximoRetornoEnum {
  SIM = 'Sim',
  NAO = 'Não',
}

// Interface para sub-documentos
export interface AtividadeInterface {
  status: StatusEnum;
  observacao?: string;
  dataAtualizacao: Date;
}

export interface ZootecnicoInterface {
  peso: number;
  condicaoCorporal: string;
  observacao?: string;
  dataAtualizacao: Date;
  funcionarioResponsavel: string[]; // UUIDs dos funcionários
}

export interface SanitarioInterface {
  tpSanitario: string;
  medicacaoAplicada: string;
  dataAplicacao: Date;
  proximoRetorno: ProximoRetornoEnum;
  dataRetorno?: Date;
  observacao?: string;
  dosagem: number;
  unidadeMedidaDosagem: string;
  doencaCombatida: string;
  funcionarioResponsavel: string[]; // UUIDs dos funcionários
}

@Entity('buffalos')
export class Buffalo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  tag: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nome?: string;

  @Column({
    type: 'enum',
    enum: SexoEnum,
  })
  sexo: SexoEnum;

  @Column({
    type: 'enum',
    enum: MaturidadeEnum,
  })
  maturidade: MaturidadeEnum;

  @Column({ type: 'varchar', length: 100 })
  raca: string;

  @Column({ type: 'varchar', length: 50 })
  tagPai: string;

  @Column({ type: 'varchar', length: 50 })
  tagMae: string;

  // Relacionamento com Lot
  @ManyToOne(() => Lot, { nullable: true, eager: false })
  @JoinColumn({ name: 'localizacao_id' })
  localizacao?: Lot;

  @Column({ type: 'uuid', nullable: true })
  localizacao_id?: string;

  @Column({ type: 'varchar', length: 100 })
  grupo: string;

  // Históricos armazenados como JSONB
  @Column({ type: 'jsonb', default: [] })
  atividade: AtividadeInterface[];

  @Column({ type: 'jsonb', default: [] })
  zootecnico: ZootecnicoInterface[];

  @Column({ type: 'jsonb', default: [] })
  sanitario: SanitarioInterface[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamento many-to-many com usuários responsáveis (se necessário)
  @ManyToMany(() => User)
  @JoinTable({
    name: 'buffalo_responsaveis',
    joinColumn: { name: 'buffalo_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  responsaveis?: User[];
}
