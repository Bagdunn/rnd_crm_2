-- Перебудовуємо закупівлі для роботи з категоріями
-- Додаємо поле category_id до purchase_requests
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE;

-- Додаємо поле для кількості одиниць (наприклад, 3 комп'ютери)
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS units_count INTEGER DEFAULT 1;

-- Додаємо поле для статусу закупівлі
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS completion_status TEXT DEFAULT 'pending';

-- Додаємо поле для відстеження прогресу
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS completed_units INTEGER DEFAULT 0;

-- Додаємо індекси
CREATE INDEX IF NOT EXISTS idx_purchase_requests_category_id ON purchase_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_completion_status ON purchase_requests(completion_status);

-- Оновлюємо існуючі записи
UPDATE purchase_requests SET category_id = 1 WHERE category_id IS NULL;

