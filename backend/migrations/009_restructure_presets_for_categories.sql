-- Перебудовуємо пресети для роботи з категоріями
-- Додаємо нове поле category_id до preset_items
ALTER TABLE preset_items ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE;

-- Додаємо поле для кількості компонентів потрібної категорії
ALTER TABLE preset_items ADD COLUMN IF NOT EXISTS quantity_per_unit INTEGER DEFAULT 1;

-- Додаємо поле для опису вимог до компонента
ALTER TABLE preset_items ADD COLUMN IF NOT EXISTS requirements TEXT;

-- Додаємо індекси
CREATE INDEX IF NOT EXISTS idx_preset_items_category_id ON preset_items(category_id);

-- Оновлюємо існуючі записи (якщо є)
UPDATE preset_items SET category_id = 1 WHERE category_id IS NULL;

