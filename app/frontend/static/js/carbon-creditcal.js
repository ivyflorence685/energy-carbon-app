console.log("script.js loaded successfully");

const EMISSION_FACTOR = 0.82;
const NATIONAL_AVG = 120;

let fullData = [];
let roomChartInstance = null;
let efficiencyGauge = null;
let trendChart = null;


const slider =
document.getElementById("energySlider");

slider.addEventListener(
"input",
updateCalculator
);

function updateCalculator() {

    const kwh =
    Number(slider.value);

    const carbon =
    kwh * EMISSION_FACTOR;

    const baseline =
    100 * EMISSION_FACTOR;

    const difference =
    baseline - carbon;

    document.getElementById(
    "energyValue"
    ).innerText = kwh;

    document.getElementById(
    "savedCO2"
    ).innerText =
    difference.toFixed(1) + " kg";

    const credits =
    difference / 1000;

    document.getElementById(
    "credits"
    ).innerText =
    credits.toFixed(4);

    const value =
    credits * 2730;

    const valueElement =
    document.getElementById(
    "value"
    );

    if(value >= 0){

        valueElement.innerText =
        "₹" + Math.round(value);

        valueElement.style.color =
        "#22c55e";

    } else {

        valueElement.innerText =
        "-₹" +
        Math.abs(
        Math.round(value)
        );

        valueElement.style.color =
        "#ef4444";
    }

    const efficiency =
    Math.max(
        0,
        Math.min(
            100,
            (difference / baseline) * 100
        )
    );

    document.getElementById(
    "efficiencyPercent"
    ).innerText =
    Math.round(efficiency) + "%";

    renderEfficiencyGauge(
    efficiency
);

    const positiveDifference =
    Math.max(0, difference);

    document.getElementById(
    "trees"
    ).innerText =
    (positiveDifference / 21.7).toFixed(2);

    document.getElementById(
    "km"
    ).innerText =
    (positiveDifference / 0.21).toFixed(1)
    + " km";

    document.getElementById(
    "water"
    ).innerText =
    Math.round(
    positiveDifference * 2.2
    ) + " L";
}


updateCalculator();

// =====================================
// ROOM BREAKDOWN SECTION
// =====================================

// colors for rooms

const ROOM_COLORS = [

    "#18c08f",
    "#4c8cff",
    "#8b5cf6",
    "#f59e0b",
    "#ec4899",
    "#24c7c0",
    "#ef4444",
    "#14b8a6",
    "#eab308",
    "#6366f1",
    "#22c55e",
    "#f97316"

];


// =====================================
// COLLAPSE / EXPAND
// =====================================

window.toggleBreakdown = function () {

    const box =
        document.getElementById(
            "roomBreakdown"
        );

    const icon =
        document.getElementById(
            "collapseIcon"
        );

    if (box.style.display === "none") {

        box.style.display = "block";

        icon.innerHTML = "▲";

    }
    else {

        box.style.display = "none";

        icon.innerHTML = "▼";

    }
};


// =====================================
// GET ROOM TOTALS
// =====================================

function getRoomTotals(filteredData) {

    const roomMap = {};

    filteredData.forEach(item => {

        const room =
            item.Room;

        const co2 =
            parseFloat(
                item["CO2 emissions in kg"]
            ) || 0;

        roomMap[room] =
            (roomMap[room] || 0) + co2;

    });

    return roomMap;
}


// =====================================
// RENDER LEGEND
// =====================================

function renderRoomLegend(labels) {

    const legend =
        document.getElementById(
            "roomLegend"
        );

    legend.innerHTML = "";

    labels.forEach((room, index) => {

        const div =
            document.createElement("div");

        div.innerHTML = `

            <span
                class="dot"
                style="
                background:
                ${ROOM_COLORS[index % ROOM_COLORS.length]}
                ">
            </span>

            ${room}

        `;

        legend.appendChild(div);

    });

}


