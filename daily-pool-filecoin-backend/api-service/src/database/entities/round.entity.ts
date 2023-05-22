import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('rounds')
@Unique('round_constraint', ['roundId'])
export class RoundEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  roundId: number;

  @Column()
  question: string;

  @Column()
  answer: string;

  @Column({ default: false })
  isEnded: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
