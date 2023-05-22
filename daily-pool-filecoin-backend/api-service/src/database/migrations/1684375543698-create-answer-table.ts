import { MigrationInterface, QueryRunner } from 'typeorm';

export class createAnswerTable1684375543698 implements MigrationInterface {
  name = 'createAnswerTable1684375543698';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "roundId" integer NOT NULL, "userAddress" character varying NOT NULL, "answer" character varying NOT NULL, "encryptedAnswer" character varying NOT NULL, "ranking" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "answer_constraint" UNIQUE ("roundId", "userAddress"), CONSTRAINT "PK_9c32cec6c71e06da0254f2226c6" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "answers"`);
  }
}
