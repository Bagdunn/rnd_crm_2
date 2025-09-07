-- Створюємо таблицю для зв'язку пресетів з конкретними компонентами при списанні
CREATE TABLE IF NOT EXISTS preset_withdrawal_mapping (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER REFERENCES presets(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    quantity_withdrawn INTEGER NOT NULL DEFAULT 1,
    withdrawn_at TIMESTAMP DEFAULT NOW(),
    withdrawn_by TEXT,
    notes TEXT
);

-- Додаємо індекси
CREATE INDEX IF NOT EXISTS idx_preset_withdrawal_mapping_preset_id ON preset_withdrawal_mapping(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_withdrawal_mapping_item_id ON preset_withdrawal_mapping(item_id);
CREATE INDEX IF NOT EXISTS idx_preset_withdrawal_mapping_withdrawn_at ON preset_withdrawal_mapping(withdrawn_at);

