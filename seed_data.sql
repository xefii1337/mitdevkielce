-- Insert GPU data
INSERT INTO components (category, name, purchase_price, sale_price) VALUES
('gpu', 'NVIDIA RTX 3060', 1000, 1400),
('gpu', 'NVIDIA RTX 3070', 1500, 2000),
('gpu', 'NVIDIA RTX 4060', 1300, 1700),
('gpu', 'AMD Radeon RX 6600', 800, 1100),
('gpu', 'AMD Radeon RX 6700 XT', 1200, 1600);

-- Insert CPU data
INSERT INTO components (category, name, purchase_price, sale_price) VALUES
('cpu', 'Intel Core i5-12400F', 500, 700),
('cpu', 'Intel Core i7-12700K', 1000, 1400),
('cpu', 'AMD Ryzen 5 5600X', 600, 850),
('cpu', 'AMD Ryzen 7 5800X3D', 1100, 1500);

-- Insert Motherboard data
INSERT INTO components (category, name, purchase_price, sale_price) VALUES
('mobo', 'Gigabyte B660M DS3H', 400, 550),
('mobo', 'MSI MAG B550 TOMAHAWK', 500, 700),
('mobo', 'Asus ROG STRIX B550-F', 600, 850);

-- Insert RAM data
INSERT INTO components (category, name, purchase_price, sale_price) VALUES
('ram', 'DDR4 16GB (2x8GB) 3200MHz', 150, 250),
('ram', 'DDR4 32GB (2x16GB) 3600MHz', 300, 450),
('ram', 'DDR5 32GB (2x16GB) 6000MHz', 500, 700);

-- Insert Disk data
INSERT INTO components (category, name, purchase_price, sale_price) VALUES
('disk', 'SSD NVMe 500GB', 100, 180),
('disk', 'SSD NVMe 1TB', 200, 300),
('disk', 'SSD SATA 1TB', 150, 250);
