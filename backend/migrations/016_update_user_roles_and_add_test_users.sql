-- Update existing users to new role system
UPDATE users SET role = 'default_user' WHERE role = 'user';
UPDATE users SET role = 'global_user' WHERE role = 'manager';

-- Add test users with different roles
INSERT INTO users (username, email, password_hash, full_name, role) VALUES 
    -- Default User (password: user123)
    ('user1', 'user1@rnd-crm.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Іван Петренко', 'default_user'),
    
    -- Global User (password: global123)
    ('global1', 'global1@rnd-crm.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Марія Коваленко', 'global_user'),
    
    -- Another Default User (password: user123)
    ('user2', 'user2@rnd-crm.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Олексій Сидоренко', 'default_user'),
    
    -- Another Global User (password: global123)
    ('global2', 'global2@rnd-crm.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Анна Мельник', 'global_user')
ON CONFLICT (username) DO NOTHING;

-- Update admin user info
UPDATE users SET full_name = 'Системний Адміністратор' WHERE username = 'admin';
