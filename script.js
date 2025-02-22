// Globale Variablen
let people = [];
let isInitialized = false;

/**********************
 * PASSWORTSCHUTZ *
 **********************/
function initializeApp() {
    if (isInitialized) return;
    
    // Passwortabfrage
    const password = "swissport24";
    const isAuthenticated = sessionStorage.getItem("authenticated") === "true";

    if (!isAuthenticated) {
        const userPassword = prompt("Bitte geben Sie das Passwort ein:");
        if (userPassword === password) {
            sessionStorage.setItem("authenticated", "true");
            setupApp();
        } else {
            alert("Zugang verweigert!");
            window.location.href = "about:blank"; // Sicherer Redirect
        }
    } else {
        setupApp();
    }
}

/**********************
 * APP-SETUP *
 **********************/
function setupApp() {
    // Event Listener registrieren
    document.getElementById("searchInput").addEventListener("input", handleSearchInput);
    document.getElementById("searchButton").addEventListener("click", performSearch);
    document.getElementById("resetButton").addEventListener("click", resetSearch);
    document.getElementById("lockButton").addEventListener("click", lockApp);

    // Excel-Daten laden
    loadExcelData().then(() => {
        console.log("App ist bereit");
        isInitialized = true;
    }).catch(error => {
        console.error("Initialisierungsfehler:", error);
        alert("Kritischer Fehler beim Start!");
    });
}

/**********************
 * SPERRFUNKTION *
 **********************/
function lockApp() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = window.location.href; // Vollständiger Reset
}

/**********************
 * DATENHANDLING *
 **********************/
async function loadExcelData() {
    try {
        const response = await fetch("./Mitarbeiter.xlsx");
        if (!response.ok) throw new Error("Serverantwort: " + response.status);
        
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        
        if (!workbook.SheetNames.includes("Sheet1")) {
            throw new Error("Fehlendes Arbeitsblatt");
        }

        const worksheet = workbook.Sheets["Sheet1"];
        people = XLSX.utils.sheet_to_json(worksheet).map(entry => ({
            personalCode: entry.Personalnummer.toString().padStart(6, '0'),
            firstName: entry.Vorname,
            lastName: entry.Nachname,
            shortCode: entry.Kürzel || "N/A",
            position: entry.Position,
            photo: `Fotos/${entry.Vorname}_${entry.Nachname}.jpg`.replace(/\s+/g, '_')
        }));

        console.log("Daten erfolgreich geladen:", people.length + " Einträge");
        
    } catch (error) {
        console.error("Datenladefehler:", error);
        throw error;
    }
}

/**********************
 * SUCHLOGIK *
 **********************/
function handleSearchInput() {
    const input = this.value.trim();
    document.getElementById("searchButton").disabled = 
        input.length < 2 && !/\d{4,}/.test(input);
}

function performSearch() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const filterValue = document.getElementById("filter").value;
    
    const results = people.filter(person => {
        const matchesTerm = [
            person.personalCode,
            person.shortCode.toLowerCase(),
            person.firstName.toLowerCase(),
            person.lastName.toLowerCase()
        ].some(field => field.includes(searchTerm));

        const matchesFilter = {
            all: true,
            supervisor: person.position === "Supervisor",
            arrival: person.position === "Supervisor Arrival",
            employee: person.position === "Betriebsarbeiter",
            assistant: person.position === "Duty Manager Assistent",
            manager: person.position === "Duty Manager"
        }[filterValue];

        return matchesTerm && matchesFilter;
    });

    displayResults(results);
}

function displayResults(results) {
    const container = document.getElementById("results");
    container.innerHTML = results.length > 0 
        ? results.map(createResultCard).join("")
        : `<p class="no-results">Keine Übereinstimmungen gefunden</p>`;
}

function createResultCard(person) {
    return `
        <div class="result-card">
            <img src="${person.photo}" 
                 alt="${person.firstName} ${person.lastName}"
                 onerror="this.src='Fotos/default.jpg'">
            <h2>${person.firstName} ${person.lastName}</h2>
            <p class="personal-code">${person.personalCode}</p>
            ${person.shortCode !== "N/A" 
                ? `<p class="short-code">Kürzel: ${person.shortCode}</p>` 
                : ""}
            <p class="position">Position: ${person.position}</p>
        </div>
    `;
}

function resetSearch() {
    document.getElementById("searchInput").value = "";
    document.getElementById("filter").selectedIndex = 0;
    document.getElementById("searchButton").disabled = true;
    document.getElementById("results").innerHTML = "";
}

/**********************
 * INITIALISIERUNG *
 **********************/
document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
    document.getElementById("lockButton").addEventListener("click", lockApp);
});
