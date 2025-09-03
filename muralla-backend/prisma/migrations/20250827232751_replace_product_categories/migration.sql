-- Replace existing product categories with new ones

-- First, update any products that might be using the old categories to null
-- to avoid foreign key constraint violations
UPDATE "public"."products" SET "categoryId" = NULL WHERE "categoryId" IS NOT NULL;

-- Delete all existing categories
DELETE FROM "public"."product_categories";

-- Insert the new product categories
INSERT INTO "public"."product_categories" (id, name, description, "isActive", "createdAt", "updatedAt") VALUES
('alfajor-cat', 'ALFAJOR', 'Alfajores dulces', true, NOW(), NOW()),
('galleta-cat', 'GALLETA', 'Galletas variadas', true, NOW(), NOW()),
('galleta-corazon-cat', 'GALLETA CORAZON', 'Galletas con forma de corazón', true, NOW(), NOW()),
('delicia-cat', 'DELICIA', 'Delicias dulces', true, NOW(), NOW()),
('galleta-corazon-mantequilla-cat', 'GALLETA CORAZON MANTEQUILLA', 'Galletas de corazón con mantequilla', true, NOW(), NOW()),
('kombucha-cat', 'KOMBUCHA', 'Bebidas de kombucha', true, NOW(), NOW()),
('barras-cat', 'BARRAS', 'Barras energéticas y cereales', true, NOW(), NOW()),
('agua-cat', 'AGUA', 'Agua y bebidas hidratantes', true, NOW(), NOW()),
('agua-bidon-cat', 'AGUA BIDON', 'Agua en bidón', true, NOW(), NOW()),
('electrolitos-cat', 'ELECTROLITOS', 'Bebidas con electrolitos', true, NOW(), NOW()),
('agua-chia-cat', 'AGUA CHIA', 'Agua con semillas de chía', true, NOW(), NOW()),
('almuerzo-conserva-cat', 'ALMUERZO CONSERVA', 'Almuerzos en conserva', true, NOW(), NOW()),
('muffie-cat', 'MUFFIE', 'Muffins variados', true, NOW(), NOW()),
('rollo-cat', 'ROLLO', 'Rollos de canela y dulces', true, NOW(), NOW()),
('helado-cat', 'HELADO', 'Helados y postres congelados', true, NOW(), NOW()),
('snickers-cat', 'SNICKERS', 'Barras tipo Snickers', true, NOW(), NOW()),
('chocolate-submarino-cat', 'CHOCOLATE SUBMARINO', 'Chocolate para preparar en leche', true, NOW(), NOW());