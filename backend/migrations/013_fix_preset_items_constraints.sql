-- Виправляємо обмеження в таблиці preset_items
-- Робимо item_name nullable, оскільки тепер ми використовуємо category_id
ALTER TABLE preset_items ALTER COLUMN item_name DROP NOT NULL;

-- Додаємо обмеження, що або item_name, або category_id має бути заповнене
ALTER TABLE preset_items ADD CONSTRAINT check_item_or_category 
CHECK (item_name IS NOT NULL OR category_id IS NOT NULL);

-- Оновлюємо існуючі записи, встановлюючи category_id = 1 для записів без category_id
UPDATE preset_items SET category_id = 1 WHERE category_id IS NULL;

