import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('answers')
@Unique('answer_constraint', ['roundId', 'userAddress'])
export class AnswerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roundId: number;

  @Column()
  userAddress: string;

  @Column()
  answer: string;

  @Column({ nullable: true })
  encryptedAnswer: string;

  @Column({ default: 0 })
  rank: number;

  @Column({ default: false })
  isConfirmed: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
