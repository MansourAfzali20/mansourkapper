const appointmentForm = document.getElementById("appointmentForm");
const appointmentMessage = document.getElementById("appointmentMessage");

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxgMdGbGOx5VNgzY5iGw7lsYMRVpiWRRoTSXHQnkZTQoHUWOFAiJvXJbDgFp6FwEMjF/exec";

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


async function getBookedTimesFromCalendar(selectedDate) {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?datum=${selectedDate}`);
        const data = await response.json();

        if (data.success && Array.isArray(data.bookedTimes)) {
            return data.bookedTimes;
        }

        return [];
    } catch (error) {
        console.log("Kon geboekte tijdstippen niet ophalen:", error);
        return [];
    }
}

async function generateTimeOptions() {
    clearTimeOptions("Tijdstippen laden...");

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

    const bookedTimes = await getBookedTimesFromCalendar(selectedDate);

    clearTimeOptions("Kies een tijdstip");

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
        const hours = Math.floor(timeInMinutes / 60);
        const minutes = timeInMinutes % 60;

        const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

        if (selectedDate === today && timeInMinutes <= currentTimeInMinutes) {
            continue;
        }

        if (bookedTimes.includes(time)) {
            continue;
        }

        addTimeOption(time);
        availableTimes++;
    }

    if (availableTimes === 0) {
        clearTimeOptions("Geen tijdstippen beschikbaar");
    }
}

function setupDateAndTimeLimits() {
    if (!datumInput || !tijdSelect) {
        return;
    }

    datumInput.min = getTodayDateString();

    clearTimeOptions("Kies eerst een datum");

    datumInput.addEventListener("change", async function () {
        await generateTimeOptions();
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

    appointmentForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const naam = document.getElementById("naam").value.trim();
        const telefoon = document.getElementById("telefoon").value.trim();
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

        appointmentMessage.textContent = "Even geduld... Je afspraak wordt verzonden.";
        appointmentMessage.className = "appointment-message success-message";

        const afspraakData = {
            naam: naam,
            telefoon: telefoon,
            email: email,
            behandeling: behandelingTekst,
            datum: datum,
            tijd: tijd,
            bericht: document.getElementById("bericht").value.trim()
        };

        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(afspraakData)
            });

            appointmentMessage.innerHTML = `
                <strong>Bedankt, ${naam}!</strong><br>
                Je afspraak voor <strong>${behandelingTekst}</strong> op <strong>${datum}</strong> om <strong>${tijd}</strong> is aangevraagd.<br>
                De afspraak wordt toegevoegd aan de kalender.
            `;

            appointmentMessage.className = "appointment-message success-message";

            appointmentForm.reset();
            clearTimeOptions("Kies eerst een datum");

        } catch (error) {
            appointmentMessage.textContent = "Er ging iets mis bij het verzenden van je afspraak. Probeer opnieuw.";
            appointmentMessage.className = "appointment-message error-message";
        }
    });
}