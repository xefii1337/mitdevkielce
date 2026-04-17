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
let bookingSettings = {
    default_start_hour: 8,
    default_end_hour: 18,
    closed_days: [],
    custom_dates: {}
};

function getDaySettings(date) {
    const dayOfWeek = date.getDay(); // 0 is Sunday
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;

    let isClosed = bookingSettings.closed_days.includes(dayOfWeek);
    let startHour = bookingSettings.default_start_hour;
    let endHour = bookingSettings.default_end_hour;

    if (bookingSettings.custom_dates && bookingSettings.custom_dates[localDateStr]) {
        const custom = bookingSettings.custom_dates[localDateStr];
        if (custom.closed) {
            isClosed = true;
        } else {
            isClosed = false;
            if (custom.start_hour !== undefined) startHour = parseFloat(custom.start_hour);
            if (custom.end_hour !== undefined) endHour = parseFloat(custom.end_hour);
        }
    }
    return { isClosed, startHour, endHour };
}
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

    try {
        const { data: settings, error: settingsError } = await supabase
            .from('booking_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (!settingsError && settings) {
            bookingSettings = settings;
        }
    } catch (settingsErr) {
        console.error('Error fetching booking settings:', settingsErr);
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
            start: '2026-02-09'
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
    const fixedStartDate = new Date('2026-02-09T08:00:00');
    let searchDate = new Date(fixedStartDate);

    // If current time is past fixed start date, use current time (but we want to enforce Feb 9 minimum)
    const now = new Date();
    if (searchDate < now) {
        searchDate = new Date(now);
    }

    // Ensure we start at 8:00 of the search date
    searchDate.setHours(8, 0, 0, 0);

    // Search for next 30 days (increased range to find slot)
    for (let i = 0; i < 30; i++) {
        const { isClosed, startHour: settingStart, endHour: settingEnd } = getDaySettings(searchDate);

        if (isClosed) {
            // Move to next day
            searchDate.setDate(searchDate.getDate() + 1);
            searchDate.setHours(8, 0, 0, 0);
            continue;
        }

        // Reset to default start
        let startHour = settingStart;

        // If it's the very first day of search and it's today, ensure we don't suggest passed hours
        if (i === 0 && searchDate.toDateString() === now.toDateString()) {
            const decimalNow = now.getHours() + (now.getMinutes() / 60);
            // Nearest future 30min slot
            let nearestFutureSlot = Math.ceil(decimalNow * 2) / 2;
            startHour = Math.max(settingStart, nearestFutureSlot);
        }

        for (let currentHour = startHour; currentHour < settingEnd; currentHour += 0.5) {
            const h = Math.floor(currentHour);
            const m = currentHour % 1 === 0 ? 0 : 30;
            
            const slotDate = new Date(searchDate);
            slotDate.setHours(h, m, 0, 0);

            // Check if busy (30 min block)
            const isBusy = appointmentsCache.some(appt => {
                const apptTime = appt.getTime();
                const slotTime = slotDate.getTime();
                return Math.abs(apptTime - slotTime) < 30 * 60 * 1000;
            });

            if (!isBusy) {
                // Found it!
                proposedDate = slotDate;

                // Update UI
                const displayEl = document.getElementById('suggested-date-display');
                if (displayEl) {
                    const weekday = slotDate.toLocaleString('pl-PL', { weekday: 'long' });
                    const day = slotDate.toLocaleString('pl-PL', { day: 'numeric' });
                    const month = slotDate.toLocaleString('pl-PL', { month: 'long' });
                    const time = slotDate.toLocaleString('pl-PL', { hour: '2-digit', minute: '2-digit' });

                    // Manually construct string to prevent comma wrapping
                    displayEl.textContent = `${weekday}, ${day} ${month} ${time}`;
                }

                const acceptBtn = document.getElementById('accept-suggestion-btn');
                if (acceptBtn) acceptBtn.disabled = false;

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

    const { isClosed, startHour, endHour } = getDaySettings(selectedDay);

    if (isClosed) {
        slotsContainer.innerHTML = '<p class="text-danger text-center w-100 fw-bold py-3"><i class="bi bi-door-closed me-2"></i>Serwis jest nieczynny w tym dniu.</p>';
        return;
    }

    // Generate slots
    for (let currentHour = startHour; currentHour < endHour; currentHour += 0.5) {
        const h = Math.floor(currentHour);
        const m = currentHour % 1 === 0 ? 0 : 30;
        
        const slotDate = new Date(selectedDay);
        slotDate.setHours(h, m, 0, 0);

        // Skip past hours if today
        if (selectedDay.getTime() === today.getTime() && slotDate.getTime() <= now.getTime()) {
            continue;
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-slot-btn';
        btn.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        // Check availability
        const isBusy = appointmentsCache.some(appt => {
            const apptTime = appt.getTime();
            const slotTime = slotDate.getTime();
            return Math.abs(apptTime - slotTime) < 30 * 60 * 1000;
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
            Swal.fire({
                title: 'Sukces!',
                text: 'Wizyta została zarezerwowana! Dziękujemy.',
                icon: 'success',
                confirmButtonColor: '#ffc107',
                confirmButtonText: 'OK'
            }).then(() => {
                location.reload();
            });
        }

        // Send Email Notification (Non-blocking / Graceful failure)
        try {
            if (typeof emailjs !== 'undefined') {
                const emailParams = {
                    to_email: 'mobilnypomocnik@gmail.com',
                    from_name: `${bookingData.first_name} ${bookingData.last_name}`,
                    subject: `Nowa Rezerwacja: ${bookingData.first_name} ${bookingData.last_name}`,
                    html_body: `
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <h2 style="color: #0d6efd;">📅 Nowa Rezerwacja Wizyty</h2>
                            <p>Otrzymałeś nowe zgłoszenie rezerwacji ze strony.</p>
                            
                            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                                <tr style="background-color: #f8f9fa;">
                                    <td style="padding: 10px; border: 1px solid #ddd; width: 30%;"><strong>Data i godzina:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${new Date(bookingData.appointment_date).toLocaleString('pl-PL')}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Klient:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.first_name} ${bookingData.last_name}</td>
                                </tr>
                                <tr style="background-color: #f8f9fa;">
                                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Telefon:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #ddd;"><a href="tel:${bookingData.phone}">${bookingData.phone}</a></td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Adres:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.address}</td>
                                </tr>
                                <tr style="background-color: #f8f9fa;">
                                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Opis problemu:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.problem_desc}</td>
                                </tr>
                            </table>
                            
                            <p style="margin-top: 20px; font-size: 12px; color: #888;">Wiadomość wygenerowana automatycznie przez system MIT-DEV.</p>
                        </div>
                    `,
                    reply_to: 'no-reply@example.com'
                };

                // We don't await this to keep UI snappy, or we await with catch
                // Since we reload page, we should probably await it briefly or just fire and forget if we didn't reload.
                // But we DO reload. So we must await, otherwise reload kills the request.

                // SERVICE ID: User provided "Powiadomienie MIT-DEV" which is likely a name. 
                // Please replace 'service_ID_HERE' with the actual ID starting with 'service_' if this doesn't work.
                // Common default is often just the service ID you see in the URL or settings.
                const serviceID = 'service_h7bo6jd'; // WPISZ TU SWÓJ SERVICE ID (np. service_x93sk2a)
                const templateID = 'template_0xh6hqw';

                await emailjs.send(serviceID, templateID, emailParams);
                console.log('Email sent successfully');
            } else {
                console.warn('EmailJS not loaded');
            }
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
        }

        // Note: location.reload() is now handled by the modal close event
        // If modal is missing, the fallback above handles it.

    } catch (err) {
        console.error('Error booking:', err);
        Swal.fire({
            title: 'Błąd!',
            text: 'Wystąpił błąd podczas rezerwacji. Spróbuj ponownie.',
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
        btn.textContent = 'Rezerwuj ten termin';
        btn.disabled = false;
    }
}


