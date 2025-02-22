// script.js
document.addEventListener('DOMContentLoaded', () => {
    let people = [];
    const AUTH_KEY = 'swissport_auth';

    /**********************
     * PASSWORTSCHUTZ *
     **********************/
    function checkAuth() {
        if (!sessionStorage.getItem(AUTH_KEY)) {
            const password = prompt("Bitte Passwort eingeben (Standard: swissport24):");
            if (password === "swissport24") {
                sessionStorage.setItem(AUTH_KEY, 'authenticated');
                initApp();
            } else {
                alert("Ungültiges Passwort!");
                window.location.reload();
            }
        } else {
            initApp();
        }
    }

    /**********************
     * APP-INITIALISIERUNG *
     **********************/
    function initApp() {
        // Event Listener initialisieren
        document.getElementById('searchButton').addEventListener('click', executeSearch);
        document.getElementById('lockButton').addEventListener('click', lockApp);
        document.getElementById('resetButton').addEventListener('click', resetSearch);
        
        // Excel-Daten laden
        loadExcelData().then(() => {
            document.getElementById('searchInput').addEventListener('input', toggleSearchButton);
        });
    }

    /**********************
     * KERNFUNKTIONEN *
     **********************/
    async function loadExcelData() {
        try {
            const response = await fetch('./Mitarbeiter.xlsx');
            const data = await response.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            
            people = XLSX.utils.sheet_to_json(sheet).map(person => ({
                personalCode: person.Personalnummer.toString(),
                firstName: person.Vorname,
                lastName: person.Nachname,
                position: person.Position,
                photo: `Fotos/${person.Vorname}_${person.Nachname}.jpg`
            }));
            
            console.log('Daten erfolgreich geladen:', people);
        } catch (error) {
            console.error('Fehler:', error);
            alert('Daten konnten nicht geladen werden!');
        }
    }

    function executeSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filter = document.getElementById('filter').value;
        const results = document.getElementById('results');
        
        results.innerHTML = '';
        
        const filtered = people.filter(p => 
            (p.personalCode.includes(searchTerm) ||
            p.firstName.toLowerCase().includes(searchTerm) ||
            p.lastName.toLowerCase().includes(searchTerm)
            && (filter === 'all' || p.position === filter)
        );

        if (filtered.length === 0) {
            results.innerHTML = '<p class="no-results">Keine Treffer gefunden</p>';
            return;
        }

        filtered.forEach(person => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `
                <img src="${person.photo}" alt="${person.firstName}" 
                     onerror="this.onerror=null;this.src='Fotos/default.jpg';"
                     class="profile-image">
                <h3>${person.firstName} ${person.lastName}</h3>
                <p class="position">${person.position}</p>
                <p class="personal-nr">${person.personalCode}</p>
            `;
            results.appendChild(card);
        });
    }

    /**********************
     * HILFSFUNKTIONEN *
     **********************/
    function toggleSearchButton() {
        const input = document.getElementById('searchInput');
        document.getElementById('searchButton').disabled = !input.value.trim();
    }

    function resetSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filter').selectedIndex = 0;
        document.getElementById('results').innerHTML = '';
        toggleSearchButton();
    }

    function lockApp() {
        sessionStorage.removeItem(AUTH_KEY);
        window.location.reload();
    }

    /**********************
     * BILDER-OVERLAY *
     **********************/
    document.getElementById('results').addEventListener('click', e => {
        if (e.target.classList.contains('profile-image')) {
            const overlay = document.getElementById('imageOverlay');
            overlay.querySelector('img').src = e.target.src;
            overlay.style.display = 'flex';
        }
    });

    document.querySelector('.close-btn').addEventListener('click', () => {
        document.getElementById('imageOverlay').style.display = 'none';
    });

    // Initialisierung
    checkAuth();
});
