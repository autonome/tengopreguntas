import { MigrationInterface, QueryRunner } from 'typeorm';

export class addConfirmField1684474397586 implements MigrationInterface {
  name = 'addConfirmField1684474397586';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "answers" ADD "isConfirmed" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN "isConfirmed"`);
  }
}
