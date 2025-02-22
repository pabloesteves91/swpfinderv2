// Globale Variablen
let people = []; // Daten aus der Excel-Datei werden hier gespeichert

/**********************
 * PASSWORTSCHUTZ *
 **********************/
function checkPassword() {
    const password = "swissport24";
    const isAuthenticated = sessionStorage.getItem("authenticated") === "true";

    if (!isAuthenticated) {
        const userPassword = prompt("Bitte geben Sie das Passwort ein, um die Web-App zu verwenden:");
        if (userPassword === password) {
            sessionStorage.setItem("authenticated", "true");
            alert("Willkommen in der SWP FINDER Web-App!");
        } else {
            alert("Falsches Passwort!");
            location.reload();
        }
    }
}

/**********************
 * APP-SPERRFUNKTION *
 **********************/
function lockApp() {
    sessionStorage.removeItem("authenticated");
    alert("Die App wurde gesperrt. Zurück zur Anmeldung!");
    location.reload();
}

/**********************
 * EXCEL-DATEN LADEN *
 **********************/
async function loadExcelData() {
    const excelFilePath = "./Mitarbeiter.xlsx";

    try {
        const response = await fetch(excelFilePath);
        if (!response.ok) throw new Error("Die Excel-Datei konnte nicht geladen werden.");

        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });

        if (!workbook.SheetNames.includes("Sheet1")) {
            alert("Die Excel-Datei muss ein Tabellenblatt mit dem Namen 'Sheet1' enthalten.");
            return;
        }

        const sheet = workbook.Sheets["Sheet1"];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        people = jsonData.map(row => ({
            personalCode: row["Personalnummer"].toString(),
            firstName: row["Vorname"],
            lastName: row["Nachname"],
            shortCode: row["Kürzel"] || null,
            position: row["Position"],
            photo: `Fotos/${row["Vorname"]}_${row["Nachname"]}.jpg`
        }));

        console.log("Excel-Daten erfolgreich geladen:", people);
    } catch (error) {
        console.error("Fehler beim Laden der Excel-Datei:", error);
        alert("Die Excel-Daten konnten nicht geladen werden.");
    }
}

/**********************
 * INTERAKTIVE ELEMENTE *
 **********************/
// Suchbutton-Status
document.getElementById("searchInput").addEventListener("input", () => {
    const searchInput = document.getElementById("searchInput").value.trim();
    document.getElementById("searchButton").disabled = searchInput === "";
});

// Zurücksetzen der Suche
document.getElementById("resetButton").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("filter").selectedIndex = 0;
    document.getElementById("searchButton").disabled = true;
    document.getElementById("results").innerHTML = "";
});

// Hauptsuchfunktion
document.getElementById("searchButton").addEventListener("click", () => {
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const filter = document.getElementById("filter").value;
    const results = document.getElementById("results");
    results.innerHTML = "";

    const filteredPeople = people.filter(person => {
        const matchesSearch = (
            person.personalCode.toLowerCase().includes(searchInput) ||
            person.shortCode?.toLowerCase().includes(searchInput) ||
            person.firstName.toLowerCase().includes(searchInput) ||
            person.lastName.toLowerCase().includes(searchInput)
        );

        const matchesFilter = (
            filter === "all" ||
            (filter === "supervisor" && person.position === "Supervisor") ||
            (filter === "arrival" && person.position === "Supervisor Arrival") ||
            (filter === "employee" && person.position === "Betriebsarbeiter") ||
            (filter === "assistant" && person.position === "Duty Manager Assistent") ||
            (filter === "manager" && person.position === "Duty Manager")
        );

        return matchesSearch && matchesFilter;
    });

    if (filteredPeople.length === 0) {
        results.innerHTML = "<p>Keine Ergebnisse gefunden.</p>";
        return;
    }

    filteredPeople.forEach(person => {
        const card = document.createElement("div");
        card.className = "result-card";
        card.innerHTML = `
            <img src="${person.photo}" alt="${person.firstName}" 
                 onerror="this.src='Fotos/default.JPG';"
                 class="profile-image">
            <h2>${person.firstName} ${person.lastName}</h2>
            <p><span>Personalnummer:</span> ${person.personalCode}</p>
            ${person.shortCode ? `<p><span>Kürzel:</span> ${person.shortCode}</p>` : ""}
            <p><span>Position:</span> ${person.position}</p>
        `;
        results.appendChild(card);
    });
});

/**********************
 * BILDVERGRÖSSERUNG *
 **********************/
// Overlay anzeigen
document.getElementById("results").addEventListener("click", (e) => {
    if (e.target.classList.contains("profile-image")) {
        const overlay = document.getElementById("imageOverlay");
        const overlayImg = overlay.querySelector(".overlay-image");
        overlayImg.src = e.target.src;
        overlay.style.display = "flex";
    }
});

// Overlay schließen
document.querySelector(".close-btn").addEventListener("click", () => {
    document.getElementById("imageOverlay").style.display = "none";
});

// Overlay bei Klick im Hintergrund schließen
document.getElementById("imageOverlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("imageOverlay")) {
        document.getElementById("imageOverlay").style.display = "none";
    }
});

/**********************
 * INITIALISIERUNG *
 **********************/
document.getElementById("lockButton").addEventListener("click", lockApp);
checkPassword();
loadExcelData();
