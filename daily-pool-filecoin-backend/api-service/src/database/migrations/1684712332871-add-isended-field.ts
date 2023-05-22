import { MigrationInterface, QueryRunner } from 'typeorm';

export class addIsendedField1684712332871 implements MigrationInterface {
  name = 'addIsendedField1684712332871';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rounds" ADD "isEnded" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(
      `ALTER TABLE "rounds" ADD CONSTRAINT "UQ_9d254884a20817016e2f877c7e7" UNIQUE ("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rounds" DROP CONSTRAINT "UQ_9d254884a20817016e2f877c7e7"`);
    await queryRunner.query(`ALTER TABLE "rounds" DROP COLUMN "isEnded"`);
  }
}
