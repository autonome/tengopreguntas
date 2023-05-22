import { MigrationInterface, QueryRunner } from 'typeorm';

export class createRoundTable1684500451186 implements MigrationInterface {
  name = 'createRoundTable1684500451186';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "rounds" ("id" SERIAL NOT NULL, "question" character varying NOT NULL, "answer" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "round_constraint" UNIQUE ("id"), CONSTRAINT "PK_9d254884a20817016e2f877c7e7" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "rounds"`);
  }
}
