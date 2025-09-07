-- Create presets table
CREATE TABLE IF NOT EXISTS presets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create preset_items table
CREATE TABLE IF NOT EXISTS preset_items (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER REFERENCES presets(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity_needed INTEGER NOT NULL CHECK (quantity_needed > 0),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_preset_items_preset_id ON preset_items(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_items_item_name ON preset_items(item_name);
