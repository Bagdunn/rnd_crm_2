-- Seed data for testing

-- Insert sample items
INSERT INTO items (category_id, name, description, quantity, location, properties) VALUES
(1, 'Arduino Nano', 'Мікроконтролер Arduino Nano', 15, 'Склад A', '{"voltage": "5V", "processor": "ATmega328P"}'),
(1, 'ESP32', 'WiFi модуль ESP32', 8, 'Склад A', '{"voltage": "3.3V", "wifi": true, "bluetooth": true}'),
(1, 'Servo Motor SG90', 'Мікро сервопривід', 25, 'Склад B', '{"voltage": "4.8V-6V", "torque": "1.8kg/cm"}'),
(1, 'Battery 18650', 'Літій-іонна батарея', 50, 'Склад A', '{"voltage": "3.7V", "capacity": "2600mAh"}'),
(2, 'Multimeter', 'Цифровий мультиметр', 3, 'Інструменти', '{"measurements": ["voltage", "current", "resistance"]}'),
(2, 'Soldering Iron', 'Паяльник', 2, 'Інструменти', '{"power": "40W", "temperature": "400°C"}'),
(2, 'Oscilloscope', 'Осцилограф', 1, 'Лабораторія', '{"bandwidth": "100MHz", "channels": 2}');

-- Insert sample presets
INSERT INTO presets (name, description) VALUES
('FPV Дрон', 'Комплект компонентів для збірки FPV дрона'),
('Робот-маніпулятор', 'Комплект для робота-маніпулятора'),
('IoT проект', 'Базовий набір для IoT проекту');

-- Insert preset items
INSERT INTO preset_items (preset_id, item_name, quantity_needed, notes) VALUES
(1, 'Arduino Nano', 1, 'Основний контролер'),
(1, 'ESP32', 1, 'WiFi модуль для телеметрії'),
(1, 'Servo Motor SG90', 4, 'Для керування двигунами'),
(1, 'Battery 18650', 2, 'Живлення системи'),
(2, 'Arduino Nano', 1, 'Контролер маніпулятора'),
(2, 'Servo Motor SG90', 6, 'Для керування суглобами'),
(3, 'ESP32', 1, 'WiFi модуль'),
(3, 'Battery 18650', 1, 'Живлення');

-- Insert sample purchase requests
INSERT INTO purchase_requests (item_name, quantity, description, deadline, requester, notes) VALUES
('ESP32', 10, 'Потрібно для нового проекту', '2024-02-15', 'Іван Петренко', 'Терміново'),
('Servo Motor SG90', 20, 'Заміна зношених сервоприводів', '2024-02-20', 'Марія Коваленко', 'Якісні сервоприводи'),
('Oscilloscope', 1, 'Для нової лабораторії', '2024-03-01', 'Олександр Сидоренко', 'Професійний рівень');
