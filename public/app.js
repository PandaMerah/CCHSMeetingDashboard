const socket = io();
let currentSlideIndex = 0;
let totalSlides = 0;
let departmentNames = [];

// Listen for live updates from server
socket.on('dataChanged', (data) => {
    console.log("Live update received!");
    buildSlides(data);
});

// Initial load
fetch('/api/data').then(r => r.json()).then(data => buildSlides(data));

function buildSlides(data) {
    const container = document.getElementById('slides-container');
    container.innerHTML = ''; // Clear existing
    departmentNames = Object.keys(data.departments);
    
    // 1. Front Page
    container.innerHTML += `
        <div class="slide">
            <div class="glass-card">
                <h1>Careclinics Weekly Alignment</h1>
                <h2 id="live-clock"></h2>
            </div>
        </div>`;

    // 2. Department Flow (Update -> QnA loop)
    for (const dept of departmentNames) {
        const deptData = data.departments[dept];
        
        // Update Slide
        container.innerHTML += `
            <div class="slide">
                <div class="glass-card">
                    <h2 class="dept-title">${dept} Update</h2>
                    <p class="update-text">${deptData.update}</p>
                </div>
            </div>`;

        // QnA Slide
        const wheelGradient = generateWheelGradient(departmentNames);
        container.innerHTML += `
            <div class="slide qna-slide">
                <div class="glass-card qna-layout">
                    <div class="left-panel">
                        <h2 style="color: var(--accent-lime)">Question</h2>
                        <p class="update-text">${deptData.question}</p>
                    </div>
                    <div class="right-panel">
                        <h2>Who answers?</h2>
                        <div class="wheel-container">
                            <div class="wheel" style="background: ${wheelGradient}"></div>
                            <div class="wheel-pointer">▼</div>
                        </div>
                        <p>Press <strong>ENTER</strong> to spin</p>
                        <div class="winner-text"></div>
                    </div>
                </div>
            </div>`;
    }

    // 3. Vision & Mission
    container.innerHTML += `
        <div class="slide">
            <div class="glass-card">
                <h1>Vision & Mission</h1>
                <h2>Vision</h2><p class="update-text">Humanising Care through innovative solutions.</p>
                <br>
                <h2>Mission</h2><p class="update-text">Delivering quality healthcare where the human touch is essence.</p>
            </div>
        </div>`;

    // 4. Phrases
    container.innerHTML += `
        <div class="slide">
            <div class="glass-card">
                <h1>Daily Phrases</h1>
                <p class="update-text">• Superior medical expertise, top-notch hospitality.</p>
                <p class="update-text">• Care with a human touch.</p>
            </div>
        </div>`;

    // 5. Last Minute Speech (Conditional Admin Toggle)
    if (data.config.showLastMinuteSpeech) {
        container.innerHTML += `
            <div class="slide">
                <div class="glass-card">
                    <h2 style="color: var(--accent-yellow)">Closing Remarks</h2>
                    <p class="update-text">${data.config.lastMinuteSpeechText}</p>
                </div>
            </div>`;
    }

    totalSlides = document.querySelectorAll('.slide').length;
    updateSlidePosition(); // Ensure we stay on the current slide visually after a live rebuild
}

// Visual Wheel Generation
function generateWheelGradient(depts) {
    const colors = ['#93c01f', '#2a5a9c', '#dbe718', '#102141', '#4caf50', '#00bcd4'];
    const sliceAngle = 360 / depts.length;
    let grads = [];
    for (let i = 0; i < depts.length; i++) {
        grads.push(`${colors[i % colors.length]} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`);
    }
    return `conic-gradient(${grads.join(', ')})`;
}

// D-Pad Navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.keyCode === 39) {
        if (currentSlideIndex < totalSlides - 1) currentSlideIndex++;
        updateSlidePosition();
    } else if (e.key === 'ArrowLeft' || e.keyCode === 37) {
        if (currentSlideIndex > 0) currentSlideIndex--;
        updateSlidePosition();
    } else if (e.key === 'Enter' || e.keyCode === 13) {
        // Trigger wheel if on a QnA slide
        const currentSlideEl = document.querySelectorAll('.slide')[currentSlideIndex];
        if (currentSlideEl.classList.contains('qna-slide')) {
            spinWheel(currentSlideEl);
        }
    }
});

function updateSlidePosition() {
    const container = document.getElementById('slides-container');
    container.style.transform = `translateX(-${currentSlideIndex * 100}vw)`;
}

// Independent Spin Logic per slide
function spinWheel(slideElement) {
    const wheel = slideElement.querySelector('.wheel');
    const winnerDisplay = slideElement.querySelector('.winner-text');
    
    // Read current rotation from dataset or start at 0
    let currentRotation = parseFloat(wheel.dataset.rotation || 0);
    winnerDisplay.innerText = "Spinning...";

    const spins = 5; 
    const randomDegree = Math.floor(Math.random() * 360);
    currentRotation += (spins * 360) + randomDegree;
    
    wheel.dataset.rotation = currentRotation;
    wheel.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        const normalizedDegree = (360 - (currentRotation % 360)) % 360;
        const sliceAngle = 360 / departmentNames.length;
        const winningIndex = Math.floor(normalizedDegree / sliceAngle);
        winnerDisplay.innerText = `Answering: ${departmentNames[winningIndex]}!`;
    }, 4000);
}

// Live Clock
setInterval(() => {
    const clock = document.getElementById('live-clock');
    if(clock) clock.innerText = new Date().toLocaleString('en-MY', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
}, 1000);