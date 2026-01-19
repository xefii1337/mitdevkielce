import { supabase } from './supabase-client.js';

let allComponents = [];

async function loadComponents() {
    console.log('Loading components...');
    const { data, error } = await supabase.from('components').select('*');

    if (error) {
        console.error('Error loading components:', error);
        alert('Błąd ładowania danych. Sprawdź konsolę.');
        return;
    }

    console.log('Components loaded:', data.length);
    allComponents = data;
    populateAllSelects();
}

function populateAllSelects() {
    populateSelect('gpu', 'gpu-select');
    populateSelect('cpu', 'cpu-select');
    populateSelect('mobo', 'mobo-select');
    populateSelect('ram', 'ram-select');

    // Populate existing disk selects
    document.querySelectorAll('.disk-select').forEach(select => {
        // Only populate if it has 1 option (default) or is empty
        if (select.options.length <= 1) {
            populateSelectElement(select, 'disk');
        }
    });
}

function populateSelect(category, elementId) {
    const select = document.getElementById(elementId);
    if (select) {
        populateSelectElement(select, category);
    } else {
        console.warn(`Element with ID ${elementId} not found`);
    }
}

function populateSelectElement(select, category) {
    const items = allComponents.filter(c => c.category === category);

    // Save the current selection if any
    const currentValue = select.value;

    // Keep the first "Choose..." option
    // We assume the first option is the placeholder
    let placeholder = select.options[0] ? select.options[0].text : `Wybierz ${category}`;

    select.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = placeholder;
    select.appendChild(defaultOption);

    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.purchase_price; // Use purchase price for valuation
        option.textContent = `${item.name} (${item.purchase_price} zł)`;
        option.dataset.price = item.purchase_price;
        select.appendChild(option);
    });

    // Restore selection if possible
    if (currentValue) {
        select.value = currentValue;
    }
}

function calculateTotal() {
    let total = 0;

    // Main components
    const ids = ['gpu-select', 'cpu-select', 'mobo-select', 'ram-select'];
    ids.forEach(id => {
        const select = document.getElementById(id);
        if (select && select.value) {
            total += parseFloat(select.value);
        }
    });

    // Disks
    document.querySelectorAll('.disk-select').forEach(select => {
        if (select.value) {
            total += parseFloat(select.value);
        }
    });

    const totalElement = document.getElementById('total-valuation');
    if (totalElement) {
        totalElement.textContent = `${total.toFixed(2)} zł`;

        // Add animation effect
        totalElement.style.transform = "scale(1.1)";
        setTimeout(() => {
            totalElement.style.transform = "scale(1)";
        }, 200);

        // Show/Hide PDF Button
        const pdfBtn = document.getElementById('download-pdf-btn');
        if (pdfBtn) {
            if (total > 0) {
                pdfBtn.style.display = 'inline-block';
            } else {
                pdfBtn.style.display = 'none';
            }
        }
    }
}

function init() {
    loadComponents();

    // Attach change listeners to static selects
    ['gpu-select', 'cpu-select', 'mobo-select', 'ram-select'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', calculateTotal);
        }
    });

    // Initial disk listener
    document.querySelectorAll('.disk-select').forEach(select => {
        select.addEventListener('change', calculateTotal);
    });

    // Add Disk Button
    const addDiskBtn = document.getElementById('add-disk-btn');
    if (addDiskBtn) {
        addDiskBtn.addEventListener('click', () => {
            const container = document.getElementById('disks-container');
            const newDiv = document.createElement('div');
            newDiv.className = 'disk-entry mb-3';

            const newSelect = document.createElement('select');
            newSelect.className = 'form-control disk-select';
            newSelect.innerHTML = '<option value="">Wybierz dysk</option>';

            newDiv.appendChild(newSelect);
            container.appendChild(newDiv);

            populateSelectElement(newSelect, 'disk');
            newSelect.addEventListener('change', calculateTotal);
        });
    }

    // PDF Download Button
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', generatePDF);
    }
}

