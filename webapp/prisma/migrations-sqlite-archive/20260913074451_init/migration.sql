-- CreateTable
CREATE TABLE "products" (
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
    "rating" REAL NOT NULL DEFAULT 4.9,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "coupons" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "discount_percent" INTEGER NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_name" TEXT,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "shipping_address" TEXT NOT NULL DEFAULT '{}',
    "items" TEXT NOT NULL DEFAULT '[]',
    "subtotal_usd" REAL NOT NULL DEFAULT 0,
    "discount_usd" REAL NOT NULL DEFAULT 0,
    "coupon_code" TEXT,
    "shipping_usd" REAL NOT NULL DEFAULT 0,
    "total_usd" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "payment_reference" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "first_name" TEXT,
    "last_name" TEXT,
    "client_email" TEXT NOT NULL,
    "birth_name" TEXT NOT NULL,
    "date_of_birth" TEXT NOT NULL,
    "package_selected" TEXT,
    "package_price_usd" REAL,
    "timezone" TEXT,
    "session_date" TEXT,
    "reading_focus" TEXT,
    "additional_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "order_number" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "admin_settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);
