document.addEventListener('DOMContentLoaded', function() {
    
    // --- Countdown Timer ---
    const eventDate = new Date("Aug 23, 2025 09:00:00").getTime();

    const countdownInterval = setInterval(function() {
        const now = new Date().getTime();
        const distance = eventDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("countdown").innerHTML = `<span>${days}d ${hours}h ${minutes}m ${seconds}s</span>`;

        if (distance < 0) {
            clearInterval(countdownInterval);
            document.getElementById("countdown").innerHTML = "<span>EVENT STARTED</span>";
        }
    }, 1000);

    // --- Live Registration Counter ---
    const counterElement = document.querySelector("#registration-counter span");
    async function updateRegistrationCount() {
        try {
            const response = await fetch('/registrations/count');
            const data = await response.json();
            counterElement.textContent = `[ ${data.count} ] Students Already Registered!`;
        } catch (error) {
            console.error('Failed to fetch registration count:', error);
        }
    }
    // Fetch count immediately and then every 10 seconds
    updateRegistrationCount(); 
    setInterval(updateRegistrationCount, 10000);

    // --- Server Uptime ---
    const uptimeElement = document.getElementById("server-uptime");
    async function updateServerUptime() {
        try {
            const response = await fetch('/status/uptime');
            const data = await response.json();
            const uptimeInSeconds = data.uptime;
            
            const days = Math.floor(uptimeInSeconds / (60 * 60 * 24));
            const hours = Math.floor((uptimeInSeconds % (60 * 60 * 24)) / (60 * 60));
            const minutes = Math.floor((uptimeInSeconds % (60 * 60)) / 60);
            const seconds = Math.floor(uptimeInSeconds % 60);

            uptimeElement.textContent = `Server Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s`;
        } catch (error) {
            // Do nothing, just fail silently
        }
    }
    setInterval(updateServerUptime, 1000);

    // --- Registration Form Handling ---
    const form = document.getElementById('registration-form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '[ Submitting... ]';

        try {
            const response = await fetch('/register', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                form.reset();
                updateRegistrationCount(); // Update count immediately after success
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Registration failed due to a network error. Please try again.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '[ Confirm Registration ]';
        }
    });
});

// --- Agenda Tabs Functionality ---
function openDay(evt, dayName) {
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(dayName).style.display = "block";
    evt.currentTarget.className += " active";
}