-- Створюємо таблицю для зв'язку закупівель з конкретними компонентами
CREATE TABLE IF NOT EXISTS purchase_items_mapping (
    id SERIAL PRIMARY KEY,
    purchase_request_id INTEGER REFERENCES purchase_requests(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    quantity_added INTEGER NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT NOW(),
    added_by TEXT,
    notes TEXT
);

-- Додаємо індекси
CREATE INDEX IF NOT EXISTS idx_purchase_items_mapping_purchase_id ON purchase_items_mapping(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_mapping_item_id ON purchase_items_mapping(item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_mapping_added_at ON purchase_items_mapping(added_at);