async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- Load Resources (Fonts & Logo) ---
    const fontRegularUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
    const fontMediumUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf';

    let fontLoaded = false;

    try {
        const [fontRegular, fontMedium] = await Promise.all([
            fetch(fontRegularUrl).then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.arrayBuffer();
            }),
            fetch(fontMediumUrl).then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.arrayBuffer();
            })
        ]);

        // Helper to convert ArrayBuffer to Base64
        const arrayBufferToBase64 = (buffer) => {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        };

        const fontRegularBase64 = arrayBufferToBase64(fontRegular);
        const fontMediumBase64 = arrayBufferToBase64(fontMedium);

        doc.addFileToVFS('Roboto-Regular.ttf', fontRegularBase64);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

        doc.addFileToVFS('Roboto-Medium.ttf', fontMediumBase64);
        doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');
        fontLoaded = true;
    } catch (e) {
        console.warn('Could not load custom fonts, Polish characters might be missing.', e);
        alert('Uwaga: Nie udało się załadować polskiej czcionki. PDF zostanie wygenerowany standardową czcionką.');
    }

    // Load Logo
    const logoImg = new Image();
    logoImg.src = 'images/okrlogo.png';
    await new Promise((resolve) => {
        if (logoImg.complete) resolve();
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
    });

    // --- PDF Generation ---
    const mainFont = fontLoaded ? 'Roboto' : 'helvetica';
    doc.setFont(mainFont, 'normal');

    // 1. Header
    // Logo
    try {
        doc.addImage(logoImg, 'PNG', 15, 10, 25, 25);
    } catch (e) { }

    // Company Info (Right aligned)
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Mobilny Informatyk Kielce', 195, 15, { align: 'right' });
    doc.text('Dojazd do Klienta (Kielce i okolice)', 195, 20, { align: 'right' });
    doc.text('Tel: (+48) 694 297 445', 195, 25, { align: 'right' });
    doc.text('Email: mobilnypomocnik@gmail.com', 195, 30, { align: 'right' });
    doc.text('www.mobilnyinformatyk.kielce.pl', 195, 35, { align: 'right' });

    // Title
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.setFont(mainFont, 'bold');
    doc.text('WYCENA KONFIGURACJI PC', 105, 50, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.setFont(mainFont, 'normal');
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleDateString('pl-PL');
    doc.text(`Data wyceny: ${dateStr}`, 105, 56, { align: 'center' });

    // Line separator
    doc.setDrawColor(200);
    doc.line(15, 65, 195, 65);

    // 2. Content Table
    let yPos = 80;
    const startX = 15;
    const priceX = 195;

    doc.setFontSize(11);

    const addRow = (label, name, price) => {
        if (!name || name === 'Wybierz...' || price === '0.00 zł') return;

        // Label (Category)
        doc.setFont(mainFont, 'bold');
        doc.setTextColor(50);
        doc.text(label, startX, yPos);

        // Name (Component)
        doc.setFont(mainFont, 'normal');
        doc.setTextColor(0);
        // Split long names
        const nameLines = doc.splitTextToSize(name, 100);
        doc.text(nameLines, startX + 40, yPos);

        // Price
        doc.setFont(mainFont, 'bold');
        doc.text(price, priceX, yPos, { align: 'right' });

        // Calculate height for next row
        yPos += (nameLines.length * 6) + 6;
    };

    // Helper to get text and price
    const getComponentData = (id) => {
        const sel = document.getElementById(id);
        if (sel && sel.selectedIndex > 0) {
            const opt = sel.options[sel.selectedIndex];
            // Extract name and price from text "Name (Price zł)"
            // Or use dataset if available. Let's parse text for display.
            const text = opt.text;
            const priceMatch = text.match(/\(([^)]+)\)$/);
            const price = priceMatch ? priceMatch[1] : '';
            const name = text.replace(/\s*\([^)]+\)$/, '');
            return { name, price };
        }
        return null;
    };

    const gpu = getComponentData('gpu-select');
    if (gpu) addRow('Karta Graficzna', gpu.name, gpu.price);

    const cpu = getComponentData('cpu-select');
    if (cpu) addRow('Procesor', cpu.name, cpu.price);

    const mobo = getComponentData('mobo-select');
    if (mobo) addRow('Płyta Główna', mobo.name, mobo.price);

    const ram = getComponentData('ram-select');
    if (ram) addRow('Pamięć RAM', ram.name, ram.price);

    // Disks
    const diskSelects = document.querySelectorAll('.disk-select');
    diskSelects.forEach((sel, index) => {
        if (sel.selectedIndex > 0) {
            const opt = sel.options[sel.selectedIndex];
            const text = opt.text;
            const priceMatch = text.match(/\(([^)]+)\)$/);
            const price = priceMatch ? priceMatch[1] : '';
            const name = text.replace(/\s*\([^)]+\)$/, '');
            addRow(`Dysk ${index + 1}`, name, price);
        }
    });

    // 3. Total
    yPos += 10;
    doc.setDrawColor(255, 204, 0); // Primary Yellow
    doc.setLineWidth(1);
    doc.line(15, yPos, 195, yPos);

    yPos += 15;
    const totalText = document.getElementById('total-valuation').textContent;

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont(mainFont, 'normal');
    doc.text('Szacowana wartość całkowita:', 15, yPos);

    doc.setFontSize(20);
    doc.setTextColor(255, 204, 0); // Yellow
    doc.setFont(mainFont, 'bold');
    doc.text(totalText, 195, yPos, { align: 'right' });

    // 4. Footer
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.setFont(mainFont, 'normal');

    doc.text('Dokument wygenerowany automatycznie.', 105, pageHeight - 20, { align: 'center' });
    doc.text('Wycena ma charakter orientacyjny.', 105, pageHeight - 15, { align: 'center' });

    // Save
    doc.save('Wycena_Mobilny_Informatyk.pdf');
}

// Run init immediately if document is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
