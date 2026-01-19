import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    // Only fetch data if we are on the admin page
    if (window.location.pathname.includes('admin.html')) {
        fetchDashboardData();
        fetchUsers();
        fetchLoginMapData();
        fetchValuations();
    }
});

async function fetchDashboardData() {
    try {
        // 1. Fetch Page Views
        const { data: pageViews, error: viewsError } = await supabase
            .from('page_views')
            .select('count')
            .eq('page', 'home')
            .single();

        if (viewsError && viewsError.code !== 'PGRST116') { // Ignore "no rows" error
            console.error('Error fetching views:', viewsError);
        }

        const viewsCount = pageViews ? pageViews.count : 0;
        document.getElementById('page-views-count').textContent = viewsCount;

        // 2. Fetch Appointments
        const { data: appointments, error: appointmentsError } = await supabase
            .from('appointments')
            .select('*')
            .order('appointment_date', { ascending: true });

        if (appointmentsError) throw appointmentsError;

        document.getElementById('total-appointments-count').textContent = appointments.length;
        initCalendar(appointments);

        // 3. Fetch User Count for Dashboard
        const { count: userCount, error: userCountError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (!userCountError) {
            document.getElementById('total-users-count').textContent = userCount || 0;
        }

    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        document.getElementById('appointments-table-body').innerHTML = `
            <tr><td colspan="7" class="text-center text-danger">Błąd pobierania danych: ${err.message}</td></tr>
        `;
    }
}

function initCalendar(appointments) {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    // Map appointments to FullCalendar events
    const events = appointments.map(appt => {
        return {
            id: appt.id, // Map database ID to event ID
            title: `${appt.first_name} ${appt.last_name}`,
            start: appt.appointment_date,
            // Add custom extended props for the tooltip
            extendedProps: {
                phone: appt.phone,
                address: appt.address,
                problem: appt.problem_desc,
                status: appt.status
            },
            backgroundColor: '#ffc107', // Primary color (yellow/gold)
            borderColor: '#ffc107',
            textColor: '#000'
        };
    });

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'listMonth',
        locale: 'pl',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'listMonth,dayGridMonth'
        },
        buttonText: {
            today: 'Dziś',
            month: 'Kalendarz',
            list: 'Lista Wizyt',
            week: 'Tydzień',
            day: 'Dzień'
        },
        noEventsContent: 'Brak wizyt w tym miesiącu',
        events: events,
        eventContent: function (arg) {
            const time = arg.event.start.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
            let statusColor = '#ffc107'; // Default yellow
            let statusText = '';

            if (arg.event.extendedProps.status === 'completed') {
                statusColor = '#198754'; // Green
                statusText = '<i class="bi-check-circle-fill me-1"></i>';
            } else if (arg.event.extendedProps.status === 'cancelled') {
                statusColor = '#dc3545'; // Red
                statusText = '<i class="bi-x-circle-fill me-1"></i>';
            }

            return {
                html: `
                    <div class="fc-event-main-frame d-flex align-items-center">
                        <div class="fc-event-time me-2" style="font-weight:bold; font-size: 0.8em; color: ${statusColor}">${statusText}</div>
                        <div class="fc-event-title-container flex-grow-1">
                            <div class="fc-event-title">${arg.event.title}</div>
                        </div>
                        <div class="ms-2">
                            <button class="btn btn-sm btn-light py-0 px-1" title="Edytuj">
                                <i class="bi-pencil-square text-primary"></i>
                            </button>
                        </div>
                    </div>
                `
            };
        },
        eventClick: function (info) {
            openAppointmentModal(info.event);
        }
    });

    calendar.render();

    // Refresh calendar when tab is shown
    const tabEl = document.querySelector('button[data-bs-target="#schedule"]');
    if (tabEl) {
        tabEl.addEventListener('shown.bs.tab', () => {
            calendar.render();
        });
    }
}

let currentEventId = null;

