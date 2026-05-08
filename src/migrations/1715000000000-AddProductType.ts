import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductType1715000000000 implements MigrationInterface {
  name = 'AddProductType1715000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the obsolete is_auto_generated workaround column if it ever existed
    await queryRunner.query(`
      ALTER TABLE sku_variants DROP COLUMN IF EXISTS is_auto_generated;
    `);

    // Create products_producttype_enum if not exists
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE products_producttype_enum AS ENUM ('BLANK', 'READY_MADE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add productType column with default BLANK so existing rows are valid
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS "productType" products_producttype_enum
      NOT NULL DEFAULT 'BLANK';
    `);

    // Index for filter queries on /products?productType=...
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_product_type
      ON products("productType");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_products_product_type;
    `);
    await queryRunner.query(`
      ALTER TABLE products DROP COLUMN IF EXISTS "productType";
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS products_producttype_enum;
    `);
  }
}
