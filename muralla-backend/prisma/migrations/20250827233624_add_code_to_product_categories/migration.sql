-- Add code column to product_categories table
ALTER TABLE "public"."product_categories" ADD COLUMN "code" TEXT;

-- Add unique constraint on code column
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_code_key" UNIQUE ("code");

-- Update existing categories with proper formatting, codes, emojis, and colors
UPDATE "public"."product_categories" SET 
  name = 'Alfajor', 
  code = 'ALF',
  description = 'Alfajores dulces',
  emoji = '🍪',
  color = '#8B4513'
WHERE id = 'alfajor-cat';

UPDATE "public"."product_categories" SET 
  name = 'Galleta', 
  code = 'GALL',
  description = 'Galletas variadas',
  emoji = '🍪',
  color = '#DEB887'
WHERE id = 'galleta-cat';

UPDATE "public"."product_categories" SET 
  name = 'Galleta Corazón', 
  code = 'GACO',
  description = 'Galletas con forma de corazón',
  emoji = '💖',
  color = '#FF69B4'
WHERE id = 'galleta-corazon-cat';

UPDATE "public"."product_categories" SET 
  name = 'Delicia', 
  code = 'DEL',
  description = 'Delicias dulces',
  emoji = '🧁',
  color = '#FFB6C1'
WHERE id = 'delicia-cat';

UPDATE "public"."product_categories" SET 
  name = 'Galleta Corazón Mantequilla', 
  code = 'MTO',
  description = 'Galletas de corazón con mantequilla',
  emoji = '💛',
  color = '#FFD700'
WHERE id = 'galleta-corazon-mantequilla-cat';

UPDATE "public"."product_categories" SET 
  name = 'Kombucha', 
  code = 'KBCH',
  description = 'Bebidas de kombucha',
  emoji = '🍵',
  color = '#228B22'
WHERE id = 'kombucha-cat';

UPDATE "public"."product_categories" SET 
  name = 'Barras', 
  code = 'BR',
  description = 'Barras energéticas y cereales',
  emoji = '🍫',
  color = '#8B4513'
WHERE id = 'barras-cat';

UPDATE "public"."product_categories" SET 
  name = 'Agua', 
  code = 'AG',
  description = 'Agua y bebidas hidratantes',
  emoji = '💧',
  color = '#4169E1'
WHERE id = 'agua-cat';

UPDATE "public"."product_categories" SET 
  name = 'Agua Bidón', 
  code = 'AGBI',
  description = 'Agua en bidón',
  emoji = '🚰',
  color = '#00CED1'
WHERE id = 'agua-bidon-cat';

UPDATE "public"."product_categories" SET 
  name = 'Electrolitos', 
  code = 'ELCT',
  description = 'Bebidas con electrolitos',
  emoji = '⚡',
  color = '#FF4500'
WHERE id = 'electrolitos-cat';

UPDATE "public"."product_categories" SET 
  name = 'Agua Chía', 
  code = 'AGCH',
  description = 'Agua con semillas de chía',
  emoji = '🌱',
  color = '#32CD32'
WHERE id = 'agua-chia-cat';

UPDATE "public"."product_categories" SET 
  name = 'Almuerzo Conserva', 
  code = 'ALCON',
  description = 'Almuerzos en conserva',
  emoji = '🥫',
  color = '#CD853F'
WHERE id = 'almuerzo-conserva-cat';

UPDATE "public"."product_categories" SET 
  name = 'Muffie', 
  code = 'MUF',
  description = 'Muffins variados',
  emoji = '🧁',
  color = '#DA70D6'
WHERE id = 'muffie-cat';

UPDATE "public"."product_categories" SET 
  name = 'Rollo', 
  code = 'ROLL',
  description = 'Rollos de canela y dulces',
  emoji = '🥨',
  color = '#D2691E'
WHERE id = 'rollo-cat';

UPDATE "public"."product_categories" SET 
  name = 'Helado', 
  code = 'HEL',
  description = 'Helados y postres congelados',
  emoji = '🍦',
  color = '#FFB6C1'
WHERE id = 'helado-cat';

UPDATE "public"."product_categories" SET 
  name = 'Snickers', 
  code = 'SNK',
  description = 'Barras tipo Snickers',
  emoji = '🍫',
  color = '#8B4513'
WHERE id = 'snickers-cat';

UPDATE "public"."product_categories" SET 
  name = 'Chocolate Submarino', 
  code = 'CHSUB',
  description = 'Chocolate para preparar en leche',
  emoji = '🍫',
  color = '#654321'
WHERE id = 'chocolate-submarino-cat';