function openAppointmentModal(event) {
    currentEventId = event.extendedProps.id || event.id;

    // Populate inputs
    // We stored full name in title, let's try to split it or use extendedProps if we had them separate
    // Ideally we should have passed first_name and last_name in extendedProps.
    // Let's assume title is "First Last" for now, but better to fix initCalendar to pass raw data.

    // Better approach: Use the raw data we attached to extendedProps. 
    // Wait, we need to update initCalendar to pass first_name and last_name.
    // For now, let's try to split title.
    const fullName = event.title.split(' ');
    const firstName = fullName[0] || '';
    const lastName = fullName.slice(1).join(' ') || '';

    document.getElementById('modal-client-first-name').value = firstName;
    document.getElementById('modal-client-last-name').value = lastName;

    // Date and Time
    // event.start is a Date object
    const dateStr = event.start.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = event.start.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('modal-date').value = dateStr;
    document.getElementById('modal-time').value = timeStr;

    document.getElementById('modal-phone').value = event.extendedProps.phone;
    document.getElementById('modal-address').value = event.extendedProps.address;
    document.getElementById('modal-problem').value = event.extendedProps.problem;
    document.getElementById('modal-status').value = event.extendedProps.status || 'confirmed';

    // Store ID on buttons
    const saveBtn = document.getElementById('save-appointment-btn');
    saveBtn.dataset.eventId = currentEventId;

    const deleteBtn = document.getElementById('delete-appointment-btn');
    deleteBtn.dataset.eventId = currentEventId;

    const modalEl = document.getElementById('appointmentModal');
    if (modalEl) {
        // CRITICAL FIX: Move modal to body to avoid z-index/overflow issues
        document.body.appendChild(modalEl);
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    } else {
        alert('Błąd: Nie znaleziono okna wizyty. Odśwież stronę.');
    }
}

// Save Appointment Changes
document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'save-appointment-btn') {
        const btn = e.target;
        const eventId = btn.dataset.eventId;

        if (!eventId) return;

        const originalText = btn.textContent;
        btn.textContent = 'Zapisywanie...';
        btn.disabled = true;

        try {
            // Gather data
            const firstName = document.getElementById('modal-client-first-name').value;
            const lastName = document.getElementById('modal-client-last-name').value;
            const dateVal = document.getElementById('modal-date').value;
            const timeVal = document.getElementById('modal-time').value;
            const phone = document.getElementById('modal-phone').value;
            const address = document.getElementById('modal-address').value;
            const problem = document.getElementById('modal-problem').value;
            const status = document.getElementById('modal-status').value;

            // Combine date and time
            const fullDate = new Date(`${dateVal}T${timeVal}`);

            const { error } = await supabase
                .from('appointments')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    appointment_date: fullDate.toISOString(),
                    phone: phone,
                    address: address,
                    problem_desc: problem,
                    status: status
                })
                .eq('id', eventId);

            if (error) throw error;

            // Close modal
            const modalEl = document.getElementById('appointmentModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            // Refresh dashboard/calendar
            fetchDashboardData();

            alert('Wizyta została zaktualizowana.');

        } catch (err) {
            console.error('Error updating appointment:', err);
            alert('Błąd aktualizacji: ' + err.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
});

