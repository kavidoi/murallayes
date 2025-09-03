-- Fix category codes based on the provided image mapping

-- Remove the unique constraint temporarily to avoid conflicts
ALTER TABLE "public"."product_categories" DROP CONSTRAINT IF EXISTS "product_categories_code_key";

-- Update categories with correct codes from the image
UPDATE "public"."product_categories" SET name = 'Alfajor', code = 'ALF' WHERE id = 'alfajor-cat';
UPDATE "public"."product_categories" SET name = 'Galleta', code = 'GALL' WHERE id = 'galleta-cat';
UPDATE "public"."product_categories" SET name = 'Galleta Corazón', code = 'GACO' WHERE id = 'galleta-corazon-cat';
UPDATE "public"."product_categories" SET name = 'Delicia', code = 'DEL' WHERE id = 'delicia-cat';
UPDATE "public"."product_categories" SET name = 'Mantequilla', code = 'MTQ' WHERE id = 'galleta-corazon-mantequilla-cat';
UPDATE "public"."product_categories" SET name = 'Kombucha', code = 'KBCH' WHERE id = 'kombucha-cat';
UPDATE "public"."product_categories" SET name = 'Barras', code = 'BR' WHERE id = 'barras-cat';
UPDATE "public"."product_categories" SET name = 'Agua', code = 'AG' WHERE id = 'agua-cat';
UPDATE "public"."product_categories" SET name = 'Agua Bidón', code = 'AGBI' WHERE id = 'agua-bidon-cat';
UPDATE "public"."product_categories" SET name = 'Electrolitos', code = 'ELCT' WHERE id = 'electrolitos-cat';
UPDATE "public"."product_categories" SET name = 'Agua Chía', code = 'AGCH' WHERE id = 'agua-chia-cat';
UPDATE "public"."product_categories" SET name = 'Almuerzo Conserva', code = 'ALCON' WHERE id = 'almuerzo-conserva-cat';
UPDATE "public"."product_categories" SET name = 'Muffie', code = 'MUF' WHERE id = 'muffie-cat';
UPDATE "public"."product_categories" SET name = 'Rollo', code = 'ROLL' WHERE id = 'rollo-cat';
UPDATE "public"."product_categories" SET name = 'Helado', code = 'HEL' WHERE id = 'helado-cat';
UPDATE "public"."product_categories" SET name = 'Snickers', code = 'SNK' WHERE id = 'snickers-cat';
UPDATE "public"."product_categories" SET name = 'Chocolate Submarino', code = 'CHSUB' WHERE id = 'chocolate-submarino-cat';

-- Re-add the unique constraint
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_code_key" UNIQUE ("code");