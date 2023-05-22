import { MigrationInterface, QueryRunner } from 'typeorm';

export class changeEncryptedAnswerTypeToNullable1684377845880 implements MigrationInterface {
  name = 'changeEncryptedAnswerTypeToNullable1684377845880';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN "ranking"`);
    await queryRunner.query(`ALTER TABLE "answers" ADD "rank" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "answers" ALTER COLUMN "encryptedAnswer" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "answers" ALTER COLUMN "encryptedAnswer" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN "rank"`);
    await queryRunner.query(`ALTER TABLE "answers" ADD "ranking" integer NOT NULL DEFAULT '0'`);
  }
}
