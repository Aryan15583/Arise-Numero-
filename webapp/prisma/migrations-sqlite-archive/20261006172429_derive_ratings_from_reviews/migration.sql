-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "material" TEXT,
    "description" TEXT,
    "price_usd" REAL NOT NULL DEFAULT 0,
    "original_price_usd" REAL,
    "category" TEXT,
    "bead_size" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "image_url" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "badge" TEXT,
    "rating" REAL NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_products" ("active", "badge", "bead_size", "category", "created_at", "description", "featured", "id", "image_url", "images", "low_stock_threshold", "material", "name", "original_price_usd", "price_usd", "rating", "review_count", "sort_order", "stock", "updated_at") SELECT "active", "badge", "bead_size", "category", "created_at", "description", "featured", "id", "image_url", "images", "low_stock_threshold", "material", "name", "original_price_usd", "price_usd", "rating", "review_count", "sort_order", "stock", "updated_at" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE INDEX "products_active_idx" ON "products"("active");
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE INDEX "products_featured_idx" ON "products"("featured");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Replace the placeholder seeded ratings / review counts with real numbers
-- calculated from approved customer reviews (0 / 0 when there are none).
UPDATE "products" SET
    "review_count" = (SELECT COUNT(*) FROM "reviews" r WHERE r."product_id" = "products"."id" AND r."status" = 'approved'),
    "rating" = COALESCE((SELECT ROUND(AVG(r."rating"), 1) FROM "reviews" r WHERE r."product_id" = "products"."id" AND r."status" = 'approved'), 0);
