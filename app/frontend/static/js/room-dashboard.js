// =========================================
// ROOM FROM URL
// =========================================

const params =
new URLSearchParams(window.location.search);

const room =
params.get("room");

console.log(room);


// =========================================
// ROOM DISPLAY NAMES
// =========================================

const roomDisplayNames = {

    "living-room": "Living Room",

    "kitchen": "Kitchen",

    "bedroom": "Bedroom",

    "bathroom": "Bathroom",

    "study-room": "Study Room",

    "dining-room": "Dining Room"
};


// =========================================
// DISPLAY NAME
// =========================================

// Try localStorage label first

const selectedRoomLabel =
localStorage.getItem("selectedRoomLabel");


// Use:
// 1. stored label
// 2. mapped display name
// 3. fallback raw room

const displayName =

    selectedRoomLabel ||

    roomDisplayNames[room] ||

    room;


// =========================================
// SET TITLE
// =========================================

document
.getElementById("roomTitle")
.innerText =

displayName + " Analysis";

    // ======================================
    // BACK BUTTON
    // ======================================

    function goBack(){

      window.location.href = "/";
    }

    // ======================================
    // LOAD SMART METER DATA
    // ======================================

    async function loadMeterData(){

      const response =
      await fetch("/meter-data");

      const data =
      await response.json();

      document.getElementById("power")
      .innerText =
      data.power_watts + " W";

      document.getElementById("voltage")
      .innerText =
      data.voltage + " V";

      document.getElementById("current")
      .innerText =
      data.current + " A";

      document.getElementById("pf")
      .innerText =
      data.power_factor;

      document.getElementById("energy")
      .innerText =
      data.daily_energy_kwh + " kWh";

      document.getElementById("carbon")
      .innerText =
      data.carbon_kg + " kg";
    }

    loadMeterData();

    setInterval(loadMeterData, 3000);
  
    
   // ======================================
    // LINE CHART
    // ======================================
    

    // ======================================
    // BAR CHART
    // ======================================

    new Chart(
      document.getElementById("barChart"),
    {
      type:"bar",

      data:{

        labels:[
          "AC",
          "TV",
          "Fan",
          "Light"
        ],

        datasets:[
          {
            label:"Consumption",

            data:[
              165,
              20,
              15,
              10
            ]
          }
        ]
      }
    });