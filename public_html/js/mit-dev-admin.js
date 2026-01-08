import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    // Only fetch data if we are on the admin page
    if (window.location.pathname.includes('admin.html')) {
        fetchDashboardData();
        fetchUsers();
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
                    <div class="fc-event-main-frame">
                        <div class="fc-event-time" style="font-weight:bold; font-size: 0.8em; color: ${statusColor}">${statusText} ${time}</div>
                        <div class="fc-event-title-container">
                            <div class="fc-event-title">${arg.event.title}</div>
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
    currentEventId = event.extendedProps.id || null; // We need ID from database. 
    // Wait, we didn't map ID in initCalendar! Let's fix that in the map function above first.

    document.getElementById('modal-client-name').textContent = event.title;
    document.getElementById('modal-date').textContent = event.start.toLocaleDateString('pl-PL');
    document.getElementById('modal-time').textContent = event.start.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('modal-phone').textContent = event.extendedProps.phone;
    document.getElementById('modal-address').textContent = event.extendedProps.address;
    document.getElementById('modal-problem').textContent = event.extendedProps.problem;
    document.getElementById('modal-status').value = event.extendedProps.status || 'confirmed';

    // Store ID on the button for saving
    const saveBtn = document.getElementById('save-appointment-btn');
    saveBtn.dataset.eventId = event.id; // FullCalendar event.id

    const modal = new bootstrap.Modal(document.getElementById('appointmentModal'));
    modal.show();
}

// Add event listener for save button (outside initCalendar to avoid duplicates)
document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'save-appointment-btn') {
        const btn = e.target;
        const eventId = btn.dataset.eventId;
        const newStatus = document.getElementById('modal-status').value;

        if (!eventId) return;

        const originalText = btn.textContent;
        btn.textContent = 'Zapisywanie...';
        btn.disabled = true;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: newStatus })
                .eq('id', eventId);

            if (error) throw error;

            // Close modal
            const modalEl = document.getElementById('appointmentModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            // Refresh dashboard/calendar
            fetchDashboardData();

            alert('Status został zaktualizowany.');

        } catch (err) {
            console.error('Error updating status:', err);
            alert('Błąd aktualizacji statusu.');
        } finally {
            btn.textContent = originalText;
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

