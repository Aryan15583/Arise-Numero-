-- The owner's catalogue no longer includes the original 8 bracelets: hide them
-- (not delete), so past orders, reviews and their pages' history are kept.
-- Re-show any of them from Admin → Products with the "Active" switch.
UPDATE "products" SET "active" = false, "featured" = false
WHERE "id" IN ('amethyst-8mm', 'lapis-lazuli', 'rose-quartz', 'black-tourmaline', 'citrine', 'obsidian', 'amethyst-6mm', 'rose-quartz-premium');
