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
}

// Run init immediately if document is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
