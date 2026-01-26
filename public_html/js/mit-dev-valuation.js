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
    // Update UI
    const sendBtn = document.getElementById('send-offer-btn');

    // Check if any input has user text
    let hasInput = false;
    document.querySelectorAll('#section_valuation input').forEach(input => {
        if (input.value && input.value.trim() !== '' && input.type !== 'hidden') {
            hasInput = true;
        }
    });

    if (sendBtn) {
        if (hasInput) {
            sendBtn.style.display = 'inline-block';
        } else {
            sendBtn.style.display = 'none';
        }
    }
}

// Offer Submission Logic
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'send-offer-btn') {
        // No longer updating modal price display

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
        Swal.fire('Uwaga', 'Podaj kontakt!', 'warning');
        return;
    }

    const btn = document.getElementById('confirm-offer-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Wysyłanie...';
    btn.disabled = true;

    // Gather components
    const components = [];
    const inputs = document.querySelectorAll('#section_valuation input');

    // Check for file
    const fileInput = document.getElementById('valuation-photo');
    let publicUrl = null;

    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire('Błąd', 'Zdjęcie jest za duże (max 5MB).', 'error');
            btn.textContent = originalText;
            btn.disabled = false;
            return;
        }

        try {
            // Dynamic import if not already imported at top, but we do it inside try/catch block below
            const { supabase } = await import('./supabase-client.js');

            // Generate unique file name: timestamp_random_filename
            const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

            const { data, error } = await supabase.storage
                .from('valuation-images')
                .upload(fileName, file);

            if (error) {
                console.error('Upload error:', error);
                // We continue without image or throw error? Let's warn but continue? 
                // Or better throw to let user know image failed
                throw new Error('Błąd wysyłania zdjęcia: ' + error.message);
            }

            // Get Public URL
            const { data: publicUrlData } = supabase.storage
                .from('valuation-images')
                .getPublicUrl(fileName);

            publicUrl = publicUrlData.publicUrl;
            console.log('Image uploaded:', publicUrl);

        } catch (uploadError) {
            console.error(uploadError);
            Swal.fire('Błąd', 'Nie udało się wysłać zdjęcia: ' + uploadError.message, 'error');
            btn.textContent = originalText;
            btn.disabled = false;
            return;
        }
    }

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
            market_price: marketPrice,
            attachment_url: publicUrl // Save URL
        }]);

        if (error) throw error;

        if (error) throw error;

        // Send Email Notification to Admin
        try {
            if (typeof emailjs !== 'undefined') {
                const emailParams = {
                    to_email: 'mobilnypomocnik@gmail.com',
                    from_name: contact, // Client contact info
                    subject: `Nowa Wycena PC: ${contact}`,
                    html_body: `
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <h2 style="color: #198754;">💻 Nowa Wycena Sprzętu</h2>
                            <p>Klient przesłał nową konfigurację do wyceny.</p>
                            
                            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                                <tr style="background-color: #f8f9fa;">
                                    <td style="padding: 10px; border: 1px solid #ddd; width: 30%;"><strong>Kontakt:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${contact}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Oferta Klienta:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #ddd; font-size: 18px; color: #198754;"><strong>${clientPrice.toFixed(2)} zł</strong></td>
                                </tr>
                                <tr style="background-color: #f8f9fa;">
                                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Wartość Rynkowa:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${marketPrice.toFixed(2)} zł</td>
                                </tr>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${marketPrice.toFixed(2)} zł</td>
                                </tr>
                            </table>

                            ${publicUrl ? `
                            <div style="margin-top: 20px; text-align: center;">
                                <p><strong>Dołączone zdjęcie:</strong></p>
                                <img src="${publicUrl}" alt="Załącznik" style="max-width: 100%; max-height: 400px; border: 1px solid #ccc; border-radius: 5px;">
                                <p><a href="${publicUrl}" target="_blank" style="color: #198754;">Otwórz w pełnym rozmiarze</a></p>
                            </div>
                            ` : ''}

                            <h3 style="margin-top: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">Lista Podzespołów</h3>
                            <ul style="list-style-type: none; padding: 0;">
                                ${components.map(c => `
                                    <li style="padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                                        <span>${c.name}</span>
                                        <span style="color: #666;">${c.marketPrice} zł</span>
                                    </li>
                                `).join('')}
                            </ul>
                            
                            <p style="margin-top: 20px; font-size: 12px; color: #888;">Wiadomość wygenerowana automatycznie przez system MIT-DEV.</p>
                        </div>
                    `,
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

        Swal.fire({
            title: 'Oferta wysłana!',
            text: 'Skontaktujemy się z Tobą.',
            icon: 'success',
            confirmButtonColor: '#198754',
            confirmButtonText: 'OK'
        });
        const modalEl = document.getElementById('offerModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

    } catch (err) {
        console.error('Error submitting offer:', err);
        Swal.fire({
            title: 'Błąd!',
            text: 'Błąd wysyłania: ' + err.message,
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