// Delete Appointment
document.addEventListener('click', async (e) => {
    // Handle click on button or icon inside button
    const btn = e.target.closest('#delete-appointment-btn');
    if (btn) {
        const eventId = btn.dataset.eventId;
        if (!eventId) return;

        if (!confirm('Czy na pewno chcesz trwale usunąć tę wizytę?')) return;

        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        btn.disabled = true;

        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', eventId);

            if (error) throw error;

            // Close modal
            const modalEl = document.getElementById('appointmentModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            // Refresh dashboard/calendar
            fetchDashboardData();

            alert('Wizyta została usunięta.');

        } catch (err) {
            console.error('Error deleting appointment:', err);
            alert('Błąd usuwania: ' + err.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
});

// --- User Management Logic ---

async function fetchUsers() {
    try {
        const { data: users, error } = await supabase
            .from('public_users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderUsersTable(users);

    } catch (err) {
        console.error('Error fetching users:', err);
        document.getElementById('users-table-body').innerHTML = `
            <tr><td colspan="4" class="text-center text-danger">Błąd pobierania użytkowników: ${err.message}</td></tr>
        `;
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Brak zarejestrowanych użytkowników.</td></tr>';
        return;
    }

    users.forEach(user => {
        const dateStr = new Date(user.created_at).toLocaleDateString('pl-PL');
        const isSelf = user.id === supabase.auth.getUser().id; // Note: this is async usually, but we can get session ID differently if needed. 
        // Actually supabase.auth.getUser() returns a promise. Let's use the session we likely have or just ignore "isSelf" check for simplicity for now, 
        // or better: just render.

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.email}</td>
            <td>${dateStr}</td>
            <td>
                <select class="form-select form-select-sm role-select" data-user-id="${user.id}" style="max-width: 150px;">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>Użytkownik</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-primary save-role-btn" data-user-id="${user.id}">Zapisz</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Add event listeners to buttons
    document.querySelectorAll('.save-role-btn').forEach(btn => {
        btn.addEventListener('click', handleRoleUpdate);
    });
}

async function handleRoleUpdate(e) {
    const btn = e.target;
    const userId = btn.dataset.userId;
    const select = document.querySelector(`.role-select[data-user-id="${userId}"]`);
    const newRole = select.value;

    const originalText = btn.textContent;
    btn.textContent = '...';
    btn.disabled = true;

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) throw error;

        alert('Rola została zaktualizowana.');
        btn.textContent = 'Zapisano';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);

    } catch (err) {
        console.error('Error updating role:', err);
        alert('Błąd aktualizacji roli: ' + err.message);
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// --- Products Management Logic ---

async function fetchProducts() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderProductsTable(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        document.getElementById('products-table-body').innerHTML = `
            <tr><td colspan="5" class="text-center text-danger">Błąd pobierania produktów: ${err.message}</td></tr>
        `;
    }
}

function renderProductsTable(products) {
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Brak produktów.</td></tr>';
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');
        const imgUrl = product.image_url || 'images/placeholder.png'; // Fallback image

        row.innerHTML = `
            <td><img src="${imgUrl}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
            <td class="fw-bold">${product.name}</td>
            <td><span class="badge bg-light text-dark border">${product.category}</span></td>
            <td class="fw-bold text-primary">${product.price} PLN</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-danger delete-product-btn" data-id="${product.id}">
                    <i class="bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Add delete listeners
    document.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (confirm('Czy na pewno chcesz usunąć ten produkt?')) {
                deleteProduct(btn.dataset.id);
            }
        });
    });
}

// Add Product Modal Handling
let selectedFiles = []; // Array to store selected files

document.getElementById('add-product-btn').addEventListener('click', () => {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('productModalTitle').textContent = 'Dodaj Produkt';

    // Reset selected files
    selectedFiles = [];
    renderSelectedImages();

    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
});

document.getElementById('product-image').addEventListener('change', function () {
    const newFiles = Array.from(this.files);

    if (selectedFiles.length + newFiles.length > 10) {
        alert('Możesz dodać maksymalnie 10 zdjęć.');
        return;
    }

    selectedFiles = selectedFiles.concat(newFiles);
    renderSelectedImages();

    // Clear input so same files can be selected again
    this.value = '';
});

function renderSelectedImages() {
    const container = document.getElementById('selected-images-container');
    container.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'position-relative';
        wrapper.style.width = '80px';
        wrapper.style.height = '80px';

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.className = 'img-thumbnail w-100 h-100';
        img.style.objectFit = 'cover';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger btn-sm position-absolute top-0 end-0 p-0 d-flex justify-content-center align-items-center';
        removeBtn.style.width = '20px';
        removeBtn.style.height = '20px';
        removeBtn.style.borderRadius = '50%';
        removeBtn.style.transform = 'translate(30%, -30%)';
        removeBtn.innerHTML = '<i class="bi-x"></i>';

        removeBtn.addEventListener('click', () => {
            selectedFiles.splice(index, 1);
            renderSelectedImages();
        });

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        container.appendChild(wrapper);
    });
}

document.getElementById('save-product-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-product-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Zapisywanie...';
    btn.disabled = true;

    try {
        const name = document.getElementById('product-name').value;
        const category = document.getElementById('product-category').value;
        const price = document.getElementById('product-price').value;
        const location = document.getElementById('product-location').value;
        const desc = document.getElementById('product-desc').value;

        // Use selectedFiles array

        let mainImageUrl = null;
        const uploadedImageUrls = [];

        // Upload Images if selected
        if (selectedFiles.length > 0) {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${i}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath);

                uploadedImageUrls.push(publicUrl);
            }
            // Set first image as main
            mainImageUrl = uploadedImageUrls[0];
        }

        // Insert Product into DB
        const { data: productData, error: insertError } = await supabase
            .from('products')
            .insert([{
                name,
                category,
                price,
                location,
                description: desc,
                image_url: mainImageUrl
            }])
            .select()
            .single();

        if (insertError) throw insertError;

        const productId = productData.id;

        // Insert Gallery Images
        if (uploadedImageUrls.length > 0) {
            const galleryInserts = uploadedImageUrls.map(url => ({
                product_id: productId,
                image_url: url
            }));

            const { error: galleryError } = await supabase
                .from('product_images')
                .insert(galleryInserts);

            if (galleryError) console.error('Error saving gallery images:', galleryError);
        }

        // Success
        const modalEl = document.getElementById('productModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        fetchProducts();
        alert('Produkt dodany pomyślnie!');

    } catch (err) {
        console.error('Error saving product:', err);
        alert('Błąd zapisu: ' + err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

async function deleteProduct(id) {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        fetchProducts();

    } catch (err) {
        console.error('Error deleting product:', err);
        alert('Błąd usuwania: ' + err.message);
    }
}

// Call fetchProducts if on admin page
if (window.location.pathname.includes('admin.html')) {
    fetchProducts();
}

// Call fetchUsers in the main load function


async function fetchLoginMapData() {
    try {
        const { data, error } = await supabase
            .from('login_history')
            .select('country_code');

        if (error) {
            // If table doesn't exist yet, just ignore (user needs to run SQL)
            if (error.code === '42P01') {
                console.warn('Login history table missing.');
                return;
            }
            throw error;
        }

        // Aggregate data
        const countryCounts = {};
        data.forEach(row => {
            const code = row.country_code; // e.g. "PL"
            if (code) {
                countryCounts[code] = (countryCounts[code] || 0) + 1;
            }
        });

        // Initialize map
        const mapEl = document.getElementById('world-map');
        if (mapEl) {
            // Clear previous content if any
            mapEl.innerHTML = '';

            new jsVectorMap({
                selector: '#world-map',
                map: 'world',
                visualizeData: {
                    scale: ['#eeeeee', '#ffc107'], // Gray to Primary Yellow
                    values: countryCounts
                },
                regionStyle: {
                    initial: {
                        fill: '#e9ecef'
                    },
                    hover: {
                        fill: '#ffc107'
                    }
                },
                onRegionTooltipShow(event, tooltip, code) {
                    const count = countryCounts[code] || 0;
                    tooltip.text(
                        `<h5>${tooltip.text()}</h5>` +
                        `<p class="mb-0">Logowań: ${count}</p>`
                    );
                }
            });
        }

    } catch (err) {
        console.error('Error fetching map data:', err);
    }
}

// --- Valuations Management Logic ---

async function fetchValuations() {
    try {
        const { data: valuations, error } = await supabase
            .from('valuations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderValuationsTable(valuations);
    } catch (err) {
        console.error('Error fetching valuations:', err);
        const tbody = document.getElementById('valuations-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr><td colspan="8" class="text-center text-danger">Błąd: ${err.message}</td></tr>
            `;
        }
    }
}

function renderValuationsTable(valuations) {
    const tbody = document.getElementById('valuations-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (valuations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Brak nadesłanych wycen.</td></tr>';
        return;
    }

    valuations.forEach(val => {
        const dateStr = new Date(val.created_at).toLocaleDateString('pl-PL') + ' ' + new Date(val.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

        // Parse components JSON
        let componentsList = '';
        if (val.components_json && Array.isArray(val.components_json)) {
            componentsList = val.components_json.map(c => `<small>${c.name}</small>`).join('<br>');
        }

        const profit = val.market_price - val.client_price;

        let statusBadge = '';
        if (val.status === 'pending') statusBadge = '<span class="badge bg-warning text-dark">Oczekuje</span>';
        else if (val.status === 'accepted') statusBadge = '<span class="badge bg-success">Zaakceptowana</span>';
        else if (val.status === 'rejected') statusBadge = '<span class="badge bg-danger">Odrzucona</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dateStr}</td>
            <td>${val.client_contact}</td>
            <td>${componentsList}</td>
            <td class="fw-bold">${parseFloat(val.client_price).toFixed(0)} zł</td>
            <td class="text-muted">${parseFloat(val.market_price).toFixed(0)} zł</td>
            <td class="text-success fw-bold">+${profit.toFixed(0)} zł</td>
            <td>${statusBadge}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary edit-valuation-btn" data-id="${val.id}" title="Edytuj"><i class="bi-pencil"></i></button>
                    <button class="btn btn-outline-success status-btn" data-id="${val.id}" data-status="accepted" title="Zaakceptuj"><i class="bi-check-lg"></i></button>
                    <button class="btn btn-outline-danger status-btn" data-id="${val.id}" data-status="rejected" title="Odrzuć"><i class="bi-x-lg"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Add listeners
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnEl = e.target.closest('button');
            const id = btnEl.dataset.id;
            const status = btnEl.dataset.status;

            if (!confirm(`Czy na pewno chcesz zmienić status na: ${status}?`)) return;

            try {
                const { error } = await supabase
                    .from('valuations')
                    .update({ status: status })
                    .eq('id', id);

                if (error) throw error;
                fetchValuations(); // Refresh
            } catch (err) {
                alert('Błąd: ' + err.message);
            }
        });
    });

    // Edit listeners
    document.querySelectorAll('.edit-valuation-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            console.log('Edit button clicked');
            const btnEl = e.target.closest('button');
            const id = btnEl.dataset.id;
            console.log('Valuation ID:', id);

            const valuation = valuations.find(v => v.id === id);
            if (valuation) {
                openValuationEditModal(valuation);
            } else {
                console.error('Valuation not found in local data');
            }
        });
    });
}

