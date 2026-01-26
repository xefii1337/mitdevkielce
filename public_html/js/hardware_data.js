// hardware_data.js
// This file simulates "Internet Prices" for PC components.
// In a real production app, this would be replaced by an API call to eBay/Amazon/PCPartPicker.

export const hardwareDatabase = [
    // --- GRAPHICS CARDS (GPU) ---
    { category: 'gpu', name: 'NVIDIA GeForce RTX 4090', marketPrice: 7050 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 4080 Super', marketPrice: 4800 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 4080', marketPrice: 4200 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 4070 Ti Super', marketPrice: 3800 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 4070 Ti', marketPrice: 3500 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 4070 Super', marketPrice: 2800 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 4070', marketPrice: 2500 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 4060 Ti', marketPrice: 1700 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 4060', marketPrice: 1350 },

    { category: 'gpu', name: 'NVIDIA GeForce RTX 3090 Ti', marketPrice: 1338 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 3090', marketPrice: 2575 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 3080 Ti', marketPrice: 2300 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 3080', marketPrice: 2012 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 3070 Ti', marketPrice: 1440 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 3070', marketPrice: 1344 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 3060 Ti', marketPrice: 992 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 3060', marketPrice: 1068 },
    { category: 'gpu', name: 'NVIDIA GeForce RTX 3050', marketPrice: 770 },

    { category: 'gpu', name: 'AMD Radeon RX 7900 XTX', marketPrice: 4400 },
    { category: 'gpu', name: 'AMD Radeon RX 7900 XT', marketPrice: 3400 },
    { category: 'gpu', name: 'AMD Radeon RX 7800 XT', marketPrice: 2300 },
    { category: 'gpu', name: 'AMD Radeon RX 7700 XT', marketPrice: 1900 },
    { category: 'gpu', name: 'AMD Radeon RX 7600', marketPrice: 1200 },

    // --- PROCESSORS (CPU) ---
    { category: 'cpu', name: 'Intel Core i9-14900K', marketPrice: 2700 },
    { category: 'cpu', name: 'Intel Core i7-14700K', marketPrice: 1900 },
    { category: 'cpu', name: 'Intel Core i5-14600K', marketPrice: 1350 },
    { category: 'cpu', name: 'Intel Core i9-13900K', marketPrice: 2300 },
    { category: 'cpu', name: 'Intel Core i7-13700K', marketPrice: 1700 },
    { category: 'cpu', name: 'Intel Core i5-13600K', marketPrice: 1250 },
    { category: 'cpu', name: 'Intel Core i5-13400F', marketPrice: 850 },
    { category: 'cpu', name: 'Intel Core i5-12400F', marketPrice: 550 },

    { category: 'cpu', name: 'AMD Ryzen 9 7950X3D', marketPrice: 2600 },
    { category: 'cpu', name: 'AMD Ryzen 7 7800X3D', marketPrice: 1800 },
    { category: 'cpu', name: 'AMD Ryzen 9 7900X', marketPrice: 1700 },
    { category: 'cpu', name: 'AMD Ryzen 7 7700X', marketPrice: 1350 },
    { category: 'cpu', name: 'AMD Ryzen 5 7600X', marketPrice: 950 },
    { category: 'cpu', name: 'AMD Ryzen 7 5800X3D', marketPrice: 1500 },
    { category: 'cpu', name: 'AMD Ryzen 5 5600X', marketPrice: 600 },

    // --- MOTHERBOARDS (Mobo) ---
    { category: 'mobo', name: 'ASUS ROG MAXIMUS Z790', marketPrice: 3200 },
    { category: 'mobo', name: 'MSI MPG Z790 CARBON', marketPrice: 2100 },
    { category: 'mobo', name: 'Gigabyte Z790 AORUS ELITE', marketPrice: 1300 },
    { category: 'mobo', name: 'ASUS TUF GAMING B760', marketPrice: 950 },
    { category: 'mobo', name: 'MSI MAG B650 TOMAHAWK (AMD)', marketPrice: 1000 },
    { category: 'mobo', name: 'Gigabyte B650 GAMING X (AMD)', marketPrice: 900 },
    { category: 'mobo', name: 'Generic B550 / B450', marketPrice: 450 },
    { category: 'mobo', name: 'Generic H610 / H510', marketPrice: 350 },

    // --- RAM ---
    { category: 'ram', name: 'DDR5 64GB (2x32GB) 6000MHz', marketPrice: 2835 },
    { category: 'ram', name: 'DDR5 32GB (2x16GB) 6000MHz', marketPrice: 1566 },
    { category: 'ram', name: 'DDR5 16GB (2x8GB) 5200MHz', marketPrice: 686 },
    { category: 'ram', name: 'DDR4 64GB (2x32GB) 3600MHz', marketPrice: 1939 },
    { category: 'ram', name: 'DDR4 32GB (2x16GB) 3600MHz', marketPrice: 857 },
    { category: 'ram', name: 'DDR4 16GB (2x8GB) 3200MHz', marketPrice: 364 },
    { category: 'ram', name: 'DDR4 8GB (1x8GB) 2666MHz', marketPrice: 312 },

    // --- DISKS ---
    { category: 'disk', name: 'SSD NVMe Gen5 2TB', marketPrice: 1400 },
    { category: 'disk', name: 'SSD NVMe Gen4 4TB', marketPrice: 1300 },
    { category: 'disk', name: 'SSD NVMe Gen4 2TB', marketPrice: 650 },
    { category: 'disk', name: 'SSD NVMe Gen4 1TB', marketPrice: 350 },
    { category: 'disk', name: 'SSD NVMe Gen3 1TB', marketPrice: 250 },
    { category: 'disk', name: 'SSD SATA 1TB', marketPrice: 280 },
    { category: 'disk', name: 'SSD SATA 500GB', marketPrice: 150 },
    { category: 'disk', name: 'HDD 4TB', marketPrice: 400 },
    { category: 'disk', name: 'HDD 2TB', marketPrice: 250 }
];

// Profit Margin Configuration (How much we pay vs market price)
export const PROFIT_MARGIN = 0.70; // We pay 70% of market price
