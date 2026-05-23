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
// SMART ALERT SYSTEM
// SHORT + DYNAMIC ALERTS
// =========================================

function renderAlerts(filtered) {

    const alertBox =
        document.getElementById("alertsList");

    let alerts = [];

    // =====================================
    // APPLIANCE RULES
    // =====================================

    const applianceRules = {

        "router": {
            maxHours: 24,
            highEnergy: 0.5,
            smartDevice: true
        },

        "refrigirator": {
            maxHours: 24,
            highEnergy: 2,
            smartDevice: true,
            cyclingDevice: true
        },

        "water filter": {
            maxHours: 24,
            highEnergy: 0.4,
            smartDevice: true,
            cyclingDevice: true
        },

        "gyser": {
            maxHours: 1,
            highEnergy: 2,
            thermostatDevice: true,
            highWattage: true
        },

        "AC": {
            maxHours: 8,
            highEnergy: 8,
            highWattage: true
        },

        "lights": {
            maxHours: 8,
            highEnergy: 0.5
        },

        "fan": {
            maxHours: 12,
            highEnergy: 0.6
        },

        "TV": {
            maxHours: 6,
            highEnergy: 1
        },

        "computer": {
            maxHours: 8,
            highEnergy: 1.5
        }
    };

    // =====================================
    // GENERATE ALERTS
    // =====================================

    filtered.forEach(item => {

        let room =
            item["Room"];

        let appliance =
            item["Appliance"];

        let energy =
            Number(item["Energy Consumption in units"]);

        let hours =
            Number(item["Utilization Hours"]);

        let wattage =
            Number(item["Wattage"]);

        let co2 =
            Number(item["CO2 emissions in kg"]);

        let rule =
            applianceRules[appliance];

        if (!rule) return;

        // ---------------------------------
        // HIGH ENERGY
        // ---------------------------------

        if (energy > rule.highEnergy) {

            alerts.push({
                type: "danger",
                icon: "⚡",
                text:
                    appliance +
                    " in " +
                    room +
                    " using high energy"
            });
        }

        // ---------------------------------
        // OVER USE
        // ---------------------------------

        if (
            !rule.smartDevice &&
            hours > rule.maxHours
        ) {

            alerts.push({
                type: "warning",
                icon: "⏳",
                text:
                    appliance +
                    " in " +
                    room +
                    " exceeded usage limit"
            });
        }

        // ---------------------------------
        // HIGH WATTAGE
        // ---------------------------------

        if (
            rule.highWattage &&
            wattage >= 1500 &&
            hours > 1
        ) {

            alerts.push({
                type: "warning",
                icon: "🔥",
                text:
                    appliance +
                    " in " +
                    room +
                    " running for long hours"
            });
        }

        // ---------------------------------
        // HIGH CO2
        // ---------------------------------

        if (co2 >= 1) {

            alerts.push({
                type: "info",
                icon: "🌍",
                text:
                    room +
                    " carbon emission increased"
            });
        }

    });

    // =====================================
    // NO ALERTS
    // =====================================

    if (alerts.length === 0) {

        alertBox.innerHTML =

            `
            <div class="alert success">
                <span>✅ No major energy concerns</span>
            </div>
            `;

        return;
    }

    // =====================================
    // ALERT LOOP SYSTEM
    // =====================================

    let currentIndex = 0;

    function showAlerts() {

        alertBox.innerHTML = "";

        // show only 3 alerts at once

        for (let i = 0; i < 3; i++) {

            let index =
                (currentIndex + i) % alerts.length;

            let alert =
                alerts[index];

            let div =
                document.createElement("div");

            div.className =
                "alert " + alert.type;

            div.innerHTML =

                `
                <div class="alert-left">

                    <span class="alert-icon">
                        ${alert.icon}
                    </span>

                    <div>
                        <div class="alert-text">
                            ${alert.text}
                        </div>

                        <div class="alert-time">
                            just now
                        </div>
                    </div>

                </div>

                <button class="close-btn">
                    ×
                </button>
                `;

            // CLOSE BUTTON

            div
            .querySelector(".close-btn")
            .addEventListener("click", () => {

                div.remove();

            });

            alertBox.appendChild(div);
        }

        currentIndex++;

    }

    // INITIAL LOAD

    showAlerts();

    // LOOP ALERTS EVERY 5 SECONDS

    setInterval(showAlerts, 5000);
}

    
    