async function createTrendChart() {

    const ctx = document.getElementById("trendChart");

    if (!ctx) return;

    // Get data from Flask
    const response = await fetch("/data");
    const data = await response.json();

    // Group energy consumption by day
    const dailyConsumption = {};

    data.forEach(item => {

        const day = item.day;

        const consumption = parseFloat(
            item["Energy Consumption in units"]
        ) || 0;

        dailyConsumption[day] =
            (dailyConsumption[day] || 0) + consumption;
    });

    const labels = Object.keys(dailyConsumption).map(day =>
    day.replace("day_", "Day ")
);

    const values = Object.values(dailyConsumption);

    if (trendChart) {
        trendChart.destroy();
    }

    trendChart = new Chart(ctx, {

        type: "line",

        data: {
            labels: labels,

            datasets: [{
                label: "Power Consumption (KWh)",

                data: values,

                borderColor: "#3b82f6",

                backgroundColor:
                    "rgba(59,130,246,0.15)",

                fill: true,

                tension: 0.4
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}


// =====================================
// RENDER CHART
// =====================================

function renderRoomChart(filteredData) {

    const roomMap =
        getRoomTotals(filteredData);

    const labels =
        Object.keys(roomMap)
        .map(room =>
            room.replaceAll("_", " ")
        );

    const values =
        Object.values(roomMap)
        .map(value =>
            Number(value.toFixed(2))
        );

    const ctx =
        document.getElementById(
            "roomChart"
        );

    if (roomChartInstance) {

        roomChartInstance.destroy();

    }

    roomChartInstance =
        new Chart(ctx, {

            type: "bar",

            data: {

                labels: labels,

                datasets: [{

                    label: "CO₂ Emitted",

                    data: values,

                    backgroundColor:
                        ROOM_COLORS,

                    borderRadius: 6

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return (
                                    context.raw +
                                    " kg CO₂"
                                );

                            }

                        }

                    }

                },

                scales: {

                    x: {

                        ticks: {

                            color: "#93a8c4"

                        },

                        grid: {

                            color: "#162845"

                        }

                    },

                    y: {

                        beginAtZero: true,

                        ticks: {

                            color: "#93a8c4"

                        },

                        grid: {

                            color: "#162845"

                        }

                    }

                }

            }

        });

    renderRoomLegend(labels);

}


// =====================================
// DAY FILTER SUPPORT
// =====================================

function updateRoomChartByDay(selectedDay) {

    let filteredData;

    if(selectedDay === "all") {

        filteredData = fullData;

    } else {

        filteredData =
        fullData.filter(
            item =>
            item.day === selectedDay
        );

    }

    renderRoomChart(filteredData);

}

// =====================================
// INITIAL LOAD
// =====================================



// =====================================
// OPTIONAL DAY DROPDOWN
// =====================================

const dayFilter =
document.getElementById(
    "dayFilter"
);

if(dayFilter){

    dayFilter.addEventListener(
        "change",
        function(){

            updateRoomChartByDay(
                this.value
            );

        }
    );

}

fetch("/data")
.then(res => res.json())
.then(data => {

    fullData = data;

    renderRoomChart(
        fullData
    );

    createTrendChart();

    updateCalculator();

})
.catch(error => {

    console.error(
        "Error loading data:",
        error
    );

});

function renderEfficiencyGauge(
    percent
){

    let color;

    if(percent > 50){

        color = "#10b981";

    }else if(percent > 20){

        color = "#f59e0b";

    }else{

        color = "#ef4444";
    }

    document.getElementById(
        "efficiencyPercent"
    ).innerText =
    Math.round(percent) + "%";

    const msg =
    document.getElementById(
        "efficiencyMessage"
    );

    if(percent >= 50){

        msg.innerText =
        "🌿 Excellent reduction!";

    }else if(percent > 0){

        msg.innerText =
        "⚡ Good — keep going!";

    }else{

        msg.innerText =
        "⚠️ Try to cut back usage";
    }

    if(efficiencyGauge){

        efficiencyGauge.destroy();
    }

    efficiencyGauge =
    new Chart(
    document.getElementById(
        "efficiencyGauge"
    ),
    {

        type:"doughnut",

        data:{

            datasets:[{

                data:[
                    percent,
                    100 - percent
                ],

                backgroundColor:[
                    color,
                    "#1e293b"
                ],

                borderWidth:0

            }]
        },

        options:{

            responsive:true,

            cutout:"75%",

            rotation:225,

            circumference:270,

            plugins:{
                legend:{
                    display:false
                },
                tooltip:{
                    enabled:false
                }
            }
        }
    });
}
