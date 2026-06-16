const appointmentForm = document.getElementById("appointmentForm");
const appointmentMessage = document.getElementById("appointmentMessage");

const datumInput = document.getElementById("datum");
const tijdSelect = document.getElementById("tijd");
const telefoonInput = document.getElementById("telefoon");

if (telefoonInput) {
    telefoonInput.addEventListener("input", function () {
        telefoonInput.value = telefoonInput.value.replace(/[^+0-9\s]/g, "");
    });
}

function getTodayDateString() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getCurrentTimeInMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

function clearTimeOptions(message) {
    tijdSelect.innerHTML = "";

    const option = document.createElement("option");
    option.value = "";
    option.textContent = message;
    option.disabled = true;
    option.selected = true;

    tijdSelect.appendChild(option);
}

function addTimeOption(time) {
    const option = document.createElement("option");
    option.value = time;
    option.textContent = time;

    tijdSelect.appendChild(option);
}

function getDayFromDateString(dateString) {
    const parts = dateString.split("-");

    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);

    return new Date(year, month, day).getDay();
}

function generateTimeOptions() {
    clearTimeOptions("Kies een tijdstip");

    const selectedDate = datumInput.value;
    const today = getTodayDateString();

    if (selectedDate === "") {
        clearTimeOptions("Kies eerst een datum");
        return;
    }

    const selectedDay = getDayFromDateString(selectedDate);
    const sunday = 0;
    const saturday = 6;

    if (selectedDay === sunday) {
        clearTimeOptions("Gesloten op zondag");
        return;
    }

    const openingTimeInMinutes = 9 * 60;
    let closingTimeInMinutes = 18 * 60;

    if (selectedDay === saturday) {
        closingTimeInMinutes = 17 * 60;
    }

    const currentTimeInMinutes = getCurrentTimeInMinutes();

    let availableTimes = 0;

    for (
        let timeInMinutes = openingTimeInMinutes;
        timeInMinutes <= closingTimeInMinutes;
        timeInMinutes += 30
    ) {
        if (selectedDate === today && timeInMinutes <= currentTimeInMinutes) {
            continue;
        }

        const hours = Math.floor(timeInMinutes / 60);
        const minutes = timeInMinutes % 60;

        const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

        addTimeOption(time);
        availableTimes++;
    }

    if (availableTimes === 0) {
        clearTimeOptions("Geen tijdstippen meer beschikbaar vandaag");
    }
}

function setupDateAndTimeLimits() {
    if (!datumInput || !tijdSelect) {
        return;
    }

    datumInput.min = getTodayDateString();

    clearTimeOptions("Kies eerst een datum");

    datumInput.addEventListener("change", function () {
        generateTimeOptions();
    });
}

function isAppointmentInPast(date, time) {
    const selectedAppointment = new Date(`${date}T${time}`);
    const now = new Date();

    return selectedAppointment < now;
}

function isValidPhoneNumber(phoneNumber) {
    const cleanedPhoneNumber = phoneNumber.replace(/\s/g, "");

    const belgianMobileLocal = /^04\d{8}$/;
    const belgianMobileInternationalPlus = /^\+324\d{8}$/;
    const belgianMobileInternationalDoubleZero = /^00324\d{8}$/;

    return (
        belgianMobileLocal.test(cleanedPhoneNumber) ||
        belgianMobileInternationalPlus.test(cleanedPhoneNumber) ||
        belgianMobileInternationalDoubleZero.test(cleanedPhoneNumber)
    );
}

if (appointmentForm) {
    setupDateAndTimeLimits();

    appointmentForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const naam = document.getElementById("naam").value.trim();
        const telefoon = document.getElementById("telefoon").value.trim();
        if (!isValidPhoneNumber(telefoon)) {
            appointmentMessage.textContent = "Vul een geldig telefoonnummer in. Gebruik bijvoorbeeld 0486 21 50 01 of +32 486 21 50 01.";
            appointmentMessage.className = "appointment-message error-message";
            return;
        }
        const email = document.getElementById("email").value.trim();

        const behandelingSelect = document.getElementById("behandeling");
        const behandeling = behandelingSelect.value;
        const behandelingTekst = behandelingSelect.selectedOptions[0].text;

        const datum = datumInput.value;
        const tijd = tijdSelect.value;

        if (naam === "" || telefoon === "" || email === "" || behandeling === "" || datum === "" || tijd === "") {
            appointmentMessage.textContent = "Vul alle verplichte velden in.";
            appointmentMessage.className = "appointment-message error-message";
            return;
        }

        if (!isValidPhoneNumber(telefoon)) {
            appointmentMessage.textContent = "Vul een geldig Belgisch telefoonnummer in, bijvoorbeeld 0486 21 50 01 of +32 486 21 50 01.";
            appointmentMessage.className = "appointment-message error-message";
            return;
        }

        if (datum < getTodayDateString()) {
            appointmentMessage.textContent = "Je kan geen datum in het verleden kiezen.";
            appointmentMessage.className = "appointment-message error-message";
            return;
        }

        if (isAppointmentInPast(datum, tijd)) {
            appointmentMessage.textContent = "Je kan geen tijdstip in het verleden kiezen.";
            appointmentMessage.className = "appointment-message error-message";
            return;
        }

        appointmentMessage.innerHTML = `
            <strong>Bedankt, ${naam}!</strong><br>
            Je afspraak voor <strong>${behandelingTekst}</strong> op <strong>${datum}</strong> om <strong>${tijd}</strong> is aangevraagd.<br>
            We nemen contact met je op via <strong>${telefoon}</strong> of <strong>${email}</strong>.
        `;

        appointmentMessage.className = "appointment-message success-message";

        appointmentForm.reset();
        clearTimeOptions("Kies eerst een datum");
    });
}