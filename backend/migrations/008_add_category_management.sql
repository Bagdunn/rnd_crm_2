-- Додаємо можливість створювати нові категорії
-- Таблиця вже має всі необхідні поля (id, name, created_at)
-- Додаємо індекс для швидкого пошуку по назві
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Додаємо поле для опису категорії (опціонально)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Додаємо індекси для нових полів
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