function openValuationEditModal(valuation) {
    if (!valuation) return;

    document.getElementById('edit-valuation-id').value = valuation.id;
    document.getElementById('edit-client-contact').value = valuation.client_contact;
    document.getElementById('edit-client-price').value = valuation.client_price;
    document.getElementById('edit-market-price').value = valuation.market_price;

    // Show components
    const list = document.getElementById('edit-components-list');
    list.innerHTML = '';
    if (valuation.components_json && Array.isArray(valuation.components_json)) {
        valuation.components_json.forEach(c => {
            list.innerHTML += `<div>${c.name} (${c.marketPrice} zł)</div>`;
        });
    }

    const modalEl = document.getElementById('valuationEditModal');
    if (modalEl) {
        document.body.appendChild(modalEl); // Fix z-index issues
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    } else {
        alert('Błąd: Nie znaleziono modala edycji.');
    }
}

// Save Valuation Edit
document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'save-valuation-btn') {
        const id = document.getElementById('edit-valuation-id').value;
        const clientPrice = document.getElementById('edit-client-price').value;
        const marketPrice = document.getElementById('edit-market-price').value;

        try {
            const { error } = await supabase
                .from('valuations')
                .update({
                    client_price: clientPrice,
                    market_price: marketPrice
                })
                .eq('id', id);

            if (error) throw error;

            alert('Zaktualizowano wycenę!');
            const modalEl = document.getElementById('valuationEditModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            fetchValuations(); // Refresh table

        } catch (err) {
            console.error('Error updating valuation:', err);
            alert('Błąd zapisu: ' + err.message);
        }
    }
});
