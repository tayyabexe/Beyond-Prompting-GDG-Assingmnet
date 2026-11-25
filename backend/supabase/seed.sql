-- NEXUS-COMMERCE fictional demo data. Run AFTER schema.sql.
-- All names, emails (@example.com), phone numbers and addresses are made up.
-- Re-running resets all data back to this seed.

truncate inquiry_notes, inquiries, order_status_history, order_items, orders, customers, products restart identity cascade;

-- ---------- Products: 12 (4 categories x 3), Rs 1,500–45,000 ----------
-- image_url / image_credit are filled by scripts/upload_images.py
insert into products (id, name, category, description, price, stock, featured) values
('aura-wireless-headphones', 'Aura Wireless Headphones', 'Audio',
 'Over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life.', 18500, 14, true),
('pulse-mini-speaker', 'Pulse Mini Bluetooth Speaker', 'Audio',
 'Pocket-size waterproof speaker with surprisingly deep bass and 12-hour playtime.', 6500, 2, false),
('echo-buds-pro', 'Echo Buds Pro', 'Audio',
 'True wireless earbuds with transparency mode, touch controls and a compact charging case.', 12999, 9, false),
('orbit-smartwatch', 'Orbit Smartwatch', 'Wearables',
 'AMOLED smartwatch with heart-rate, SpO2 and sleep tracking, plus 7-day battery.', 24999, 7, true),
('stride-fitness-band', 'Stride Fitness Band', 'Wearables',
 'Slim fitness band that tracks steps, workouts and sleep. Water resistant to 50 m.', 7499, 0, false),
('lumen-smart-ring', 'Lumen Smart Ring', 'Wearables',
 'Lightweight titanium ring that tracks sleep, activity and readiness without a screen.', 15999, 3, false),
('ergoflex-mesh-chair', 'ErgoFlex Mesh Chair', 'Home Office',
 'Ergonomic office chair with breathable mesh, lumbar support and adjustable armrests.', 45000, 5, true),
('glow-led-desk-lamp', 'Glow LED Desk Lamp', 'Home Office',
 'Dimmable LED desk lamp with three colour temperatures and a USB charging port.', 4200, 20, false),
('focus-mechanical-keyboard', 'Focus Mechanical Keyboard', 'Home Office',
 'Compact 75% mechanical keyboard with hot-swappable switches and white backlight.', 11500, 11, true),
('nomad-laptop-backpack', 'Nomad Laptop Backpack', 'Accessories',
 'Water-resistant backpack with a padded 15.6" laptop sleeve and hidden anti-theft pocket.', 5999, 16, false),
('volt-power-bank', 'Volt 20000mAh Power Bank', 'Accessories',
 'High-capacity power bank with 22.5W fast charging and two USB ports.', 3999, 25, false),
('loop-usb-c-cable', 'Loop Braided USB-C Cable (2-pack)', 'Accessories',
 'Durable 1.5 m braided USB-C cables supporting 60W fast charging.', 1500, 30, false);

-- ---------- Customers: 6 ----------
insert into customers (id, name, email, phone, city, created_at) values
('00000000-0000-4000-8000-000000000001', 'Ayesha Khan',  'ayesha.khan@example.com',  '03001234567', 'Wah Cantt',  '2026-11-08 10:15+05'),
('00000000-0000-4000-8000-000000000002', 'Bilal Ahmed',  'bilal.ahmed@example.com',  '03111234567', 'Islamabad',  '2026-11-09 14:20+05'),
('00000000-0000-4000-8000-000000000003', 'Sana Malik',   'sana.malik@example.com',   '03211234567', 'Rawalpindi', '2026-11-11 09:05+05'),
('00000000-0000-4000-8000-000000000004', 'Hamza Iqbal',  'hamza.iqbal@example.com',  '03331234567', 'Lahore',     '2026-11-12 18:40+05'),
('00000000-0000-4000-8000-000000000005', 'Fatima Raza',  'fatima.raza@example.com',  '03451234567', 'Wah Cantt',  '2026-11-13 11:30+05'),
('00000000-0000-4000-8000-000000000006', 'Usman Tariq',  'usman.tariq@example.com',  '03011234567', 'Islamabad',  '2026-11-10 16:45+05');

