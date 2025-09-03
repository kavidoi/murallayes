-- CreateEnum
CREATE TYPE "public"."ProductFormat" AS ENUM ('ENVASADOS', 'CONGELADOS', 'FRESCOS');

-- CreateEnum
CREATE TYPE "public"."ProductTypeDetail" AS ENUM ('HELADO', 'MUFFIN', 'ROLLO', 'ALMUERZO_CONSERVA', 'TORTA', 'GALLETA', 'BEBIDA', 'SANDWICH', 'ENSALADA', 'SOPA', 'POSTRE', 'SNACK');

-- CreateEnum
CREATE TYPE "public"."ProductExtra" AS ENUM ('VEGANO', 'SIN_AZUCAR', 'SIN_GLUTEN', 'KETO', 'ORGANICO', 'LIGHT', 'INTEGRAL', 'ARTESANAL');

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "extras" "public"."ProductExtra"[],
ADD COLUMN     "format" "public"."ProductFormat",
ADD COLUMN     "productType" "public"."ProductTypeDetail";
