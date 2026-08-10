const socket = io();
let currentSlideIndex = 0;
let totalSlides = 0;
let departmentNames = [];
let slideMeta = []; // Meta details to map slides to left sidebar menu
let autoPlayInterval = null;

socket.on('dataChanged', (data) => {
    buildSlides(data);
});

fetch('/api/data').then(r => r.json()).then(data => buildSlides(data));

function buildSlides(data) {
    const container = document.getElementById('slides-container');
    container.innerHTML = '';
    departmentNames = Object.keys(data.departments || {});
    slideMeta = [];

    // 1. Overview Cover
    container.innerHTML += `
        <div class="slide">
            <div class="vibrant-card">
                <h1>Careclinics Weekly Alignment</h1>
                <p class="update-text">Welcome team! Let's align on this week's goals and departmental updates.</p>
            </div>
        </div>`;
    slideMeta.push({ label: 'Overview', icon: '❯' });

    // 2. Department Update & Q&A Loop
    for (const dept of departmentNames) {
        const deptData = data.departments[dept];

        // Update Slide
        container.innerHTML += `
            <div class="slide">
                <div class="vibrant-card">
                    <h2>${dept}</h2>
                    <h1 style="font-size: 3rem;">Weekly Update</h1>
                    <p class="update-text">${deptData.update || "No update provided."}</p>
                </div>
            </div>`;
        slideMeta.push({ label: `${dept} Update`, icon: '❯' });

        // QnA Slide
        const wheelGradient = generateWheelGradient(departmentNames);
        container.innerHTML += `
            <div class="slide qna-slide">
                <div class="vibrant-card">
                    <div class="qna-layout">
                        <div>
                            <h2>${dept} Question</h2>
                            <p class="update-text">${deptData.question || "No question submitted."}</p>
                        </div>
                        <div style="text-align: center;">
                            <h2>Who answers?</h2>
                            <div class="wheel-container">
                                <div class="wheel" style="background: ${wheelGradient}"></div>
                                <div class="wheel-pointer">▼</div>
                            </div>
                            <p>Press <strong>ENTER</strong> to spin</p>
                            <div class="winner-text"></div>
                        </div>
                    </div>
                </div>
            </div>`;
        slideMeta.push({ label: `${dept} Q&A`, icon: '🎲' });
    }

    // 3. Vision & Mission
    container.innerHTML += `
        <div class="slide">
            <div class="vibrant-card">
                <h1>Vision & Mission</h1>
                <div class="pill-grid">
                    <div class="sub-card">
                        <h2>Vision</h2>
                        <p style="font-size: 1.4rem;">${data.config.visionText || ""}</p>
                    </div>
                    <div class="sub-card">
                        <h2>Mission</h2>
                        <p style="font-size: 1.4rem;">${data.config.missionText || ""}</p>
                    </div>
                </div>
            </div>
        </div>`;
    slideMeta.push({ label: 'Vision & Mission', icon: '❯' });

    // 4. Daily Phrases
    const phrasesHtml = (data.config.phrases || [])
        .map(p => `<p style="font-size: 1.5rem; margin-bottom: 10px;">• ${p}</p>`)
        .join('');

    container.innerHTML += `
        <div class="slide">
            <div class="vibrant-card">
                <h1>Daily Phrases</h1>
                <div class="sub-card" style="margin-top: 20px;">
                    ${phrasesHtml}
                </div>
            </div>
        </div>`;
    slideMeta.push({ label: 'Daily Phrases', icon: '❯' });

    // 5. Closing Remarks (Optional)
    if (data.config.showLastMinuteSpeech) {
        container.innerHTML += `
            <div class="slide">
                <div class="vibrant-card">
                    <h2>Closing Remarks</h2>
                    <p class="update-text">${data.config.lastMinuteSpeechText}</p>
                </div>
            </div>`;
        slideMeta.push({ label: 'Closing Remarks', icon: '❯' });
    }

    totalSlides = slideMeta.length;
    if (currentSlideIndex >= totalSlides) currentSlideIndex = 0;

    renderSidebarMenu();
    updateSlidePosition();
}

function renderSidebarMenu() {
    const menuContainer = document.getElementById('sidebar-menu');
    menuContainer.innerHTML = slideMeta.map((item, idx) => `
        <div class="dept-pill ${idx === currentSlideIndex ? 'active' : ''}" onclick="goToSlide(${idx})">
            <span>${item.label}</span>
            <span class="dept-pill-arrow">${item.icon}</span>
        </div>
    `).join('');
}

function generateWheelGradient(depts) {
    if (!depts.length) return '#0a221b';
    const colors = ['#44d685', '#2a5a9c', '#f7e859', '#0a221b', '#4caf50', '#00bcd4'];
    const sliceAngle = 360 / depts.length;
    let grads = depts.map((_, i) => `${colors[i % colors.length]} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`);
    return `conic-gradient(${grads.join(', ')})`;
}

function goToSlide(index) {
    currentSlideIndex = index;
    updateSlidePosition();
}

function changeSlide(direction) {
    currentSlideIndex = Math.max(0, Math.min(totalSlides - 1, currentSlideIndex + direction));
    updateSlidePosition();
}

function updateSlidePosition() {
    const container = document.getElementById('slides-container');
    container.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    document.getElementById('slide-indicator').innerText = `${currentSlideIndex + 1} / ${totalSlides}`;
    renderSidebarMenu();
}

function spinWheel(slideElement) {
    const wheel = slideElement.querySelector('.wheel');
    const winnerDisplay = slideElement.querySelector('.winner-text');
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
        winnerDisplay.innerText = `Answering: ${departmentNames[winningIndex] || "Staff"}!`;
    }, 4000);
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function toggleAutoPlay() {
    const btn = document.getElementById('btn-autoplay');
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
        btn.innerText = "▶ Auto";
        btn.style.background = "";
    } else {
        autoPlayInterval = setInterval(() => {
            currentSlideIndex = (currentSlideIndex + 1) % totalSlides;
            updateSlidePosition();
        }, 8000);
        btn.innerText = "⏸ Auto";
        btn.style.background = "#44d685";
        btn.style.color = "#0a221b";
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') changeSlide(1);
    if (e.key === 'ArrowLeft') changeSlide(-1);
    if (e.key === 'Enter') {
        const currentSlideEl = document.querySelectorAll('.slide')[currentSlideIndex];
        if (currentSlideEl && currentSlideEl.querySelector('.wheel')) {
            spinWheel(currentSlideEl);
        }
    }
});

setInterval(() => {
    const clock = document.getElementById('live-clock');
    if (clock) clock.innerText = new Date().toLocaleString('en-MY', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}, 1000);