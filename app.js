const input = document.getElementById("cityInput");
let chartInstance = null;
const viewMoreBtn = document.getElementById("viewMoreBtn");
const toggleBtn = document.getElementById("themeToggleBtn");
const getBody = document.body;
input.addEventListener("input", () => {
    resetUIState();
});

// Fetch Weather Data
async function getWeaterData() {
    resetUIState();
    const city = document.getElementById("cityInput").value.trim();

    const loader = document.getElementById("loader");
    const card = document.getElementById("weatherCard");
    const result = document.getElementById("result");
    const viewMoreBtn = document.getElementById("viewMoreBtn");

    // Always hide button initially
    viewMoreBtn.classList.add("d-none");

    // Empty input → reset UI
    if (!city) {
        card.classList.add("d-none");
        result.innerHTML = "";
        return;
    }

    try {
        // Show loader, hide card
        loader.classList.remove("d-none");
        loader.classList.remove("hide");
        card.classList.add("d-none");

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=0fbbd3c537035d940f1826cd323e1dd8&units=metric`
        );

        const data = await response.json();
        console.log(data);
        const weatherMain = data.weather[0].main;
        const iconCode = data.weather[0].icon;

        // City not found
        if (data.cod != 200) {
            loader.classList.add("hide");

            setTimeout(() => {
                loader.classList.add("d-none");
                result.innerText = "❌ City not found";
                card.classList.remove("d-none");
                card.classList.add("show");

                // keep button hidden
                viewMoreBtn.classList.add("d-none");
            }, 300);

            return;
        }

        // Time calculations
        const utcTime = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
        const cityTime = new Date(utcTime + (data.timezone * 1000));
        const formattedTime = cityTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
        });

       const sunriseUTC = data.sys.sunrise * 1000;
        // Convert UTC → city time manually
        const sunriseLocal = new Date(sunriseUTC + data.timezone * 1000);

        // Format WITHOUT system interference
        const hours = sunriseLocal.getUTCHours();
        const minutes = sunriseLocal.getUTCMinutes();

        const formattedHours = hours % 12 || 12;
        const ampm = hours >= 12 ? "PM" : "AM";

        const sunriseFormatted = `${String(formattedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
        // UI Update
        result.innerHTML = `
          <h4>${data.name}, ${data.sys.country}</h4>

          <img 
            src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" 
            alt="Weather Icon"
          />

          <div class="data-card">
            <p><strong>Temperature:</strong> ${data.main.temp}°C</p>
            <p><strong>Sunrise:</strong> ${sunriseFormatted}</p>
            <p><strong>Current Time:</strong> ${formattedTime}</p>
          </div>
        `;

        //  Smooth transition
        loader.classList.add("hide");

        setTimeout(() => {
            loader.classList.add("d-none");

            card.classList.remove("d-none");
            card.classList.add("show");

            //  SHOW BUTTON ONLY AFTER CARD IS VISIBLE
            setTimeout(() => {
                viewMoreBtn.classList.remove("d-none");
            }, 100);

        }, 300);

    } catch (error) {
        console.error(error);

        loader.classList.add("hide");

        setTimeout(() => {
            loader.classList.add("d-none");
            result.innerText = "⚠️ Error fetching data";
            card.classList.remove("d-none");
            card.classList.add("show");

            // Do NOT show button on error
            viewMoreBtn.classList.add("d-none");

        }, 300);
    }
}

// Button Click
const getWeatherBtn = document.getElementById("getWeatherBtn");
getWeatherBtn.addEventListener("click", getWeaterData);

// Clear UI when input is empty
if (!input.value.trim()) {
        resetUIState();
    } else {
        resetUIState();
    }

// Load saved theme
window.onload = () => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        getBody.classList.add("dark");
        document.getElementById("themeToggleBtn").checked = true;
    }
};

// Toggle theme
toggleBtn.addEventListener("change", () => {
    getBody.classList.toggle("dark");
    localStorage.setItem("theme",getBody.classList.contains("dark") ? "dark" : "light");
    document.getElementById("viewMoreBtn").innerText = "View More";
});


// Forecast API
async function loadForecast(city) {
    const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=0fbbd3c537035d940f1826cd323e1dd8&units=metric`
    );

    const data = await res.json();

    const labels = [];
    const temps = [];

    data.list.slice(0, 8).forEach(item => {
        const time = new Date(item.dt * 1000).toLocaleTimeString("en-US", {
            hour: "numeric",
            hour12: true
        });

        labels.push(time);
        temps.push(Math.round(item.main.temp));
    });

    createChart(labels, temps);
}

// Chart
function createChart(labels, temps) {
    const ctx = document.getElementById("weatherChart").getContext("2d");
    // Destroy previous chart
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Temperature (°C)", // add label
                data: temps,
                borderColor: "#4facfe",
                backgroundColor: (ctx) => {
                    const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 250);
                    gradient.addColorStop(0, "rgba(79, 172, 254, 0.5)");
                    gradient.addColorStop(1, "rgba(79, 172, 254, 0)");
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: "#4facfe"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 🔥 IMPORTANT

            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: "#ccc"
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "#ccc"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                },
                y: {
                    ticks: {
                        color: "#ccc"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                }
            }
        }
    });
}

// View More Toggle
viewMoreBtn.addEventListener("click", async () => {
    const section = document.getElementById("detailsSection");

    if (section.classList.contains("d-none")) {
        section.classList.remove("d-none");

        const city = document.getElementById("cityInput").value.trim();
        await loadForecast(city);

        viewMoreBtn.innerText = "Hide Details";
    } else {
        section.classList.add("d-none");

        // destroy chart when hiding
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        viewMoreBtn.innerText = "View More";
    }
});

function resetUIState() {
    const card = document.getElementById("weatherCard");
    const result = document.getElementById("result");
    const viewMoreBtn = document.getElementById("viewMoreBtn");
    const detailsSection = document.getElementById("detailsSection");
    // Hide card + clear data
    card.classList.add("d-none");
    result.innerHTML = "";

    // Hide graph section
    detailsSection.classList.add("d-none");

    // Reset button
    viewMoreBtn.classList.add("d-none");
    viewMoreBtn.innerText = "View More";

    // Destroy chart
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}
