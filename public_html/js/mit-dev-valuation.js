import { hardwareDatabase, PROFIT_MARGIN } from './hardware_data.js';

document.addEventListener('DOMContentLoaded', () => {
    initValuation();
});

function initValuation() {
    console.log('Initializing Valuation System...');
    populateDataLists();
    setupEventListeners();
}

function populateDataLists() {
    populateDataList('gpu', 'gpu-list');
    populateDataList('cpu', 'cpu-list');
    populateDataList('mobo', 'mobo-list');
    populateDataList('ram', 'ram-list');
    populateDataList('disk', 'disk-list');
}

function populateDataList(category, listId) {
    const list = document.getElementById(listId);
    if (!list) return;

    const items = hardwareDatabase.filter(item => item.category === category);

    // Clear existing options
    list.innerHTML = '';

    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        // We don't show price in the value, but we could add it to label if supported
        // option.label = `~${item.marketPrice} zł`; 
        list.appendChild(option);
    });
}

function setupEventListeners() {
    const inputs = document.querySelectorAll('#section_valuation input');
    inputs.forEach(input => {
        input.addEventListener('input', calculateTotal);
        input.addEventListener('change', calculateTotal);
    });

    // Add Disk Button
    const addDiskBtn = document.getElementById('add-disk-btn');
    if (addDiskBtn) {
        addDiskBtn.addEventListener('click', () => {
            const container = document.getElementById('disks-container');
            const newDiv = document.createElement('div');
            newDiv.className = 'disk-entry mb-3 d-flex gap-2';

            newDiv.innerHTML = `
                <input class="form-control disk-input" list="disk-list" placeholder="Wpisz model (np. SSD 1TB)">
                <button type="button" class="btn btn-danger btn-sm remove-disk-btn"><i class="bi-trash"></i></button>
            `;

            container.appendChild(newDiv);

            // Re-attach listeners to new input
            const newInput = newDiv.querySelector('input');
            newInput.addEventListener('input', calculateTotal);
            newInput.addEventListener('change', calculateTotal);

            // Attach remove listener
            newDiv.querySelector('.remove-disk-btn').addEventListener('click', () => {
                newDiv.remove();
                calculateTotal();
            });
        });
    }
}

function calculateTotal() {
    let totalMarketValue = 0;
    let componentsFound = 0;

    // Helper to get price for a component name
    const getPrice = (name) => {
        if (!name) return 0;
        const item = hardwareDatabase.find(i => i.name.toLowerCase() === name.toLowerCase());
        return item ? item.marketPrice : 0;
    };

    // Main Inputs
    const ids = ['gpu-input', 'cpu-input', 'mobo-input', 'ram-input'];
    ids.forEach(id => {
        const input = document.getElementById(id);
        if (input && input.value) {
            const price = getPrice(input.value);
            if (price > 0) {
                totalMarketValue += price;
                componentsFound++;
            }
        }
    });

    // Disks
    document.querySelectorAll('.disk-input').forEach(input => {
        if (input.value) {
            const price = getPrice(input.value);
            if (price > 0) {
                totalMarketValue += price;
                componentsFound++;
            }
        }
    });

    // Apply Profit Margin (We pay less than market value)
    const offerPrice = totalMarketValue * PROFIT_MARGIN;

    // Update UI
    const totalElement = document.getElementById('total-valuation');
    if (totalElement) {
        if (totalMarketValue > 0) {
            totalElement.textContent = `${offerPrice.toFixed(0)} zł`;
            totalElement.style.color = '#28a745'; // Green

            // Optional: Show market value comparison in console or a tooltip
            // console.log(`Market Value: ${totalMarketValue}, Offer: ${offerPrice}`);
        } else {
            totalElement.textContent = '0.00 zł';
            totalElement.style.color = 'inherit';
        }
    }
}
