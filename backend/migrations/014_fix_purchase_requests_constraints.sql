-- Виправляємо обмеження в таблиці purchase_requests
-- Робимо item_name та quantity nullable, оскільки тепер ми використовуємо category_id та units_count
ALTER TABLE purchase_requests ALTER COLUMN item_name DROP NOT NULL;
ALTER TABLE purchase_requests ALTER COLUMN quantity DROP NOT NULL;

-- Видаляємо обмеження на quantity > 0, оскільки тепер quantity може бути NULL
ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS purchase_requests_quantity_check;

-- Додаємо обмеження, що або item_name + quantity, або category_id + units_count має бути заповнене
ALTER TABLE purchase_requests ADD CONSTRAINT check_item_or_category_purchase 
CHECK (
    (item_name IS NOT NULL AND quantity IS NOT NULL) OR 
    (category_id IS NOT NULL AND units_count IS NOT NULL)
);

