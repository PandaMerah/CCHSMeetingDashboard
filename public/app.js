const socket = io();
let currentSlideIndex = 0;
let totalSlides = 0;
let departmentNames = [];
let slideMeta = [];
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

    // 1. Overview Main Page
    container.innerHTML += `
        <div class="slide">
            <div class="cc-card overview-card">
                <div class="overview-header">
                    <img src="/careclinic-logo.webp" alt="Care Clinics Logo" class="overview-logo">
                    <div class="overview-clock-box">
                        <div class="overview-time" id="main-clock-time">--:--:--</div>
                        <div class="overview-date" id="main-clock-date">-----, -- ---- ----</div>
                    </div>
                </div>
                
                <h1 style="margin-top: 24px;">Weekly Alignment Meeting</h1>
                <p class="update-text" style="max-width: 900px;">
                    Humanising Care — While we embrace technology in the delivery and improvement of quality care, the human touch remains the essence of our service.
                </p>

                <div class="overview-status-bar">
                    <div class="status-chip">
                        <span>Active Departments:</span> <strong>${departmentNames.length}</strong>
                    </div>
                    <div class="status-chip">
                        <span>Status:</span> <strong style="color: #00b894;">Live Broadcast Active</strong>
                    </div>
                </div>
            </div>
        </div>`;
    slideMeta.push({ label: 'Overview', icon: '❯' });

    // 2. Department Updates & Conditional Q&A Loop
    for (const dept of departmentNames) {
        const deptData = data.departments[dept];

        // Update Slide
        container.innerHTML += `
            <div class="slide">
                <div class="cc-card">
                    <div class="cc-card-tag">${dept}</div>
                    <h2>Weekly Department Update</h2>
                    <p class="update-text">${deptData.update || "No update provided."}</p>
                </div>
            </div>`;
        slideMeta.push({ label: `${dept} Update`, icon: '❯' });

        // Conditional Q&A Slide
        if (data.config.showQnA !== false) {
            const wheelGradient = generateWheelGradient(departmentNames);
            container.innerHTML += `
                <div class="slide qna-slide">
                    <div class="cc-card">
                        <div class="qna-layout">
                            <div>
                                <div class="cc-card-tag" style="background: rgba(245, 158, 11, 0.15); color: #d97706;">Question</div>
                                <h2>${dept}</h2>
                                <p class="update-text">${deptData.question || "No question submitted."}</p>
                            </div>
                            <div style="text-align: center;">
                                <h2>Who answers?</h2>
                                <div class="wheel-container">
                                    <div class="wheel" style="background: ${wheelGradient}"></div>
                                    <div class="wheel-pointer">▼</div>
                                </div>
                                <p style="font-size: 1.2rem; color: var(--cc-text-muted);">Press <strong>ENTER</strong> to spin wheel</p>
                                <div class="winner-text"></div>
                            </div>
                        </div>
                    </div>
                </div>`;
            slideMeta.push({ label: `${dept} Q&A`, icon: '🎲' });
        }
    }

    // 3. Vision & Mission Slide
    if (data.config.showVisionMission !== false) {
        container.innerHTML += `
            <div class="slide">
                <div class="cc-card">
                    <div class="cc-card-tag">Core Values</div>
                    <h1>Vision & Mission</h1>
                    <div class="pill-grid">
                        <div class="sub-card">
                            <h2>Vision</h2>
                            <p>${data.config.visionText || "Humanising Care through innovative solutions."}</p>
                        </div>
                        <div class="sub-card">
                            <h2>Mission</h2>
                            <p>${data.config.missionText || "Delivering quality healthcare where the human touch is essence."}</p>
                        </div>
                    </div>
                </div>
            </div>`;
        slideMeta.push({ label: 'Vision & Mission', icon: '❯' });
    }

    // 4. Daily Phrases Slide
    if (data.config.showDailyPhrases !== false) {
        const phrasesHtml = (data.config.phrases || [])
            .map(p => `<p style="font-size: 1.8rem; margin-bottom: 12px; color: var(--cc-text-dark);">• ${p}</p>`)
            .join('');

        container.innerHTML += `
            <div class="slide">
                <div class="cc-card">
                    <div class="cc-card-tag">Culture</div>
                    <h1>Daily Phrases</h1>
                    <div class="sub-card" style="margin-top: 10px;">
                        ${phrasesHtml}
                    </div>
                </div>
            </div>`;
        slideMeta.push({ label: 'Daily Phrases', icon: '❯' });
    }

    // 5. Closing Remarks
    if (data.config.showLastMinuteSpeech === true) {
        container.innerHTML += `
            <div class="slide">
                <div class="cc-card">
                    <div class="cc-card-tag" style="background: rgba(17, 35, 73, 0.1); color: var(--cc-navy);">Closing</div>
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
    updateClocks();
}

function renderSidebarMenu() {
    const menuContainer = document.getElementById('sidebar-menu');
    menuContainer.innerHTML = slideMeta.map((item, idx) => `
        <div class="dept-pill ${idx === currentSlideIndex ? 'active' : ''}" onclick="goToSlide(${idx})">
            <span>${item.label}</span>
            <span style="font-size: 0.9rem; opacity: 0.8;">${item.icon}</span>
        </div>
    `).join('');
}

function generateWheelGradient(depts) {
    if (!depts.length) return '#112349';
    const colors = ['#1863dc', '#00b894', '#f59e0b', '#112349', '#0984e3', '#6c5ce7'];
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

    // Smoothly Auto-Scroll active pill into viewport
    const activePill = document.querySelector('.dept-pill.active');
    if (activePill) {
        activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
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
        btn.style.background = "#1863dc";
    }
}

function updateClocks() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const sbTime = document.getElementById('sidebar-time');
    const sbDate = document.getElementById('sidebar-date');
    if (sbTime) sbTime.innerText = timeStr;
    if (sbDate) sbDate.innerText = dateStr;

    const mainTime = document.getElementById('main-clock-time');
    const mainDate = document.getElementById('main-clock-date');
    if (mainTime) mainTime.innerText = timeStr;
    if (mainDate) mainDate.innerText = dateStr;
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

setInterval(updateClocks, 1000);