-- ---------- Orders: 8, covering every status ----------
-- shipping = 0 when subtotal >= 10000, else 250
insert into orders (id, customer_id, ship_name, ship_email, ship_phone, ship_address, ship_city,
                    payment, subtotal, shipping, total, status, created_at, updated_at) values
('NX-1001', '00000000-0000-4000-8000-000000000001', 'Ayesha Khan', 'ayesha.khan@example.com', '03001234567',
 'House 12, Street 4, Lalazar', 'Wah Cantt', 'cod', 18500, 0, 18500, 'delivered', '2026-11-10 12:00+05', '2026-11-14 15:00+05'),
('NX-1002', '00000000-0000-4000-8000-000000000002', 'Bilal Ahmed', 'bilal.ahmed@example.com', '03111234567',
 'Flat 3B, Block 7, G-11/2', 'Islamabad', 'demo', 8199, 250, 8449, 'shipped', '2026-11-14 10:30+05', '2026-11-16 09:00+05'),
('NX-1003', '00000000-0000-4000-8000-000000000003', 'Sana Malik', 'sana.malik@example.com', '03211234567',
 'House 45, Lane 2, Bahria Phase 4', 'Rawalpindi', 'cod', 24999, 0, 24999, 'processing', '2026-11-18 17:10+05', '2026-11-19 10:00+05'),
('NX-1004', '00000000-0000-4000-8000-000000000004', 'Hamza Iqbal', 'hamza.iqbal@example.com', '03331234567',
 '22-C, Main Boulevard, Gulberg III', 'Lahore', 'demo', 56500, 0, 56500, 'pending', '2026-11-22 20:05+05', '2026-11-22 20:05+05'),
('NX-1005', '00000000-0000-4000-8000-000000000001', 'Ayesha Khan', 'ayesha.khan@example.com', '03001234567',
 'House 12, Street 4, Lalazar', 'Wah Cantt', 'cod', 3000, 250, 3250, 'pending', '2026-11-23 13:45+05', '2026-11-23 13:45+05'),
('NX-1006', '00000000-0000-4000-8000-000000000005', 'Fatima Raza', 'fatima.raza@example.com', '03451234567',
 'House 8, Street 11, POF Colony', 'Wah Cantt', 'demo', 12999, 0, 12999, 'cancelled', '2026-11-19 09:20+05', '2026-11-19 18:00+05'),
('NX-1007', '00000000-0000-4000-8000-000000000006', 'Usman Tariq', 'usman.tariq@example.com', '03011234567',
 'House 101, Street 30, F-8/1', 'Islamabad', 'cod', 9998, 250, 10248, 'delivered', '2026-11-12 11:00+05', '2026-11-15 14:30+05'),
('NX-1008', '00000000-0000-4000-8000-000000000002', 'Bilal Ahmed', 'bilal.ahmed@example.com', '03111234567',
 'Flat 3B, Block 7, G-11/2', 'Islamabad', 'demo', 6500, 250, 6750, 'processing', '2026-11-21 15:15+05', '2026-11-22 11:00+05');

insert into order_items (order_id, product_id, product_name, unit_price, qty) values
('NX-1001', 'aura-wireless-headphones',  'Aura Wireless Headphones',          18500, 1),
('NX-1002', 'glow-led-desk-lamp',        'Glow LED Desk Lamp',                 4200, 1),
('NX-1002', 'volt-power-bank',           'Volt 20000mAh Power Bank',           3999, 1),
('NX-1003', 'orbit-smartwatch',          'Orbit Smartwatch',                  24999, 1),
('NX-1004', 'ergoflex-mesh-chair',       'ErgoFlex Mesh Chair',               45000, 1),
('NX-1004', 'focus-mechanical-keyboard', 'Focus Mechanical Keyboard',         11500, 1),
('NX-1005', 'loop-usb-c-cable',          'Loop Braided USB-C Cable (2-pack)',  1500, 2),
('NX-1006', 'echo-buds-pro',             'Echo Buds Pro',                     12999, 1),
('NX-1007', 'nomad-laptop-backpack',     'Nomad Laptop Backpack',              5999, 1),
('NX-1007', 'volt-power-bank',           'Volt 20000mAh Power Bank',           3999, 1),
('NX-1008', 'pulse-mini-speaker',        'Pulse Mini Bluetooth Speaker',       6500, 1);

