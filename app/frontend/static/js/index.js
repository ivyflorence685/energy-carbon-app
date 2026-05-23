window.onload = function () {

    // =========================================
    // STORAGE KEY
    // =========================================

    const STORAGE_KEY = "ecotrack-rooms-v1";

    // =========================================
    // DEFAULT ROOMS
    // =========================================

    const DEFAULT_ROOMS = {

        "living-room": [{
            id: "default-living",
            name: "Living Room"
        }],

        "kitchen": [{
            id: "default-kitchen",
            name: "Kitchen"
        }],

        "bedroom": [{
            id: "default-bedroom",
            name: "Master Bedroom"
        }],

        "bathroom": [{
            id: "default-bathroom",
            name: "Bathroom"
        }],

        "study-room": [{
            id: "default-study",
            name: "Study Room"
        }],

        "dining-room": [{
            id: "default-dining",
            name: "Dining Room"
        }]
    };

    // =========================================
    // ROOM CONFIG
    // =========================================

    const ROOM_CONFIG = {

        "living-room": {
            title: "Living Room",
            image: "/static/images/living.jpg",
            icon: "🏠"
        },

        "kitchen": {
            title: "Kitchen",
            image: "/static/images/kitchen.jpg",
            icon: "🍴"
        },

        "bedroom": {
            title: "Bedroom",
            image: "/static/images/bedroom.jpg",
            icon: "🛏"
        },

        "bathroom": {
            title: "Bathroom",
            image: "/static/images/bathroom.jpg",
            icon: "🚿"
        },

        "study-room": {
            title: "Study Room",
            image: "/static/images/study.jpg",
            icon: "📚"
        },

        "dining-room": {
            title: "Dining Room",
            image: "/static/images/dining.jpg",
            icon: "🍽"
        }
    };

    // =========================================
    // GLOBAL VARIABLES
    // =========================================

    let fullData = [];

    let energyChart;
    let co2Chart;

    let currentPage = 1;

    const rowsPerPage = 10;

    let tableData = [];

    let currentCategory = "";

    let rooms = [];

    // =========================================
    // INITIALIZE ROOM STORAGE
    // =========================================

    function initializeRoomStorage() {

        let stored = localStorage.getItem(STORAGE_KEY);

        if (!stored) {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(DEFAULT_ROOMS)
            );
        }
    }

    initializeRoomStorage();

    // =========================================
    // NORMALIZE DAY
    // =========================================

    function normalizeDay(day) {

        return day.toLowerCase().replace("_", " ");
    }

    // =========================================
    // FILTER BY DAY
    // =========================================

    function filterByDay(data, selectedDay) {

        if (selectedDay === "all") return data;

        return data.filter(item =>
            normalizeDay(item.day) === normalizeDay(selectedDay)
        );
    }

    // =========================================
    // AGGREGATE APPLIANCE
    // =========================================

    function aggregateAppliance(data) {

        let map = {};

        data.forEach(item => {

            let key = item["Appliance"];

            let energy =
                Number(item["Energy Consumption in units"]);

            let co2 =
                Number(item["CO2 emissions in kg"]);

            if (!map[key]) {

                map[key] = {
                    energy: 0,
                    co2: 0
                };
            }

            map[key].energy += energy;
            map[key].co2 += co2;
        });

        return map;
    }

    // =========================================
    // RENDER CHARTS
    // =========================================

    function renderCharts(filtered) {

        let map = aggregateAppliance(filtered);

        let labels = Object.keys(map);

        let energyValues =
            labels.map(k => map[k].energy);

        let co2Values =
            labels.map(k => map[k].co2);

        if (energyChart) energyChart.destroy();
        if (co2Chart) co2Chart.destroy();

        energyChart = new Chart(
            document.getElementById("energyChart"),
            {
                type: "bar",

                data: {
                    labels,

                    datasets: [{
                        label: "Energy",
                        data: energyValues
                    }]
                }
            }
        );

        co2Chart = new Chart(
            document.getElementById("co2Chart"),
            {
                type: "bar",

                data: {
                    labels,

                    datasets: [{
                        label: "CO2",
                        data: co2Values
                    }]
                }
            }
        );
    }
    
    
    // =========================================
    // RENDER TABLE
    // =========================================

    function renderTables(filtered) {

        tableData = filtered;

        let tableBody =
            document.getElementById("applianceTable");

        tableBody.innerHTML = "";

        let startIndex =
            (currentPage - 1) * rowsPerPage;

        let endIndex =
            startIndex + rowsPerPage;

        let currentRows =
            filtered.slice(startIndex, endIndex);

        currentRows.forEach(item => {

            tableBody.innerHTML += `
            <tr>
                <td>${item.day}</td>
                <td>${item.Room}</td>
                <td>${item.Appliance}</td>
                <td>${item["Number of appliance in use"]}</td>
                <td>${item["Utilization Hours"]}</td>

                <td class="energy">
                    ${Number(item["Energy Consumption in units"]).toFixed(2)}
                </td>

                <td class="co2">
                    ${Number(item["CO2 emissions in kg"]).toFixed(2)}
                </td>
            </tr>
            `;
        });

        let totalEntries = filtered.length;

        let totalPages =
            Math.ceil(totalEntries / rowsPerPage) || 1;

        document.getElementById("tableInfo").innerText =
            `Showing ${startIndex + 1} to ${Math.min(endIndex, totalEntries)} of ${totalEntries} entries`;

        document.getElementById("pageInfo").innerText =
            `Page ${currentPage} of ${totalPages}`;

        let prevButton =
            document.getElementById("prevBtn");

        let nextButton =
            document.getElementById("nextBtn");

        prevButton.disabled =
            currentPage === 1;

        nextButton.disabled =
            currentPage === totalPages;
    }

    // =========================================
    // RENDER ALERTS
    // =========================================

    function renderAlerts(filtered) {

        let alertBox =
            document.getElementById("alertsList");

        alertBox.innerHTML = "";

        filtered.forEach(item => {

            let energy =
                Number(item["Energy Consumption in units"]);

            let hours =
                Number(item["Utilization Hours"]);

            // HIGH ENERGY ALERT

            if (energy > 1.5) {

                let li =
                    document.createElement("li");

                li.textContent =
                    "⚠ High energy usage in " +
                    item["Room"];

                alertBox.appendChild(li);
            }

            // OVERUSE ALERT

            if (hours > 10) {

                let li =
                    document.createElement("li");

                li.textContent =
                    "⚠ Overuse of " +
                    item["Appliance"];

                alertBox.appendChild(li);
            }
        });

        if (alertBox.children.length === 0) {

            alertBox.innerHTML =
                "<li>No alerts</li>";
        }
    }

    // =========================================
    // UPDATE VIEW
    // =========================================

    function updateView(selectedDay) {

        currentPage = 1;

        let filtered =
            filterByDay(fullData, selectedDay);

        renderCharts(filtered);

        renderTables(filtered);

        renderAlerts(filtered);
    }

    // =========================================
    // POPULATE DAYS
    // =========================================

    function populateDays(data) {

        let selector =
            document.getElementById("daySelector");

        let days = [
            ...new Set(
                data.map(item =>
                    normalizeDay(item.day)
                )
            )
        ];

        days.forEach(day => {

            let option =
                document.createElement("option");

            option.value = day;

            option.textContent = day;

            selector.appendChild(option);
        });
    }

    // =========================================
    // PREVIOUS BUTTON
    // =========================================

    document
        .getElementById("prevBtn")
        .addEventListener("click", () => {

            if (currentPage > 1) {

                currentPage--;

                renderTables(tableData);
            }
        });

    // =========================================
    // NEXT BUTTON
    // =========================================

    document
        .getElementById("nextBtn")
        .addEventListener("click", () => {

            let totalPages =
                Math.ceil(tableData.length / rowsPerPage);

            if (currentPage < totalPages) {

                currentPage++;

                renderTables(tableData);
            }
        });

    // =========================================
    // FETCH DATA
    // =========================================

    fetch("/data")
        .then(res => res.json())

        .then(data => {

            fullData = data;

            populateDays(fullData);

            updateView("all");

            // =========================================
            // DAY SELECTOR
            // =========================================

            document
                .getElementById("daySelector")
                .addEventListener("change", function () {

                    updateView(this.value);
                });
            
// ------------------------------------
// Total Energy Consumption
// ------------------------------------
const totalEnergy = data.reduce((sum, item) => {
    return sum + Number(item["Energy Consumption in units"]);
}, 0);


// ------------------------------------
// Total Carbon Emission
// ------------------------------------
const totalCarbon = data.reduce((sum, item) => {
    return sum + Number(item["CO2 emissions in kg"]);
}, 0);


// ------------------------------------
// Highest Energy Consumption
// ------------------------------------
const highestConsumption = Math.max(
    ...data.map(item =>
        Number(item["Energy Consumption in units"])
    )
);
//-------------------------------------
// Total Devices Used
// ------------------------------------
const totalDevices = data.filter(item => item["day"] === "day_1").reduce((sum, item) => {
        return sum + Number(item["Total number of appliance"]);
    }, 0);

// ------------------------------------
// Display in HTML
// ------------------------------------

document.getElementById("totalEnergy").innerText = totalEnergy.toFixed(2);

document.getElementById("totalCO2").innerText = totalCarbon.toFixed(2);

document.getElementById("devices").innerText = totalDevices;

document.getElementById("peakUsage").innerText = highestConsumption;

            // =========================================
            // SLIDER
            // =========================================

            document
                .getElementById("daySlider")
                .addEventListener("input", function () {

                    let day =
                        "day " + this.value;

                    document
                        .getElementById("sliderValue")
                        .innerText = day;

                    updateView(day);
                });
        })

        .catch(error => {

            console.error("Error fetching data:", error);
        });
    
        
    // =========================================
    // OPEN MODAL
    // =========================================

    window.openRoomModal = function (category) {

        currentCategory = category;

        let config = ROOM_CONFIG[category];

        document
            .getElementById("categoryTitle")
            .innerText = config.title;

        document
            .getElementById("modalImage")
            .src = config.image;

        document
            .getElementById("modalIcon")
            .innerText = config.icon;

        document
            .getElementById("modalOverlay")
            .classList.remove("hidden");

        loadRooms(category);
    };

    // =========================================
    // CLOSE MODAL
    // =========================================

    window.closeModal = function () {

        document
            .getElementById("modalOverlay")
            .classList.add("hidden");
    };

    // =========================================
    // LOAD ROOMS
    // =========================================

    function loadRooms(category) {

        let stored =
            localStorage.getItem(STORAGE_KEY);

        let allRooms =
            stored ? JSON.parse(stored) : {};

        if (
            !allRooms[category] ||
            allRooms[category].length === 0
        ) {

            allRooms[category] =
                DEFAULT_ROOMS[category];

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(allRooms)
            );
        }

        rooms = allRooms[category];

        renderRooms();
    }

    // =========================================
    // SAVE ROOMS
    // =========================================

    function saveRooms() {

        let stored =
            localStorage.getItem(STORAGE_KEY);

        let allRooms =
            stored ? JSON.parse(stored) : {};

        allRooms[currentCategory] = rooms;

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(allRooms)
        );
    }

    // =========================================
    // RENDER ROOMS
    // =========================================

    function renderRooms() {

    const roomList =
    document.getElementById("roomList");

    roomList.innerHTML = "";

    document
    .getElementById("roomCount")
    .innerText =
    `${rooms.length} rooms configured`;

    rooms.forEach(room => {

        let div =
        document.createElement("div");

        div.className = "room-item";

        div.innerHTML = `

        <div class="room-left">

            <div
                class="room-name-container"
            >

                <span
                    class="room-name"
                    id="room-name-${room.id}"
                    ondblclick="enableRename('${room.id}')"
                    onclick="goToRoom('${room.name}')"
                >
                    ${room.name}
                </span>

            </div>

        </div>

        <div class="room-actions">

            <button
                class="rename-btn"
                onclick="enableRename('${room.id}')"
                title="Rename Room"
            >
                ✏
            </button>

            <button
                class="delete-btn"
                onclick="deleteRoom('${room.id}')"
                title="Delete Room"
            >
                🗑
            </button>

        </div>

        `;

        roomList.appendChild(div);
    });
}
   
    // =========================================
    // SHOW ADD ROOM
    // =========================================

    const addRoomBtn =
        document.getElementById("showAddRoomBtn");

    if (addRoomBtn) {

        addRoomBtn.addEventListener("click", () => {

            document
                .getElementById("addRoomForm")
                .classList.remove("hidden");

            document
                .getElementById("showAddRoomBtn")
                .classList.add("hidden");
        });
    }

    // =========================================
    // CANCEL ADD ROOM
    // =========================================

    window.cancelAddRoom = function () {

        document
            .getElementById("addRoomForm")
            .classList.add("hidden");

        document
            .getElementById("showAddRoomBtn")
            .classList.remove("hidden");

        document
            .getElementById("roomInput")
            .value = "";
    };

    // =========================================
    // ADD ROOM
    // =========================================

    window.addRoom = function () {

        let input =
            document.getElementById("roomInput");

        let name =
            input.value.trim();

        if (!name) {

            alert("Enter room name");

            return;
        }

        let exists = rooms.some(room =>
            room.name.toLowerCase() ===
            name.toLowerCase()
        );

        if (exists) {

            alert("Room already exists");

            return;
        }

        rooms.push({

            id: Date.now().toString(),

            name: name
        });

        saveRooms();

        renderRooms();

        cancelAddRoom();
    };

    // =========================================
    // RENAME ROOM
    // =========================================

    window.renameRoom = function (id) {

        let room =
            rooms.find(room => room.id === id);

        if (!room) return;

        let newName =
            prompt("Rename room", room.name);

        if (!newName) return;

        newName = newName.trim();

        if (newName === "") return;

        room.name = newName;

        saveRooms();

        renderRooms();
    };

    // =========================================
