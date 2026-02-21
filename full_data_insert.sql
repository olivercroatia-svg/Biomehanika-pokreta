-- Comprehensive Data Insert for Biomehanika pokreta (bmhpokreta)
-- This script populates categories, services, staff, and their relationships.
-- 1. Insert Team Members (Staff)
INSERT IGNORE INTO users (
        id,
        first_name,
        last_name,
        email,
        phone_number,
        role,
        education,
        bio,
        image_url
    )
VALUES (
        1,
        'Vukica',
        'Jurišić',
        'vukica@biomehanika.hr',
        '0911234567',
        'staff',
        'Magistra fizioterapije, Certificirani DNS praktičar',
        'S preko 10 godina iskustva u elitnoj rehabilitaciji, Vukica je osnovala centar s vizijom personaliziranog pristupa svakom pacijentu.',
        'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=1974'
    ),
    (
        2,
        'Marko',
        'Horvat',
        'marko@biomehanika.hr',
        '0912345678',
        'staff',
        'Prvostupnik fizioterapije, Specijalist sportske medicine',
        'Marko se fokusira na oporavak sportaša i prevenciju ozljeda. Kroz godine rada s profesionalnim sportašima, razvio je metode...',
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=1964'
    ),
    (
        3,
        'Ivana',
        'Carić',
        'ivana@biomehanika.hr',
        '0913456789',
        'staff',
        'Fizioterapeutski tehničar, Certificirani masažni terapeut',
        'Ivana je stručnjakinja za terapiju mekih tkiva. Njezin rad je ključan u smanjenju post-operativnog edema.',
        'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=2070'
    );
-- 2. Insert Service Categories
INSERT IGNORE INTO service_categories (id, name, description, image_url)
VALUES (
        1,
        '1. Dijagnostika i individualna procjena',
        'Svaki terapijski proces u Biomehanici pokreta d.o.o. započinje detaljnim uvidom u stanje klijenta kako bi se otkrio pravi uzrok problema.',
        'https://images.unsplash.com/photo-1579684385180-1ea55f9f7485?auto=format&fit=crop&q=80&w=2048'
    ),
    (
        2,
        '2. Fizikalne procedure i tehnologija',
        'Primjena suvremenih aparata usmjerena je na ubrzanje bioloških procesa cijeljenja i pripremu tkiva za daljnju terapiju.',
        'https://images.unsplash.com/photo-1583454155184-870a1f63aebc?auto=format&fit=crop&q=80&w=1974'
    ),
    (
        3,
        '3. Specijalizirane manualne tehnike i koncepti',
        'Srž našeg rada čine međunarodno priznati terapijski koncepti koji se prilagođavaju specifičnim potrebama svakog pacijenta.',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=2070'
    ),
    (
        4,
        '4. Prevencija, trening i edukacija',
        'Rehabilitacija ne završava nestankom boli; naš je cilj osigurati dugoročno zdravlje i otpornost organizma.',
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=2070'
    );
-- 3. Insert Services (Sub-services)
-- Cat 1: Dijagnostika
INSERT IGNORE INTO services (id, category_id, name, price, duration_minutes)
VALUES (1, 1, 'Cjelovita klinička procjena', 45, 60),
    (2, 1, 'Analiza biomehanike tijela', 45, 45),
    (3, 1, 'Analiza obrazaca kretanja', 40, 45),
    (4, 1, 'Procjena neuro-mišićne kontrole', 40, 45),
    -- Cat 2: Fizikalne procedure
    (5, 2, 'TECAR terapija', 40, 30),
    (6, 2, 'Magnetoterapija', 30, 30),
    (7, 2, 'Elektroterapija', 25, 20),
    (8, 2, 'Terapijski ultrazvuk', 25, 15),
    -- Cat 3: Manualne tehnike
    (9, 3, 'Maitland koncept', 45, 45),
    (
        10,
        3,
        'DNS (Dinamička neuromuskularna stabilizacija)',
        45,
        45
    ),
    (
        11,
        3,
        'PNF (Proprioceptivna neuromuskularna facilitacija)',
        45,
        45
    ),
    (12, 3, 'Bobath koncept', 45, 45),
    (13, 3, 'Mobilizacija i manipulacija', 40, 30),
    -- Cat 4: Prevencija i trening
    (14, 4, 'Prevencijski trening', 40, 60),
    (15, 4, 'Rekreativni trening', 35, 60),
    (16, 4, 'Edukacija klijenata', 30, 45);
-- 4. Insert Staff-Service Mapping (Who does what?)
-- Vukica (Staff 1)
INSERT IGNORE INTO staff_services (staff_id, service_id)
VALUES (1, 1),
    (1, 2),
    (1, 3),
    (1, 4),
    -- Dijagnostika
    (1, 9),
    (1, 10),
    (1, 11),
    (1, 12),
    (1, 13),
    -- Manualne
    (1, 16);
-- Edukacija
-- Marko (Staff 2)
INSERT IGNORE INTO staff_services (staff_id, service_id)
VALUES (2, 5),
    (2, 6),
    (2, 7),
    (2, 8),
    -- Fizikalne
    (2, 9),
    (2, 11),
    (2, 13),
    -- Manualne
    (2, 14),
    (2, 15),
    (2, 16);
-- Trening
-- Ivana (Staff 3)
INSERT IGNORE INTO staff_services (staff_id, service_id)
VALUES (3, 5),
    (3, 6),
    (3, 7),
    (3, 8);
-- Fizikalne