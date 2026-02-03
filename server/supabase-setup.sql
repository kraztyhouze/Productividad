-- ============================================
-- SCRIPT DE MIGRACIÓN MANUAL PARA SUPABASE
-- ============================================
-- Solo necesitas ejecutar esto si prefieres crear
-- las tablas manualmente en lugar de dejar que
-- el código las cree automáticamente.
--
-- Para ejecutar:
-- 1. Ve a Supabase → SQL Editor
-- 2. Pega este script completo
-- 3. Click en "Run"
-- ============================================

-- Tabla: Empleados
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    avatar TEXT,
    first_name TEXT,
    last_name TEXT,
    alias TEXT,
    email TEXT,
    role TEXT,
    contract_hours REAL,
    contract_type TEXT,
    username TEXT,
    password TEXT,
    is_buyer BOOLEAN DEFAULT FALSE,
    phone TEXT,
    address TEXT,
    "order" INTEGER DEFAULT 0,
    store_id TEXT DEFAULT 'store_1'
);

-- Índice único para username + store_id
CREATE UNIQUE INDEX IF NOT EXISTS employees_username_store_key 
ON employees (username, store_id);

-- Tabla: Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT,
    color TEXT,
    permissions TEXT
);

-- Tabla: Tareas
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT,
    date TEXT,
    priority TEXT,
    status TEXT,
    assigned_to TEXT,
    description TEXT,
    recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    store_id TEXT DEFAULT 'store_1'
);

-- Tabla: Comentarios
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER,
    user_id INTEGER,
    text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    store_id TEXT DEFAULT 'store_1'
);

-- Tabla: Sesiones Activas
CREATE TABLE IF NOT EXISTS active_sessions (
    employee_id TEXT PRIMARY KEY,
    employee_name TEXT,
    start_time TEXT,
    client_start_time TEXT,
    store_id TEXT DEFAULT 'store_1'
);

-- Tabla: Registros Diarios
CREATE TABLE IF NOT EXISTS daily_records (
    id BIGINT PRIMARY KEY,
    employee_id TEXT,
    employee_name TEXT,
    start_time TEXT,
    end_time TEXT,
    duration_seconds REAL,
    date TEXT,
    groups_count INTEGER DEFAULT 0,
    store_id TEXT DEFAULT 'store_1'
);

-- Tabla: Grupos Diarios
CREATE TABLE IF NOT EXISTS daily_groups (
    key TEXT PRIMARY KEY,
    standard INTEGER DEFAULT 0,
    jewelry INTEGER DEFAULT 0,
    recoverable INTEGER DEFAULT 0,
    no_deal INTEGER DEFAULT 0,
    client_seconds INTEGER DEFAULT 0,
    store_id TEXT DEFAULT 'store_1'
);

-- Tabla: Días Cerrados
CREATE TABLE IF NOT EXISTS closed_days (
    date TEXT PRIMARY KEY,
    total_groups INTEGER DEFAULT 0,
    users_report TEXT,
    observation TEXT,
    max_concurrent INTEGER DEFAULT 0,
    store_id TEXT DEFAULT 'store_1'
);

-- Tabla: Incidencias del Día
CREATE TABLE IF NOT EXISTS day_incidents (
    date TEXT,
    text TEXT,
    store_id TEXT DEFAULT 'store_1',
    PRIMARY KEY (date, store_id)
);

-- Tabla: Detalles de No Tratos
CREATE TABLE IF NOT EXISTS no_deal_details (
    id SERIAL PRIMARY KEY,
    date TEXT,
    employee_id INTEGER,
    reason TEXT,
    brand TEXT,
    model TEXT,
    price_asked TEXT,
    price_offered TEXT,
    price_sale TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    store_id TEXT DEFAULT 'store_1'
);

-- Tabla: Familias de Productos
CREATE TABLE IF NOT EXISTS product_families (
    id SERIAL PRIMARY KEY,
    name TEXT,
    type TEXT,
    date TEXT,
    store_id TEXT DEFAULT 'store_1'
);

-- Tabla: Configuración de Tienda
CREATE TABLE IF NOT EXISTS store_settings (
    store_id TEXT PRIMARY KEY,
    gold_price NUMERIC DEFAULT 77.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Ubicaciones (Visual)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name TEXT,
    status TEXT DEFAULT 'libre',
    store_id TEXT DEFAULT 'store_1'
);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar configuración por defecto para ambas tiendas
INSERT INTO store_settings (store_id, gold_price) 
VALUES 
    ('store_1', 77.00),
    ('store_2', 77.00)
ON CONFLICT (store_id) DO NOTHING;

-- Insertar usuarios admin por defecto (contraseña: admin)
-- IMPORTANTE: Cambiar estas contraseñas después del primer login
INSERT INTO employees (
    first_name, last_name, alias, email, role, contract_hours, 
    contract_type, username, password, is_buyer, phone, address, 
    avatar, store_id, "order"
) VALUES 
    ('Admin', 'Sistema', 'ADMIN', 'admin@tiktak.com', 'Gerente', 40, 
     'Indefinido', 'admin', '$2a$10$YourHashedPasswordHere', true, 
     '000000000', 'Sistema', 'A', 'store_1', 0),
    ('Admin', 'Sistema', 'ADMIN', 'admin@tiktak.com', 'Gerente', 40, 
     'Indefinido', 'admin', '$2a$10$YourHashedPasswordHere', true, 
     '000000000', 'Sistema', 'A', 'store_2', 0)
ON CONFLICT (username, store_id) DO NOTHING;

-- Insertar roles predefinidos
INSERT INTO roles (name, color, permissions) VALUES
    ('Gerente', 'slate', 'basic'),
    ('Supervisor', 'slate', 'basic'),
    ('Responsable', 'slate', 'basic'),
    ('Empleado', 'slate', 'basic'),
    ('Puesto Compras', 'slate', 'basic')
ON CONFLICT DO NOTHING;

-- ============================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employees_store ON employees(store_id);
CREATE INDEX IF NOT EXISTS idx_tasks_store ON tasks(store_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_store ON daily_records(store_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(date);
CREATE INDEX IF NOT EXISTS idx_active_sessions_store ON active_sessions(store_id);
CREATE INDEX IF NOT EXISTS idx_product_families_store ON product_families(store_id);

-- ============================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security)
-- ============================================
-- NOTA: Por ahora deshabilitadas porque usamos autenticación custom
-- Si en el futuro quieres usar Supabase Auth, descomenta estas líneas:

-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

SELECT 'Migración completada exitosamente!' as status;
