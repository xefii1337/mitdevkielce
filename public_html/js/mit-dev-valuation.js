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
    const sendBtn = document.getElementById('send-offer-btn');

    if (totalElement) {
        if (totalMarketValue > 0) {
            totalElement.textContent = `${offerPrice.toFixed(0)} zł`;
            totalElement.style.color = '#28a745'; // Green

            if (sendBtn) sendBtn.style.display = 'inline-block';
        } else {
            totalElement.textContent = '0.00 zł';
            totalElement.style.color = 'inherit';

            if (sendBtn) sendBtn.style.display = 'none';
        }
    }
}

// Offer Submission Logic
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'send-offer-btn') {
        const totalText = document.getElementById('total-valuation').textContent;
        const modalPrice = document.getElementById('modal-offer-price');
        if (modalPrice) modalPrice.textContent = totalText;

        const modalEl = document.getElementById('offerModal');
        if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    }

    if (e.target && e.target.id === 'confirm-offer-btn') {
        submitOffer();
    }
});

async function submitOffer() {
    const contactInput = document.getElementById('offer-contact');
    const contact = contactInput ? contactInput.value : '';

    if (!contact) {
        alert('Podaj kontakt!');
        return;
    }

    const btn = document.getElementById('confirm-offer-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Wysyłanie...';
    btn.disabled = true;

    // Gather components
    const components = [];
    const inputs = document.querySelectorAll('#section_valuation input');

    // Helper to get price
    const getPrice = (name) => {
        if (!name) return 0;
        const item = hardwareDatabase.find(i => i.name.toLowerCase() === name.toLowerCase());
        return item ? item.marketPrice : 0;
    };

    inputs.forEach(input => {
        if (input.value && input.type !== 'hidden' && input.id !== 'offer-contact') {
            const price = getPrice(input.value);
            if (price > 0) {
                components.push({
                    name: input.value,
                    marketPrice: price
                });
            }
        }
    });

    const marketPrice = components.reduce((sum, item) => sum + item.marketPrice, 0);
    const clientPrice = marketPrice * PROFIT_MARGIN;

    try {
        const { supabase } = await import('./supabase-client.js');

        const { error } = await supabase.from('valuations').insert([{
            client_contact: contact,
            components_json: components,
            client_price: clientPrice,
            market_price: marketPrice
        }]);

        if (error) throw error;

        if (error) throw error;

        // Send Email Notification to Admin
        try {
            if (typeof emailjs !== 'undefined') {
                const emailParams = {
                    to_email: 'mobilnypomocnik@gmail.com',
                    from_name: contact, // Client contact info
                    message: `Nowa wycena PC!
                    
                    Kontakt: ${contact}
                    Wycena klienta: ${clientPrice.toFixed(2)} zł
                    Wartość rynkowa: ${marketPrice.toFixed(2)} zł
                    
                    Podzespoły:
                    ${components.map(c => `- ${c.name} (${c.marketPrice} zł)`).join('\n')}`,
                    reply_to: contact
                };

                const serviceID = 'service_h7bo6jd'; // WPISZ TU SWÓJ SERVICE ID
                const templateID = 'template_0xh6hqw';

                await emailjs.send(serviceID, templateID, emailParams);
                console.log('Valuation email sent');
            }
        } catch (emailError) {
            console.error('Failed to send valuation email:', emailError);
        }

        alert('Oferta wysłana! Skontaktujemy się z Tobą.');
        const modalEl = document.getElementById('offerModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

    } catch (err) {
        console.error('Error submitting offer:', err);
        alert('Błąd wysyłania: ' + err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
