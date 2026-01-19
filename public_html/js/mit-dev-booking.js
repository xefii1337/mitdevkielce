import { supabase } from './supabase-client.js';

let proposedDate = null;

function onReady() {
    console.log('Booking script initialized');
    const checkBtn = document.getElementById('check-slot-btn');
    const confirmBtn = document.getElementById('confirm-booking-btn');

    initBookingCalendar();

    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmBooking);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
} else {
    onReady();
}

let appointmentsCache = [];

async function initBookingCalendar(retryCount = 0) {
    if (typeof FullCalendar === 'undefined') {
        if (retryCount < 10) {
            setTimeout(() => initBookingCalendar(retryCount + 1), 100);
            return;
        }
        return;
    }

    const calendarEl = document.getElementById('booking-calendar');
    if (!calendarEl) return;

    // Fetch all future appointments once and cache them
    // Fetch all future appointments using the secure RPC function
    try {
        // We use rpc('get_busy_slots') instead of .select() on the table
        // This prevents exposing personal data (names, phones) to the public.
        const { data: appointments, error } = await supabase
            .rpc('get_busy_slots');

        if (!error && appointments) {
            appointmentsCache = appointments.map(a => new Date(a.appointment_date));
        } else if (error) {
            console.error('Error fetching slots:', error);
        }
    } catch (err) {
        console.error('Error fetching appointments:', err);
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pl',
        firstDay: 1,
        headerToolbar: {
            left: 'prev,next',
            center: 'title',
            right: ''
        },
        titleFormat: { year: 'numeric', month: 'long' },
        dayHeaderFormat: { weekday: 'narrow' }, // Single letter: P, W, Ś...
        height: 'auto',
        selectable: true,
        dateClick: function (info) {
            handleDateClick(info.date, info.dateStr);
        },
        select: function (info) {
            handleDateClick(info.start, info.startStr);
        },
        validRange: {
            start: new Date()
        }
    });

    calendar.render();

    // Find and suggest earliest slot
    suggestEarliestSlot();

    // Handle "Choose other date" button
    document.getElementById('show-calendar-btn').addEventListener('click', () => {
        document.getElementById('booking-suggestion-container').classList.add('d-none');
        document.getElementById('manual-calendar-container').classList.remove('d-none');
        // Trigger resize to ensure calendar renders correctly after being hidden
        setTimeout(() => calendar.updateSize(), 100);
    });

    // Handle "Accept suggestion" button
    document.getElementById('accept-suggestion-btn').addEventListener('click', () => {
        console.log('Accept suggestion clicked', proposedDate);
        if (proposedDate) {
            // Show confirmation area at bottom
            const resultDiv = document.getElementById('slot-result');
            const dateSpan = document.getElementById('proposed-date');
            const labelSpan = document.getElementById('booking-label');

            resultDiv.classList.remove('d-none');
            if (labelSpan) labelSpan.textContent = 'Wybrany termin:';

            dateSpan.textContent = proposedDate.toLocaleString('pl-PL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Scroll to confirmation area
            setTimeout(() => {
                resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } else {
            console.warn('No proposed date found when clicking accept');
        }
    });
}

function suggestEarliestSlot() {
    const now = new Date();
    let searchDate = new Date(now);

    // Search for next 14 days
    for (let i = 0; i < 14; i++) {
        // Reset to 8:00 if it's a new day, or next hour if today
        let startHour = 8;
        if (i === 0) {
            startHour = Math.max(8, now.getHours() + 1);
        }

        for (let hour = startHour; hour < 18; hour++) {
            const slotDate = new Date(searchDate);
            slotDate.setHours(hour, 0, 0, 0);

            // Check if busy
            const isBusy = appointmentsCache.some(appt => {
                const apptTime = appt.getTime();
                const slotTime = slotDate.getTime();
                return Math.abs(apptTime - slotTime) < 60 * 60 * 1000;
            });

            if (!isBusy) {
                // Found it!
                proposedDate = slotDate;

                // Update UI
                const displayEl = document.getElementById('suggested-date-display');
                displayEl.textContent = slotDate.toLocaleString('pl-PL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                document.getElementById('accept-suggestion-btn').disabled = false;
                return;
            }
        }
        // Move to next day
        searchDate.setDate(searchDate.getDate() + 1);
        searchDate.setHours(8, 0, 0, 0);
    }

    // If no slot found
    document.getElementById('suggested-date-display').textContent = 'Brak wolnych terminów w najbliższym czasie.';
}

function handleDateClick(date, dateStr) {
    const slotsColumn = document.getElementById('slots-column');
    const slotsContainer = document.getElementById('time-slots');

    // Highlight selected date
    document.querySelectorAll('.custom-selected-day').forEach(el => el.classList.remove('custom-selected-day'));
    // FullCalendar cells have data-date attribute
    // If dateStr is provided, use it. Otherwise format date.
    let targetDateStr = dateStr;
    if (!targetDateStr) {
        // Fallback formatting
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        targetDateStr = `${year}-${month}-${day}`;
    }

    const dayEl = document.querySelector(`.fc-day[data-date="${targetDateStr}"]`);
    if (dayEl) {
        dayEl.classList.add('custom-selected-day');
    }

    // Show the column
    if (slotsColumn) {
        slotsColumn.classList.remove('d-none');
    }

    slotsContainer.innerHTML = ''; // Clear previous slots

    // Reset proposed date
    proposedDate = null;
    document.getElementById('slot-result').classList.add('d-none');

    const now = new Date();
    // Reset time part for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (selectedDay < today) {
        slotsContainer.innerHTML = '<p class="text-danger text-center w-100">Nie można wybrać daty z przeszłości.</p>';
        return;
    }

    // Generate slots from 8:00 to 17:00
    for (let hour = 8; hour < 18; hour++) {
        const slotDate = new Date(selectedDay);
        slotDate.setHours(hour, 0, 0, 0);

        // Skip past hours if today
        if (selectedDay.getTime() === today.getTime() && hour <= now.getHours()) {
            continue;
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-slot-btn';
        btn.textContent = `${hour}:00`;

        // Check availability
        const isBusy = appointmentsCache.some(appt => {
            // Simple check: if appointment is within this hour
            // Assuming appointments are 1 hour long for simplicity
            const apptTime = appt.getTime();
            const slotTime = slotDate.getTime();
            return Math.abs(apptTime - slotTime) < 60 * 60 * 1000;
        });

        if (isBusy) {
            btn.disabled = true;
            btn.title = 'Termin zajęty';
        } else {
            btn.onclick = () => selectSlot(btn, slotDate);
        }

        slotsContainer.appendChild(btn);
    }

    if (slotsContainer.children.length === 0) {
        slotsContainer.innerHTML = '<p class="text-muted text-center w-100">Brak wolnych terminów w tym dniu.</p>';
    }
}

function selectSlot(btn, date) {
    // Remove active class from all buttons
    document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));

    // Add active class to clicked button
    btn.classList.add('selected');

    proposedDate = date;

    // Show confirmation area
    const resultDiv = document.getElementById('slot-result');
    const dateSpan = document.getElementById('proposed-date');
    const labelSpan = document.getElementById('booking-label');

    resultDiv.classList.remove('d-none');
    if (labelSpan) {
        labelSpan.textContent = 'Wybrany termin:';
    }

    dateSpan.textContent = proposedDate.toLocaleString('pl-PL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function confirmBooking() {
    if (!proposedDate) return;

    const form = document.getElementById('booking-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const btn = document.getElementById('confirm-booking-btn');
    btn.textContent = 'Rezerwowanie...';
    btn.disabled = true;

    const formData = new FormData(form);

    const bookingData = {
        first_name: formData.get('first-name'),
        last_name: formData.get('last-name'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        problem_desc: formData.get('problem-desc'),
        appointment_date: proposedDate.toISOString(),
        status: 'confirmed'
    };

    try {
        const { error } = await supabase
            .from('appointments')
            .insert([bookingData]);

        if (error) throw error;

        // Show Success Modal instead of alert
        const successModalEl = document.getElementById('bookingSuccessModal');
        if (successModalEl) {
            // Populate data
            document.getElementById('success-modal-date').textContent = new Date(bookingData.appointment_date).toLocaleString('pl-PL');
            document.getElementById('success-modal-name').textContent = `${bookingData.first_name} ${bookingData.last_name}`;
            document.getElementById('success-modal-phone').textContent = bookingData.phone;

            // Show modal
            const modal = new bootstrap.Modal(successModalEl);
            modal.show();

            // Reload page only after modal is closed
            successModalEl.addEventListener('hidden.bs.modal', () => {
                location.reload();
            });

            // Also handle the explicit OK button if needed (though hidden.bs.modal covers it)
            // But let's be safe if they click outside
        } else {
            // Fallback if modal missing
            alert('Wizyta została zarezerwowana! Dziękujemy.');
            location.reload();
        }

        // Send Email Notification (Non-blocking / Graceful failure)
        try {
            if (typeof emailjs !== 'undefined') {
                const emailParams = {
                    to_email: 'mobilnypomocnik@gmail.com',
                    from_name: `${bookingData.first_name} ${bookingData.last_name}`,
                    message: `Nowa rezerwacja:
                    Data: ${new Date(bookingData.appointment_date).toLocaleString('pl-PL')}
                    Telefon: ${bookingData.phone}
                    Adres: ${bookingData.address}
                    Problem: ${bookingData.problem_desc}`,
                    reply_to: 'no-reply@example.com'
                };

                // We don't await this to keep UI snappy, or we await with catch
                // Since we reload page, we should probably await it briefly or just fire and forget if we didn't reload.
                // But we DO reload. So we must await, otherwise reload kills the request.
                await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', emailParams);
                console.log('Email sent successfully');
            } else {
                console.warn('EmailJS not loaded');
            }
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Do NOT alert user, as booking was successful
        }

        // Note: location.reload() is now handled by the modal close event
        // If modal is missing, the fallback above handles it.

    } catch (err) {
        console.error('Error booking:', err);
        alert('Wystąpił błąd podczas rezerwacji. Spróbuj ponownie.');
        btn.textContent = 'Rezerwuj ten termin';
        btn.disabled = false;
    }
}


