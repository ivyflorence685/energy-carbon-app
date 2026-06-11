window.onload = function () {

 

    const STORAGE_KEY = "ecotrack-rooms-v1";



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

const ROOM_CONFIG = {

    "living-room": {
        title: "Living Room",
        image: "/static/images/living.jpg",
        icon: "fa-couch",
        theme: "living-theme"
    },

    "kitchen": {
        title: "Kitchen",
        image: "/static/images/kitchen.jpg",
        icon: "fa-kitchen-set",
        theme: "kitchen-theme"
    },

    "bedroom": {
        title: "Bedroom",
        image: "/static/images/bedroom.jpg",
        icon: "fa-bed",
        theme: "bedroom-theme"
    },

    "bathroom": {
        title: "Bathroom",
        image: "/static/images/bathroom.jpg",
        icon: "fa-bath",
        theme: "bathroom-theme"
    },

    "study-room": {
        title: "Study Room",
        image: "/static/images/study.jpg",
        icon: "fa-book",
        theme: "study-theme"
    },

    "dining-room": {
        title: "Dining Room",
        image: "/static/images/dining.jpg",
        icon: "fa-utensils",
        theme: "dining-theme"
    }
};



    //global variables
    let fullData = [];

    let energyChart;
    let co2Chart;

    let currentPage = 1;

    const rowsPerPage = 10;

    let tableData = [];

    let currentCategory = "";

    let rooms = [];


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


    function normalizeDay(day) {

        return day.toLowerCase().replace("_", " ");
    }


    function filterByDay(data, selectedDay) {

        if (selectedDay === "all") return data;

        return data.filter(item =>
            normalizeDay(item.day) === normalizeDay(selectedDay)
        );
    }


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
                <td>${item.day.replace(/_/g, " ")}</td>
                <td>${item.Room.replace(/_/g, " ")}</td>
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

        prevButton.disabled = currentPage === 1;

        nextButton.disabled = currentPage === totalPages;
    }

