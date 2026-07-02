import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDailyEarningPlanning1783000000000 implements MigrationInterface {
  name = 'CreateDailyEarningPlanning1783000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "daily_earning_planning" (
        "id" SERIAL NOT NULL,
        "usuario_id" integer NOT NULL,
        "date" date NOT NULL,
        "year" integer NOT NULL,
        "month" integer NOT NULL,
        "day" integer NOT NULL,
        "planned_income" numeric(12,2) NOT NULL DEFAULT 0,
        "planned_expense" numeric(12,2) NOT NULL DEFAULT 0,
        "balance" numeric(12,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_earning_planning" PRIMARY KEY ("id"),
        CONSTRAINT "uq_earning_planning_user_date" UNIQUE ("usuario_id", "date"),
        CONSTRAINT "FK_earning_planning_user" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_earning_planning_user_period" ON "daily_earning_planning" ("usuario_id", "year", "month")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_earning_planning_user_period"`);
    await queryRunner.query(`DROP TABLE "daily_earning_planning"`);
  }
}

