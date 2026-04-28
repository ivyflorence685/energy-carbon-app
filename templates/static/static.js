async function loadData() {
    try {
        const response = await fetch('/data');
        const data = await response.json();

        const homeLabels = [];
        const homeValues = [];
        const adminLabels = [];
        const adminValues = [];

        // Split data into home vs admin
        data.labels.forEach((label, index) => {
            if (label.toLowerCase().includes("admin")) {
                adminLabels.push(label);
                adminValues.push(data.values[index]);
            } else {
                homeLabels.push(label);
                homeValues.push(data.values[index]);
            }
        });

        // Household Chart
        new Chart(document.getElementById('homeChart'), {
            type: 'bar',
            data: {
                labels: homeLabels,
                datasets: [{
                    label: 'Household Appliances',
                    data: homeValues
                }]
            }
        });

        // Admin Chart
        new Chart(document.getElementById('adminChart'), {
            type: 'bar',
            data: {
                labels: adminLabels,
                datasets: [{
                    label: 'Administrative Appliances',
                    data: adminValues
                }]
            }
        });

        // Alerts
        const alertsList = document.getElementById('alertsList');
        alertsList.innerHTML = '';

        if (!data.alerts || data.alerts.length === 0) {
            alertsList.innerHTML = '<li>No alerts</li>';
        } else {
            data.alerts.forEach(alert => {
                const li = document.createElement('li');
                li.textContent = alert;
                alertsList.appendChild(li);
            });
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

window.onload = loadData;