//Smart alert system
function renderAlerts(filtered) {

    const alertBox =
        document.getElementById("alertsList");

    let alerts = [];


    const applianceRules = {

        "router": {
            maxHours: 24,
            highEnergy: 0.5,
            smartDevice: true
        },

        "refrigerator": {
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

        "geyser": {
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

    //generate alerts
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


        if (!rule.smartDevice && hours > rule.maxHours) {

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

        if (rule.highWattage && wattage >= 1500 && hours > 1) {

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

    if (alerts.length === 0) {

        alertBox.innerHTML =

            `
            <div class="alert success">
                <span>✅ No major energy concerns</span>
            </div>
            `;

        return;
    }


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

            div.className = "alert " + alert.type;

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
                 <button class="close-btn" title="Dismiss">
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


    showAlerts();


    setInterval(showAlerts, 10000);
}

    
    
// detailed analysis
function generateDetailedAnalysis(data) {


    let totalEnergy = 0;

    let totalCO2 = 0;

    let applianceEnergy = {};

    let roomEnergy = {};

    let applianceHours = {};

    let inefficientAppliances = [];

    let highCarbonAppliances = [];


    const applianceRules = {

        "router": {
            alwaysOn: true,
            efficientHours: 24,
            efficientEnergy: 0.5
        },

        "refrigerator": {
            cycling: true,
            efficientHours: 24,
            efficientEnergy: 2
        },

        "water filter": {
            cycling: true,
            efficientHours: 24,
            efficientEnergy: 0.4
        },

        "geyser": {
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


        applianceEnergy[appliance] = (applianceEnergy[appliance] || 0) + energy;


        roomEnergy[room] = (roomEnergy[room] || 0) + energy;


        applianceHours[appliance] = (applianceHours[appliance] || 0) + hours;


        let rule = applianceRules[appliance];

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


    let topAppliances = Object.entries(applianceEnergy).sort((a, b) => b[1] - a[1]).slice(0, 3);


    let highestRoom = Object.entries(roomEnergy).sort((a, b) => b[1] - a[1])[0];


    let mostUsed = Object.entries(applianceHours).sort((a, b) => b[1] - a[1])[0];


    document.getElementById("overallAnalysis").innerHTML =

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

    document.getElementById("concernAnalysis").innerHTML = concernText;


    const recommendations = [];


    if (applianceEnergy["AC"] > 0) {

        recommendations.push(
            "Maintain AC temperature between 24–26°C and clean filters regularly to reduce cooling energy consumption."
        );
    }


    if (applianceEnergy["geyser"] > 0) {

        recommendations.push(
            "Use geyser timers or thermostat optimization to minimize unnecessary water heating."
        );
    }


    if (applianceEnergy["refrigerator"] > 0) {

        recommendations.push(
            "Avoid frequent refrigerator door opening and ensure proper ventilation around the appliance."
        );
    }


    if (applianceEnergy["lights"] > 0) {

        recommendations.push(
            "Switch to LED lighting systems and use occupancy-based controls where possible."
        );
    }


    if (applianceEnergy["fan"] > 0) {

        recommendations.push(
            "BLDC ceiling fans can significantly reduce long-duration electricity consumption."
        );
    }


    recommendations.push(
        "Operate high-power appliances during off-peak hours when possible to improve energy efficiency."
    );


    const recommendationList = document.getElementById("recommendationList");

    recommendationList.innerHTML = "";

    recommendations.forEach(text => {

        let li =
            document.createElement("li");

        li.innerHTML = text;

        recommendationList.appendChild(li);
    });


    let reduction = (totalCO2 * 0.22).toFixed(2);

    let trees = Math.max(1, Math.round(reduction / 18));

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


    function updateView(selectedDay) {

        currentPage = 1;

        let filtered =
            filterByDay(fullData, selectedDay);

        renderCharts(filtered);

        renderTables(filtered);

        renderAlerts(filtered);
    }


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


    document
        .getElementById("prevBtn")
        .addEventListener("click", () => {

            if (currentPage > 1) {

                currentPage--;

                renderTables(tableData);
            }
        });


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


    fetch("/data")
        .then(res => res.json())

        .then(data => {

            fullData = data;

            populateDays(fullData);

            updateView("all");
            
            let filteredData = data;

            generateDetailedAnalysis(filteredData);



            document
                .getElementById("daySelector")
                .addEventListener("change", function () {

                    updateView(this.value);
                });
            
const totalEnergy = data.reduce((sum, item) => {
    return sum + Number(item["Energy Consumption in units"]);
}, 0);


const totalCarbon = data.reduce((sum, item) => {
    return sum + Number(item["CO2 emissions in kg"]);
}, 0);

const highestConsumption = Math.max(
    ...data.map(item =>
        Number(item["Energy Consumption in units"])
    )
);

const totalDevices = data.filter(item => item["day"] === "day_1").reduce((sum, item) => {
        return sum + Number(item["Total number of appliance"]);
    }, 0);


document.getElementById("totalEnergy").innerText = totalEnergy.toFixed(2);

document.getElementById("totalCO2").innerText = totalCarbon.toFixed(2);

document.getElementById("devices").innerText = totalDevices;

document.getElementById("peakUsage").innerText = highestConsumption;


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
    
        

    window.openRoomModal = function (category) {

        currentCategory = category;

        let config = ROOM_CONFIG[category];

        document.getElementById("categoryTitle").innerText = config.title;

        document.getElementById("modalImage").src = config.image;

        document.getElementById("modalIcon").innerHTML = `<i class="fas ${config.icon}"></i>`;

        document.getElementById("modalOverlay").classList.remove("hidden");

        loadRooms(category);
    };


    window.closeModal = function () { document.getElementById("modalOverlay").classList.add("hidden");};


    function loadRooms(category) {

        let stored = localStorage.getItem(STORAGE_KEY);

        let allRooms = stored ? JSON.parse(stored) : {};

        if (!allRooms[category] || allRooms[category].length === 0) {

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


    function saveRooms() {

        let stored = localStorage.getItem(STORAGE_KEY);

        let allRooms = stored ? JSON.parse(stored) : {};

        allRooms[currentCategory] = rooms;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(allRooms));
    }


    function renderRooms() {

    const roomList = document.getElementById("roomList");

    roomList.innerHTML = "";

    document.getElementById("roomCount").innerText = `${rooms.length} rooms configured`;

    rooms.forEach(room => {

        let div =
        document.createElement("div");

        div.className = "room-item";

        div.innerHTML = `

        <div class="room-left">

            <div class="room-name-container">

                <span
                    class="room-name"
                    id="room-name-${room.id}"
                    ondblclick="enableRename('${room.id}')"
                    onclick="goToRoom('${room.name}')">
                    ${room.name}
                </span>

            </div>

        </div>

        <div class="room-actions">

            <button
                class="rename-btn"
                onclick="enableRename('${room.id}')"
                title="Rename Room">
                ✏
            </button>

            <button
                class="delete-btn"
                onclick="deleteRoom('${room.id}')"
                title="Delete Room">
                🗑
            </button>

        </div>

        `;

        roomList.appendChild(div);
    });
}
   

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

        let input = document.getElementById("roomInput");

        let name = input.value.trim();

        if (!name) {

            alert("Enter room name");

            return;
        }

        let exists = rooms.some(room => room.name.toLowerCase() === name.toLowerCase());

        if (exists) {

            alert("Room already exists");

            return;
        }

        rooms.push({id: Date.now().toString(), name: name});

        saveRooms();

        renderRooms();

        cancelAddRoom();
    };


    window.renameRoom = function (id) {

        let room = rooms.find(room => room.id === id);

        if (!room) return;

        let newName = prompt("Rename room", room.name);

        if (!newName) return;

        newName = newName.trim();

        if (newName === "") return;

        room.name = newName;

        saveRooms();

        renderRooms();
    };


window.deleteRoom = function (id) {


    rooms = rooms.filter(room => room.id !== id);

    saveRooms();

    //if all rooms are deleted, show empty state
    if (rooms.length === 0) {

        document.getElementById("roomList").innerHTML = `

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

        document.getElementById("roomCount").innerText = "0 rooms configured";

        return;
    }


    renderRooms();
};


window.enableRename = function (id) {


    let room = rooms.find(room => room.id === id);

    if (!room) return;

    const span = document.getElementById(`room-name-${id}`);

    const oldName = room.name;

    span.innerHTML = `

    <input
        type="text"
        id="rename-input-${id}"
        value="${oldName}"
        class="rename-input">
    `;


    const input = document.getElementById(`rename-input-${id}`);

    input.focus();

    input.select();


    input.addEventListener("click", function(e){e.stopPropagation();});

    input.addEventListener("keydown", function(e){e.stopPropagation();});

    input.addEventListener("keyup", function(e){e.stopPropagation();});


    function saveRename() {

        let newName = input.value.trim();


        if (!newName) {

            newName = oldName;
        }


        let duplicate = rooms.some(r => r.name.toLowerCase() === newName.toLowerCase() && r.id !== id);

        if (duplicate) {

            alert("Room already exists");

            input.focus();

            return;
        }


        room.name = newName;

        saveRooms();

        renderRooms();
    }


    input.addEventListener(
        "keydown",
        function (e) {


            if (e.key === "Enter") {

                e.preventDefault();

                saveRename();
            }


            if (e.key === "Escape") {

                e.preventDefault();

                renderRooms();
            }
        }
    );


    input.addEventListener("blur", saveRename);
};

    window.goToRoom = function (room_name) {

        localStorage.setItem("selectedRoomLabel", room_name);

        const roomSlug = room_name.toLowerCase().replaceAll(" ", "-");

        window.location.href = "/room?room=" + encodeURIComponent(roomSlug);
    };


    document
        .getElementById("modalOverlay")
        .addEventListener("click", function (e) {

            if (e.target === this) {

                closeModal();
            }
        });


    document.addEventListener("keydown", function (e) {

        if (e.key === "Escape") {

            closeModal();
        }
    });


    window.goBack = function () {

        window.location.href = "index.html";
    };


    window.goToDashboard = function () {

        document
            .getElementById("modalOverlay")
            .classList.add("hidden");
    };

};