insert into order_status_history (order_id, status, changed_at) values
('NX-1001', 'pending',    '2026-11-10 12:00+05'),
('NX-1001', 'processing', '2026-11-11 10:00+05'),
('NX-1001', 'shipped',    '2026-11-12 16:00+05'),
('NX-1001', 'delivered',  '2026-11-14 15:00+05'),
('NX-1002', 'pending',    '2026-11-14 10:30+05'),
('NX-1002', 'processing', '2026-11-15 09:30+05'),
('NX-1002', 'shipped',    '2026-11-16 09:00+05'),
('NX-1003', 'pending',    '2026-11-18 17:10+05'),
('NX-1003', 'processing', '2026-11-19 10:00+05'),
('NX-1004', 'pending',    '2026-11-22 20:05+05'),
('NX-1005', 'pending',    '2026-11-23 13:45+05'),
('NX-1006', 'pending',    '2026-11-19 09:20+05'),
('NX-1006', 'cancelled',  '2026-11-19 18:00+05'),
('NX-1007', 'pending',    '2026-11-12 11:00+05'),
('NX-1007', 'processing', '2026-11-13 10:00+05'),
('NX-1007', 'shipped',    '2026-11-13 17:00+05'),
('NX-1007', 'delivered',  '2026-11-15 14:30+05'),
('NX-1008', 'pending',    '2026-11-21 15:15+05'),
('NX-1008', 'processing', '2026-11-22 11:00+05');

select setval('order_seq', 1009, false);   -- next new order will be NX-1009

-- ---------- Inquiries: 5 (open / in progress / resolved) ----------
insert into inquiries (id, name, email, subject, message, product_id, status, created_at, updated_at) values
('INQ-1001', 'Zara Hussain', 'zara.hussain@example.com', 'When is the Stride band back in stock?',
 'I wanted to buy the Stride Fitness Band but it shows out of stock. Any idea when it will be available again?',
 'stride-fitness-band', 'open', '2026-11-23 10:10+05', '2026-11-23 10:10+05'),
('INQ-1002', 'Ayesha Khan', 'ayesha.khan@example.com', 'Warranty on Aura headphones',
 'How long is the warranty on the Aura Wireless Headphones I bought, and how do I claim it?',
 'aura-wireless-headphones', 'resolved', '2026-11-15 12:00+05', '2026-11-15 16:30+05'),
('INQ-1003', 'Omar Farooq', 'omar.farooq@example.com', 'Bulk order of office chairs',
 'We need 8 ErgoFlex chairs for our new office in Islamabad. Do you offer a bulk discount?',
 'ergoflex-mesh-chair', 'in_progress', '2026-11-21 09:45+05', '2026-11-22 11:15+05'),
('INQ-1004', 'Hina Javed', 'hina.javed@example.com', 'Delivery time to Lahore',
 'How many days does delivery usually take to Lahore, and do you deliver on weekends?',
 null, 'open', '2026-11-24 18:20+05', '2026-11-24 18:20+05'),
('INQ-1005', 'Bilal Ahmed', 'bilal.ahmed@example.com', 'Change address for order NX-1002',
 'Can my order NX-1002 be delivered to my office address instead? It is also in G-11.',
 null, 'in_progress', '2026-11-15 08:30+05', '2026-11-15 10:00+05');

insert into inquiry_notes (inquiry_id, note, created_at) values
('INQ-1002', 'Replied: 1-year warranty, claim via the contact form with order ID NX-1001.', '2026-11-15 16:30+05'),
('INQ-1003', 'Asked supplier for bulk pricing on 8 units. Waiting for quote.',            '2026-11-22 11:15+05'),
('INQ-1005', 'Order already shipped. Contacted courier to update the drop-off address.',   '2026-11-15 10:00+05');

select setval('inquiry_seq', 1006, false); -- next new inquiry will be INQ-1006
