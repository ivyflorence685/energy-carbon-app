// get room from URL
const params = new URLSearchParams(window.location.search);

const roomParam = params.get("room");

// Room Name Mapping for Internal Use
const roomMap = {

    "living-room": "Living room",

    "kitchen": "Kitchen",

    "bedroom-1": "Bedroom-1",

    "bedroom-2": "Bedroom-2",

    "bathroom-1": "Bathroom-1",

    "bathroom-2": "Bathroom-2",

    "study-room": "Computer room",

    "dining-room": "Dining room"
};

// display title mapping 
const displayMap = {

    "living-room": "Living Room",

    "kitchen": "Kitchen",

    "bedroom-1": "Bedroom 1",

    "bedroom-2": "Bedroom 2",

    "bathroom-1": "Bathroom 1",

    "bathroom-2": "Bathroom 2",

    "study-room": "Study Room",

    "dining-room": "Dining Room"
};


//current room 
const roomName =
    roomMap[roomParam] || "Living room";

const displayName =
    displayMap[roomParam] || "Living Room";


//update title
document.getElementById("roomTitle").innerText =
    displayName + " Analysis";

let lineChart;
let barChart;

fetch("/data")

.then(res => res.json())

.then(fullData => {


function normalizeRoom(room) {

    return room
        .toLowerCase()
        .replace(/-/g, "")
        .replace(/_/g, "")
        .replace(/\s+/g, "")
        .trim();
}

//filter room data
const data = fullData.filter(item => normalizeRoom(item.Room) === normalizeRoom(roomName));

    const totalEnergy = data.reduce((sum, item) => sum + parseFloat(item["Energy Consumption in units"] || 0), 0);

    const totalCarbon = data.reduce((sum, item) => sum + parseFloat(item["CO2 emissions in kg"] || 0), 0);

    const avgDailyEnergy = totalEnergy / 7;

    const peakUsage = Math.max(...data.map(item => parseFloat(item["Energy Consumption in units"] || 0)));

    
    //update stats
    document.getElementById("totalEnergy").innerText = totalEnergy.toFixed(2) + " kWh";

    document.getElementById("totalCarbon").innerText = totalCarbon.toFixed(2) + " kg";

    document.getElementById("dailyAverage").innerText = avgDailyEnergy.toFixed(2) + " kWh";

    document.getElementById("peakUsage").innerText = peakUsage.toFixed(2) + " kWh";

    
    //daily data
    const dailyMap = {};

    data.forEach(item => {

        const day = item.day.replace(/_/g, " ");

        const energy = parseFloat(item["Energy Consumption in units"] || 0);

        const carbon = parseFloat(item["CO2 emissions in kg"] || 0);

        if (!dailyMap[day]) {

            dailyMap[day] = {energy: 0, carbon: 0};
        }

        dailyMap[day].energy += energy;

        dailyMap[day].carbon += carbon;
    });

    const labels = Object.keys(dailyMap);

    const energyData = labels.map(day => dailyMap[day].energy.toFixed(2));

    const carbonData = labels.map(day => dailyMap[day].carbon.toFixed(2));

    
    //line chart
    if (lineChart) {
        lineChart.destroy();
    }

    lineChart = new Chart(

        document.getElementById("lineChart"),

        {
            type: "line",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: "Energy (kWh)",
                        data: energyData,
                        borderColor: "#2563eb",
                        fill: false,
                        tension: 0.4
                    },

                    {
                        label: "CO₂ (kg)",
                        data: carbonData,
                        borderColor: "#10b981",
                        fill: false,
                        tension: 0.4
                    }
                ]
            }
        }
    );

  
    //appliance data
    const applianceMap = {};

    data.forEach(item => {

        const appliance = item.Appliance;

        const energy = parseFloat(item["Energy Consumption in units"] || 0);

        if (!applianceMap[appliance]) {
            applianceMap[appliance] = 0;
        }

        applianceMap[appliance] += energy;
    });

    const applianceLabels = Object.keys(applianceMap);

    const applianceEnergy = applianceLabels.map(appliance => applianceMap[appliance]);

    
    //bar chart
    if (barChart) {
        barChart.destroy();
    }

    barChart = new Chart(

        document.getElementById("barChart"),

        {
            type: "bar",

            data: {

                labels: applianceLabels,

                datasets: [

                    {
                        label: "Energy Consumption",
                        data: applianceEnergy,
                        backgroundColor: "#10b981"
                    }
                ]
            }
        }
    );


    const topAppliance = applianceLabels[
        applianceEnergy.indexOf(
            Math.max(...applianceEnergy)
        )
    ];

   
    //insight 
    document.getElementById("insightText").innerHTML = `

        The <b>${displayName}</b> consumed
        <b>${totalEnergy.toFixed(2)} kWh</b>
        this week generating
        <b>${totalCarbon.toFixed(2)} kg CO₂</b>.
        <br><br>

        Top energy consumer:
        <b>${topAppliance}</b>

        <br><br>

        Consider reducing appliance usage
        during peak hours for better
        energy optimization.
    `;

    

    let tableHTML = "";

    data.forEach(item => {

        tableHTML += `

            <tr>

                <td>${item.day.replace("_", " ")}</td>

                <td>${item.date}</td>

                <td>${item.Appliance}</td>

                <td>${item["Total number of appliance"]}</td>

                <td>${item["Number of appliance in use"]}</td>

                <td>${item.Wattage} W</td>

                <td>${item["Utilization Hours"]}</td>

                <td>${Number(item["Energy Consumption in units"]).toFixed(2)}</td>

                <td>${Number(item["CO2 emissions in kg"]).toFixed(2)}</td>

            </tr>
        `;
    });

    document.getElementById("tableBody").innerHTML =
        tableHTML;
});



function updateSmartMeter() {


    const power = Math.floor(Math.random() * 400) + 300;


    const voltage = (220 + Math.random() * 5).toFixed(1);


    const current = (power / voltage).toFixed(2);

   
    const powerFactor = (0.80 + Math.random() * 0.19).toFixed(2);


    const energy = (Math.random() * 8).toFixed(2);


    const co2 = (energy * 0.82).toFixed(2);


    const percentage = ((power / 700) * 100).toFixed(1);

    
    //update smart meter values
    document.getElementById("powerDraw").innerText = power;

    document.getElementById("voltage").innerText = voltage;

    document.getElementById("current").innerText = current;

    document.getElementById("powerFactor").innerText = powerFactor;

    document.getElementById("todayEnergy").innerText = energy + " kWh";

    document.getElementById("todayCO2").innerText = co2 + " kg";

    document.getElementById("capacityText").innerText = percentage + "% of maximum capacity";

    document.getElementById("progressFill").style.width = percentage + "%";

    document.getElementById("lastUpdate").innerText = new Date().toLocaleTimeString();
}


// Initial call
updateSmartMeter();

setInterval(updateSmartMeter, 2000);

function goBack() {
    window.history.back();
}