// DELETE ROOM
// =========================================

window.deleteRoom = function (id) {

    // =========================================
    // REMOVE ROOM
    // =========================================

    rooms =
    rooms.filter(room => room.id !== id);

    // =========================================
    // SAVE UPDATED ROOMS
    // =========================================

    saveRooms();

    // =========================================
    // IF ALL ROOMS DELETED
    // SHOW EMPTY STATE
    // =========================================

    if (rooms.length === 0) {

        document
        .getElementById("roomList")
        .innerHTML = `

        <div class="empty-room-state">

            <div class="empty-icon">
                🏠
            </div>

            <div class="empty-title">
                No rooms added
            </div>

            <div class="empty-subtitle">
                Add a new room to continue
            </div>

        </div>
        `;

        document
        .getElementById("roomCount")
        .innerText =
        "0 rooms configured";

        return;
    }

    // =========================================
    // NORMAL RENDER
    // =========================================

    renderRooms();
};

    // =========================================
// ENABLE RENAME
// =========================================

window.enableRename = function (id) {

    // =========================================
    // FIND ROOM
    // =========================================

    let room =
    rooms.find(room => room.id === id);

    if (!room) return;

    // =========================================
    // GET ELEMENT
    // =========================================

    const span =
    document.getElementById(`room-name-${id}`);

    const oldName =
    room.name;

    // =========================================
    // REPLACE WITH INPUT
    // =========================================

    span.innerHTML = `

    <input
        type="text"
        id="rename-input-${id}"
        value="${oldName}"
        class="rename-input"
    >
    `;

    // =========================================
    // GET INPUT
    // =========================================

    const input =
    document.getElementById(`rename-input-${id}`);

    input.focus();

    input.select();

    // =========================================
    // PREVENT ROOM NAVIGATION
    // =========================================

    input.addEventListener("click", function(e){

        e.stopPropagation();
    });

    input.addEventListener("keydown", function(e){

        e.stopPropagation();
    });

    input.addEventListener("keyup", function(e){

        e.stopPropagation();
    });

    // =========================================
    // SAVE RENAME
    // =========================================

    function saveRename() {

        let newName =
        input.value.trim();

        // =====================================
        // EMPTY NAME -> RESTORE OLD
        // =====================================

        if (!newName) {

            newName = oldName;
        }

        // =====================================
        // DUPLICATE CHECK
        // =====================================

        let duplicate =
        rooms.some(r =>

            r.name.toLowerCase() ===
            newName.toLowerCase()

            &&

            r.id !== id
        );

        if (duplicate) {

            alert("Room already exists");

            input.focus();

            return;
        }

        // =====================================
        // SAVE
        // =====================================

        room.name = newName;

        saveRooms();

        renderRooms();
    }

    // =========================================
    // KEY EVENTS
    // =========================================

    input.addEventListener(
        "keydown",
        function (e) {

            // =================================
            // ENTER -> SAVE
            // =================================

            if (e.key === "Enter") {

                e.preventDefault();

                saveRename();
            }

            // =================================
            // ESC -> CANCEL
            // =================================

            if (e.key === "Escape") {

                e.preventDefault();

                renderRooms();
            }
        }
    );

    // =========================================
    // CLICK OUTSIDE -> SAVE
    // =========================================

    input.addEventListener(
        "blur",
        saveRename
    );
};
    // =========================================
    // GO TO ROOM
    // =========================================

    window.goToRoom = function (room_name) {

        localStorage.setItem(
            "selectedRoomLabel",
            room_name
        );

        const roomSlug =

            room_name
                .toLowerCase()
                .replaceAll(" ", "-");

        window.location.href =
            "/room?room=" +
            encodeURIComponent(roomSlug);
    };

    // =========================================
    // OUTSIDE CLICK
    // =========================================

    document
        .getElementById("modalOverlay")
        .addEventListener("click", function (e) {

            if (e.target === this) {

                closeModal();
            }
        });

    // =========================================
    // ESC CLOSE
    // =========================================

    document.addEventListener("keydown", function (e) {

        if (e.key === "Escape") {

            closeModal();
        }
    });

    // =========================================
    // BACK BUTTON
    // =========================================

    window.goBack = function () {

        window.location.href = "index.html";
    };

    // =========================================
    // GO TO DASHBOARD
    // =========================================

    window.goToDashboard = function () {

        document
            .getElementById("modalOverlay")
            .classList.add("hidden");
    };

};
