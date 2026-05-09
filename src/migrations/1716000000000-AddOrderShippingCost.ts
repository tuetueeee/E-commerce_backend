import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderShippingCost1716000000000 implements MigrationInterface {
  name = 'AddOrderShippingCost1716000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS "ShippingCost" decimal(10,2) NOT NULL DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders DROP COLUMN IF EXISTS "ShippingCost";
    `);
  }
}
