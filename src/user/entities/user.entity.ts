import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  telefone: string;

  @Column({ type: 'date' })
  dataNascimento: Date;

  @Column({ type: 'varchar', length: 100 })
  cargo: string;

  // Endereço como JSONB para flexibilidade
  @Column({ type: 'jsonb', nullable: true })
  endereco: {
    estado: string;
    bairro: string;
    rua: string;
    cidade: string;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
