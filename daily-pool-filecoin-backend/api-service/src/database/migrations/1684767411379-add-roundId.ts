import { MigrationInterface, QueryRunner } from 'typeorm';

export class addRoundId1684767411379 implements MigrationInterface {
  name = 'addRoundId1684767411379';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rounds" ADD "roundId" integer NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "rounds" ADD CONSTRAINT "UQ_190af5394aab7d00cf6c2fc1b88" UNIQUE ("roundId")`,
    );
    await queryRunner.query(`ALTER TABLE "rounds" DROP CONSTRAINT "PK_9d254884a20817016e2f877c7e7"`);
    await queryRunner.query(`ALTER TABLE "rounds" DROP CONSTRAINT "UQ_9d254884a20817016e2f877c7e7"`);
    await queryRunner.query(`ALTER TABLE "rounds" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "rounds" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
    await queryRunner.query(
      `ALTER TABLE "rounds" ADD CONSTRAINT "PK_9d254884a20817016e2f877c7e7" PRIMARY KEY ("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rounds" DROP CONSTRAINT "PK_9d254884a20817016e2f877c7e7"`);
    await queryRunner.query(`ALTER TABLE "rounds" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "rounds" ADD "id" SERIAL NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "rounds" ADD CONSTRAINT "UQ_9d254884a20817016e2f877c7e7" UNIQUE ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "rounds" ADD CONSTRAINT "PK_9d254884a20817016e2f877c7e7" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(`ALTER TABLE "rounds" DROP CONSTRAINT "UQ_190af5394aab7d00cf6c2fc1b88"`);
    await queryRunner.query(`ALTER TABLE "rounds" DROP COLUMN "roundId"`);
  }
}