// =========================================
// GENERATE SMART DETAILED ANALYSIS
// Appliance Aware Analysis System
// =========================================

function generateDetailedAnalysis(data) {

    // =====================================
    // TOTALS
    // =====================================

    let totalEnergy = 0;

    let totalCO2 = 0;

    let applianceEnergy = {};

    let roomEnergy = {};

    let applianceHours = {};

    let inefficientAppliances = [];

    let highCarbonAppliances = [];

    // =====================================
    // SMART APPLIANCE RULES
    // =====================================

    const applianceRules = {

        "router": {
            alwaysOn: true,
            efficientHours: 24,
            efficientEnergy: 0.5
        },

        "refrigirator": {
            cycling: true,
            efficientHours: 24,
            efficientEnergy: 2
        },

        "water filter": {
            cycling: true,
            efficientHours: 24,
            efficientEnergy: 0.4
        },

        "gyser": {
            thermostat: true,
            efficientHours: 1,
            efficientEnergy: 2
        },

        "AC": {
            efficientHours: 8,
            efficientEnergy: 8
        },

        "fan": {
            efficientHours: 12,
            efficientEnergy: 0.6
        },

        "lights": {
            efficientHours: 8,
            efficientEnergy: 0.5
        },

        "night lights": {
            efficientHours: 12,
            efficientEnergy: 0.2
        },

        "TV": {
            efficientHours: 6,
            efficientEnergy: 1
        },

        "washing machince": {
            efficientHours: 2,
            efficientEnergy: 1
        }
    };

    // =====================================
    // PROCESS DATA
    // =====================================

    data.forEach(item => {

        let energy =
            Number(item["Energy Consumption in units"]);

        let co2 =
            Number(item["CO2 emissions in kg"]);

        let appliance =
            item["Appliance"];

        let room =
            item["Room"];

        let hours =
            Number(item["Utilization Hours"]);

        let wattage =
            Number(item["Wattage"]);

        totalEnergy += energy;

        totalCO2 += co2;

        // ---------------------------------
        // APPLIANCE ENERGY
        // ---------------------------------

        applianceEnergy[appliance] =
            (applianceEnergy[appliance] || 0)
            + energy;

        // ---------------------------------
        // ROOM ENERGY
        // ---------------------------------

        roomEnergy[room] =
            (roomEnergy[room] || 0)
            + energy;

        // ---------------------------------
        // APPLIANCE HOURS
        // ---------------------------------

        applianceHours[appliance] =
            (applianceHours[appliance] || 0)
            + hours;

        // =================================
        // SMART EFFICIENCY CHECK
        // =================================

        let rule =
            applianceRules[appliance];

        if (rule) {

            // Skip smart always-on appliances

            if (!rule.alwaysOn) {

                if (
                    hours > rule.efficientHours ||
                    energy > rule.efficientEnergy
                ) {

                    inefficientAppliances.push(
                        appliance
                    );
                }
            }

            // High Carbon Emitters

            if (co2 >= 0.8) {

                highCarbonAppliances.push(
                    appliance
                );
            }
        }

    });

    // =====================================
    // TOP APPLIANCES
    // =====================================

    let topAppliances =
        Object.entries(applianceEnergy)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    // =====================================
    // HIGHEST ROOM
    // =====================================

    let highestRoom =
        Object.entries(roomEnergy)
        .sort((a, b) => b[1] - a[1])[0];

    // =====================================
    // MOST USED APPLIANCE
    // =====================================

    let mostUsed =
        Object.entries(applianceHours)
        .sort((a, b) => b[1] - a[1])[0];

    // =====================================
    // OVERALL ANALYSIS
    // =====================================

    document.getElementById("overallAnalysis")
    .innerHTML =

        `
        Your household consumed
        <strong>${totalEnergy.toFixed(2)} kWh</strong>
        of electricity and generated
        <strong>${totalCO2.toFixed(2)} kg</strong>
        of CO₂ emissions.

        The
        <strong>${highestRoom[0]}</strong>
        recorded the highest energy consumption
        at
        <strong>${highestRoom[1].toFixed(2)} kWh</strong>.

        The most actively used appliance was
        <strong>${mostUsed[0]}</strong>
        with approximately
        <strong>${mostUsed[1].toFixed(1)} hours</strong>
        of utilization.
        `;

    // =====================================
    // HIGH IMPACT APPLIANCES
    // =====================================

    document.getElementById("highImpactAnalysis")
    .innerHTML =

        `
        The top energy consuming appliances are:
        <strong>
            ${topAppliances.map(a =>
                `${a[0]} (${a[1].toFixed(2)} kWh)`
            ).join(", ")}
        </strong>.

        These appliances contribute significantly
        to overall household energy demand and
        should be prioritized for optimization.
        `;

    // =====================================
    // AREAS OF CONCERN
    // =====================================

    let concernText = "";

    if (inefficientAppliances.length > 0) {

        concernText +=

            `
            The following appliances showed
            higher-than-recommended energy
            behavior:
            <strong>
                ${[...new Set(inefficientAppliances)].join(", ")}
            </strong>.
            `;
    }

    if (highCarbonAppliances.length > 0) {

        concernText +=

            `
            Appliances generating relatively high
            carbon emissions include:
            <strong>
                ${[...new Set(highCarbonAppliances)].join(", ")}
            </strong>.
            `;
    }

    // Smart appliance explanation

    concernText +=

        `
        Devices such as refrigerators,
        routers, geysers, and water filters
        were analyzed using smart appliance
        rules since they may operate in
        standby, cyclic, or thermostat-
        controlled modes rather than drawing
        continuous full power.
        `;

    document.getElementById("concernAnalysis")
    .innerHTML = concernText;

    // =====================================
    // SMART RECOMMENDATIONS
    // =====================================

    const recommendations = [];

    // -------------------------------------
    // AC Recommendation
    // -------------------------------------

    if (applianceEnergy["AC"] > 0) {

        recommendations.push(
            "Maintain AC temperature between 24–26°C and clean filters regularly to reduce cooling energy consumption."
        );
    }

    // -------------------------------------
    // Geyser Recommendation
    // -------------------------------------

    if (applianceEnergy["gyser"] > 0) {

        recommendations.push(
            "Use geyser timers or thermostat optimization to minimize unnecessary water heating."
        );
    }

    // -------------------------------------
    // Refrigerator Recommendation
    // -------------------------------------

    if (applianceEnergy["refrigirator"] > 0) {

        recommendations.push(
            "Avoid frequent refrigerator door opening and ensure proper ventilation around the appliance."
        );
    }

    // -------------------------------------
    // Lighting Recommendation
    // -------------------------------------

    if (applianceEnergy["lights"] > 0) {

        recommendations.push(
            "Switch to LED lighting systems and use occupancy-based controls where possible."
        );
    }

    // -------------------------------------
    // Fan Recommendation
    // -------------------------------------

    if (applianceEnergy["fan"] > 0) {

        recommendations.push(
            "BLDC ceiling fans can significantly reduce long-duration electricity consumption."
        );
    }

    // -------------------------------------
    // Peak Hour Recommendation
    // -------------------------------------

    recommendations.push(
        "Operate high-power appliances during off-peak hours when possible to improve energy efficiency."
    );

    // =====================================
    // RENDER RECOMMENDATIONS
    // =====================================

    const recommendationList =
        document.getElementById("recommendationList");

    recommendationList.innerHTML = "";

    recommendations.forEach(text => {

        let li =
            document.createElement("li");

        li.innerHTML = text;

        recommendationList.appendChild(li);
    });

    // =====================================
    // ENVIRONMENTAL IMPACT
    // =====================================

    let reduction =
        (totalCO2 * 0.22).toFixed(2);

    let trees =
        Math.max(
            1,
            Math.round(reduction / 18)
        );

    document.getElementById("impactText")
    .innerHTML =

        `
        By implementing these smart optimization
        recommendations, your household could
        potentially reduce carbon emissions by
        approximately
        <strong>${reduction} kg CO₂</strong>.

        This environmental benefit is roughly
        equivalent to the annual carbon absorption
        capacity of
        <strong>${trees} tree(s)</strong>.
        `;
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
            
            let filteredData = data;

            generateDetailedAnalysis(filteredData);


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
