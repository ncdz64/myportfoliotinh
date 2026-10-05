/* =====================================================
   TFT MYTHIC ARENA PORTFOLIO - JAVASCRIPT ENGINE
   Ninh Quốc Cường | Teamfight Tactics Hextech & Dragon Theme
===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ── DOM ELEMENTS ─────────────────────────────────
    const scenes = {
        intro: document.getElementById('intro-scene'),
        main: document.getElementById('main-scene')
    };

    const vids = {
        intro: document.getElementById('intro-vid'),
        introAmbient: document.getElementById('intro-ambient'),
        mainBg: document.getElementById('main-bg-video')
    };

    const audios = {
        bgm: document.getElementById('arena-bgm')
    };

    const sceneFlash = document.getElementById('scene-flash');
    const introWrapper = document.getElementById('intro-wrapper');
    const introHudOverlay = document.getElementById('intro-hud-overlay');
    const vignette = document.getElementById('vignette');
    const enterArenaBtn = document.getElementById('enter-arena-btn');
    const skipIntroBtn = document.getElementById('skip-intro-btn');
    const particlesCanvas = document.getElementById('particles-canvas');
    const pCtx = particlesCanvas ? particlesCanvas.getContext('2d') : null;

    const audioToggleBtn = document.getElementById('audio-toggle-btn');
    const fullscreenToggleBtn = document.getElementById('fullscreen-toggle-btn');
    const cvModal = document.getElementById('cv-modal');
    const viewCvBtn = document.getElementById('view-cv-btn');
    const closeCvModalBtn = document.getElementById('close-cv-modal');
    const toast = document.getElementById('toast-notification');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    // Armory & Augment selection elements
    const augmentCards = document.querySelectorAll('.augment-choice-card');
    const viewportTitle = document.getElementById('viewport-title');
    const viewportIcon = document.getElementById('viewport-icon');
    const viewportChangeBtn = document.getElementById('viewport-change-btn');
    const armoryRerollBtn = document.getElementById('armory-reroll-btn');
    const rerollCountLabel = document.getElementById('reroll-count');
    const armoryStageText = document.getElementById('armory-stage-text');
    const toggleViewModeBtn = document.getElementById('toggle-view-mode-btn');

    let isIntroFrozen = false;
    let isTransitioning = false;
    let isAudioMuted = false;
    let particlesRunning = false;
    let remainingRerolls = 2;
    let currentStageIndex = 0;
    const stages = [
        "GIAI ĐOẠN 2-1 • VÒNG CHỌN LÕI CÔNG NGHỆ 1",
        "GIAI ĐOẠN 3-2 • VÒNG CHỌN LÕI CÔNG NGHỆ 2",
        "GIAI ĐOẠN 4-2 • VÒNG CHỌN LÕI CÔNG NGHỆ 3"
    ];

    let isAllViewExpanded = false;

    // ── WEB AUDIO SYNTHESIZER (HEXTECH & TFT SFX) ────
    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Play subtle Hextech click
    function playHextechClick(freq = 600, duration = 0.08) {
        if (isAudioMuted) return;
        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + duration);

            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {}
    }

    // Play TFT Augment Selection Sound (Triumphant Chime Burst)
    function playAugmentSelectSound() {
        if (isAudioMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            // Chords: F#4, A#4, C#5, F#5 (Radiant TFT Augment chord)
            const freqs = [369.99, 466.16, 554.37, 739.99, 1108.73];
            freqs.forEach((f, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = i === 0 ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(f, now + i * 0.06);

                gain.gain.setValueAtTime(0.2, now + i * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 1.4);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.06);
                osc.stop(now + i * 0.06 + 1.4);
            });
        } catch (e) {}
    }

    // Play TFT Reroll Dice Sound
    function playRerollSound() {
        if (isAudioMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            // Quick dice chatter bursts
            for (let i = 0; i < 4; i++) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300 + Math.random() * 400, now + i * 0.05);

                gain.gain.setValueAtTime(0.15, now + i * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.08);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.05);
                osc.stop(now + i * 0.05 + 0.08);
            }
        } catch (e) {}
    }

    // Play epic TFT Dragon Roar & Gong transition sound
    function playArenaTransitionSound() {
        if (isAudioMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            // 1. Deep Gong
            const gong = ctx.createOscillator();
            const gongGain = ctx.createGain();
            gong.type = 'triangle';
            gong.frequency.setValueAtTime(140, now);
            gong.frequency.exponentialRampToValueAtTime(60, now + 1.8);

            gongGain.gain.setValueAtTime(0.35, now);
            gongGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

            gong.connect(gongGain);
            gongGain.connect(ctx.destination);
            gong.start();
            gong.stop(now + 1.8);

            // 2. Chime Shimmer
            const freqs = [523.25, 659.25, 783.99, 1046.50];
            freqs.forEach((f, idx) => {
                const chime = ctx.createOscillator();
                const chimeGain = ctx.createGain();
                chime.type = 'sine';
                chime.frequency.setValueAtTime(f, now + idx * 0.08);

                chimeGain.gain.setValueAtTime(0.15, now + idx * 0.08);
                chimeGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.2);

                chime.connect(chimeGain);
                chimeGain.connect(ctx.destination);
                chime.start(now + idx * 0.08);
                chime.stop(now + idx * 0.08 + 1.2);
            });
        } catch (e) {}
    }

    // ── PARTICLES SYSTEM (GOLDEN DRAGON EMBERS) ──────
    let particles = [];
    function resizeParticlesCanvas() {
        if (!particlesCanvas) return;
        particlesCanvas.width = window.innerWidth;
        particlesCanvas.height = window.innerHeight;
    }
    resizeParticlesCanvas();
    window.addEventListener('resize', resizeParticlesCanvas);

    function initParticles() {
        if (!particlesCanvas) return;
        particles = [];
        const count = window.innerWidth < 768 ? 35 : 70;
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * particlesCanvas.width,
                y: Math.random() * particlesCanvas.height,
                radius: Math.random() * 2.2 + 0.8,
                speedX: (Math.random() - 0.5) * 0.6,
                speedY: -Math.random() * 0.8 - 0.2,
                alpha: Math.random() * 0.6 + 0.2,
                color: Math.random() > 0.35 ? '#f5c452' : '#00f5d4'
            });
        }
    }

    function animateParticles() {
        if (!particlesRunning || !pCtx) return;
        pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);

        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.y < 0) {
                p.y = particlesCanvas.height + 10;
                p.x = Math.random() * particlesCanvas.width;
            }
            if (p.x < 0) p.x = particlesCanvas.width;
            if (p.x > particlesCanvas.width) p.x = 0;

            pCtx.save();
            pCtx.beginPath();
            pCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            pCtx.fillStyle = p.color;
            pCtx.globalAlpha = p.alpha;
            pCtx.shadowBlur = 8;
            pCtx.shadowColor = p.color;
            pCtx.fill();
            pCtx.restore();
        });

        requestAnimationFrame(animateParticles);
    }

    // ── CLICK FX CANVAS (HEXTECH RIPPLE & BURST) ─────
    const fxCanvas = document.createElement('canvas');
    fxCanvas.style.cssText = `
        position: fixed; inset: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 99998;
    `;
    document.body.appendChild(fxCanvas);
    const fxCtx = fxCanvas.getContext('2d');

    function resizeFxCanvas() {
        fxCanvas.width = window.innerWidth;
        fxCanvas.height = window.innerHeight;
    }
    resizeFxCanvas();
    window.addEventListener('resize', resizeFxCanvas);

    let clickBursts = [];
    window.addEventListener('pointerdown', (e) => {
        playHextechClick(520, 0.06);
        clickBursts.push({
            x: e.clientX,
            y: e.clientY,
            radius: 4,
            maxRadius: 36,
            life: 1.0,
            color: Math.random() > 0.4 ? '#f5c452' : '#00f5d4'
        });
    });

    function renderClickFx() {
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        for (let i = clickBursts.length - 1; i >= 0; i--) {
            const b = clickBursts[i];
            b.radius += (b.maxRadius - b.radius) * 0.18;
            b.life -= 0.035;

            if (b.life <= 0) {
                clickBursts.splice(i, 1);
                continue;
            }

            fxCtx.save();
            fxCtx.beginPath();
            fxCtx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            fxCtx.strokeStyle = b.color;
            fxCtx.lineWidth = 2.5 * b.life;
            fxCtx.globalAlpha = b.life;
            fxCtx.shadowBlur = 12;
            fxCtx.shadowColor = b.color;
            fxCtx.stroke();
            fxCtx.restore();
        }
        requestAnimationFrame(renderClickFx);
    }
    renderClickFx();

    // ── INTRO SEQUENCE CONTROL ───────────────────────
    function startIntroPlayback() {
        if (!vids.intro) return;

        vids.intro.currentTime = 0;
        vids.intro.muted = false;
        const playPromise = vids.intro.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                if (vids.introAmbient) {
                    vids.introAmbient.currentTime = 0;
                    vids.introAmbient.play().catch(() => {});
                }
            }).catch(() => {
                vids.intro.muted = true;
                vids.intro.play().catch(() => {});
                if (vids.introAmbient) {
                    vids.introAmbient.play().catch(() => {});
                }
            });
        }
    }

    function freezeIntro() {
        if (isIntroFrozen) return;
        isIntroFrozen = true;

        if (vids.intro) vids.intro.pause();
        if (vids.introAmbient) vids.introAmbient.loop = true;

        introWrapper.classList.add('frozen');
        vignette.classList.add('visible');
        if (particlesCanvas) {
            particlesCanvas.classList.add('visible');
            initParticles();
            particlesRunning = true;
            requestAnimationFrame(animateParticles);
        }
        introHudOverlay.classList.add('visible');
    }

    if (vids.intro) {
        vids.intro.addEventListener('timeupdate', () => {
            if (vids.intro.currentTime >= 4.85 && !isIntroFrozen) {
                freezeIntro();
            }
        });
        vids.intro.addEventListener('ended', freezeIntro);
    }

    // ── ARENA TRANSITION: ENTER MAIN PORTFOLIO ───────
    function enterConvergence() {
        if (isTransitioning) return;
        isTransitioning = true;

        getAudioContext();
        playArenaTransitionSound();

        sceneFlash.classList.add('active');

        if (vids.intro) vids.intro.pause();
        if (vids.introAmbient) vids.introAmbient.pause();

        setTimeout(() => {
            scenes.intro.classList.remove('active');
            scenes.main.classList.add('active');

            if (vids.mainBg) {
                vids.mainBg.currentTime = 0;
                vids.mainBg.play().catch(() => {});
            }

            if (audios.bgm && !isAudioMuted) {
                audios.bgm.currentTime = 0;
                audios.bgm.volume = 0.55;
                audios.bgm.play().catch(() => {});
            }

            if (!particlesRunning && particlesCanvas) {
                particlesCanvas.classList.add('visible');
                initParticles();
                particlesRunning = true;
                requestAnimationFrame(animateParticles);
            }

            setTimeout(() => {
                sceneFlash.classList.remove('active');
            }, 600);
        }, 500);
    }

    if (enterArenaBtn) {
        enterArenaBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            enterConvergence();
        });
    }

    if (skipIntroBtn) {
        skipIntroBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            enterConvergence();
        });
    }

    if (scenes.intro) {
        scenes.intro.addEventListener('click', () => {
            if (isIntroFrozen) {
                enterConvergence();
            }
        });
    }

    startIntroPlayback();

    // ── TFT AUGMENT SELECTION ARMORY ENGINE ───────────
    const augmentData = {
        'ielts': {
            title: "LÕI ĐANG KÍCH HOẠT: BẬC THẦY NGÔN NGỮ (IELTS 8.0 & MOS)",
            icon: "🌐",
            panelId: "panel-ielts",
            toastText: "Đã chọn Lõi Kim Cương: IELTS 8.0 & Tin học MOS"
        },
        'teaching': {
            title: "LÕI ĐANG KÍCH HOẠT: CHIẾN THẦN SƯ PHẠM (TRỢ GIẢNG & GIA SƯ)",
            icon: "👨‍🏫",
            panelId: "panel-teaching",
            toastText: "Đã chọn Lõi Vàng: Trợ giảng TIW & Gia sư toàn diện"
        },
        'education': {
            title: "LÕI ĐANG KÍCH HOẠT: HỌC THUẬT TINH HOA (FTU & CHUYÊN VĨNH PHÚC)",
            icon: "🏛️",
            panelId: "panel-education",
            toastText: "Đã chọn Lõi Vàng: ĐH Ngoại thương & THPT Chuyên Vĩnh Phúc"
        },
        'inventory': {
            title: "LÕI ĐANG KÍCH HOẠT: KHO TRANG BỊ & THÁCH ĐẤU (LIÊN HỆ & CV)",
            icon: "👑",
            panelId: "panel-inventory",
            toastText: "Đã chọn Lõi Ánh Sáng: Kho trang bị & Thông tin liên hệ"
        }
    };

    function selectAugment(augmentKey, shouldScroll = true) {
        const data = augmentData[augmentKey];
        if (!data) return;

        playAugmentSelectSound();

        // 1. Update selection state on cards
        augmentCards.forEach(card => {
            const btn = card.querySelector('.card-action-btn');
            if (card.dataset.augment === augmentKey) {
                card.classList.add('selected');
                if (btn) btn.textContent = "LÕI ĐANG CHỌN ✓";
            } else {
                card.classList.remove('selected');
                if (btn) btn.textContent = "CHỌN LÕI NÀY ➔";
            }
        });

        // 2. Update Viewport Header
        if (viewportTitle) viewportTitle.textContent = data.title;
        if (viewportIcon) viewportIcon.textContent = data.icon;

        // 3. Switch active panel
        document.querySelectorAll('.viewport-content-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        const targetPanel = document.getElementById(data.panelId);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        showToast(data.toastText);

        // 4. Smooth scroll into the viewport if requested
        if (shouldScroll) {
            const viewport = document.getElementById('active-augment-detail-viewport');
            if (viewport) {
                viewport.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    // Attach click events to Augment choice cards
    augmentCards.forEach(card => {
        card.addEventListener('click', () => {
            const augKey = card.dataset.augment;
            selectAugment(augKey, true);
        });
    });

    // "CHỌN LÕI KHÁC" button
    if (viewportChangeBtn) {
        viewportChangeBtn.addEventListener('click', () => {
            playHextechClick(700, 0.08);
            const armory = document.getElementById('augment-armory');
            if (armory) {
                armory.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // "🎲 ĐỔI LẠI (REROLL)" button
    if (armoryRerollBtn) {
        armoryRerollBtn.addEventListener('click', () => {
            if (remainingRerolls > 0) {
                remainingRerolls--;
                currentStageIndex = (currentStageIndex + 1) % stages.length;

                playRerollSound();

                if (armoryStageText) {
                    armoryStageText.textContent = stages[currentStageIndex];
                }
                if (rerollCountLabel) {
                    rerollCountLabel.textContent = remainingRerolls > 0 ? `${remainingRerolls} LƯỢT` : "HẾT LƯỢT";
                }
                if (remainingRerolls === 0) {
                    armoryRerollBtn.style.opacity = '0.6';
                    armoryRerollBtn.style.cursor = 'not-allowed';
                }

                // Visual shake / re-shimmer animation on cards
                augmentCards.forEach(c => {
                    c.style.animation = 'none';
                    c.offsetHeight; // trigger reflow
                    c.style.animation = 'fadeInUp 0.4s ease-out';
                });

                showToast(`🎲 Đã đổi lại Lõi! Bước sang ${stages[currentStageIndex].split('•')[0]}`);
            } else {
                showToast("Bạn đã sử dụng hết lượt Đổi Lại (Reroll)!");
            }
        });
    }

    // "👁️ XEM TẤT CẢ DỮ LIỆU" toggle button
    if (toggleViewModeBtn) {
        toggleViewModeBtn.addEventListener('click', () => {
            playHextechClick(750, 0.08);
            isAllViewExpanded = !isAllViewExpanded;

            const lowerSections = document.querySelectorAll('#inventory, #augments, #history, #combat, #contact');
            if (isAllViewExpanded) {
                lowerSections.forEach(s => s.style.display = 'block');
                toggleViewModeBtn.innerHTML = "🎯 CHẾ ĐỘ CHỌN LÕI (FOCUSED)";
                toggleViewModeBtn.classList.add('active');
                showToast("Đã mở toàn bộ các phần theo dòng thời gian!");
            } else {
                toggleViewModeBtn.innerHTML = "👁️ XEM TẤT CẢ DỮ LIỆU";
                toggleViewModeBtn.classList.remove('active');
                showToast("Đã chuyển về chế độ Chọn Lõi TFT!");
            }
        });
    }

    // Connect Trait Pills in Hero section directly to Augments!
    const traitPills = document.querySelectorAll('.trait-pill');
    traitPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const augTarget = pill.dataset.augTarget;
            if (augTarget) {
                selectAugment(augTarget, true);
            }
        });
    });

    // ── COPY TO CLIPBOARD WITH TOAST ─────────────────
    function showToast(message) {
        if (!toast) return;
        toast.innerHTML = `<span style="font-size: 1.2rem;">⚡</span> ${message}`;
        toast.classList.add('active');
        playHextechClick(880, 0.1);

        setTimeout(() => {
            toast.classList.remove('active');
        }, 2800);
    }

    const copyChips = document.querySelectorAll('[data-copy]');
    copyChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            const textToCopy = chip.dataset.copy;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast(`Đã sao chép: <strong>${textToCopy}</strong>`);
                }).catch(() => {
                    fallbackCopy(textToCopy);
                });
            } else {
                fallbackCopy(textToCopy);
            }
        });
    });

    function fallbackCopy(text) {
        const tempInput = document.createElement('input');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast(`Đã sao chép: <strong>${text}</strong>`);
    }

    // ── AUDIO BGM TOGGLE ─────────────────────────────
    if (audioToggleBtn) {
        audioToggleBtn.addEventListener('click', () => {
            isAudioMuted = !isAudioMuted;
            if (isAudioMuted) {
                if (audios.bgm) audios.bgm.pause();
                audioToggleBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                `;
                audioToggleBtn.classList.remove('active');
                showToast("Đã tắt âm thanh");
            } else {
                getAudioContext();
                if (audios.bgm) {
                    audios.bgm.volume = 0.55;
                    audios.bgm.play().catch(() => {});
                }
                audioToggleBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    </svg>
                `;
                audioToggleBtn.classList.add('active');
                showToast("Đang phát nhạc sàn đấu TFT");
            }
        });
    }

    // ── FULLSCREEN TOGGLE ────────────────────
    if (fullscreenToggleBtn) {
        fullscreenToggleBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
                fullscreenToggleBtn.classList.add('active');
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                    fullscreenToggleBtn.classList.remove('active');
                }
            }
        });
    }

    // ── ORIGINAL CV MODAL ────────────────────────────
    if (viewCvBtn && cvModal) {
        viewCvBtn.addEventListener('click', () => {
            playHextechClick(700, 0.08);
            cvModal.classList.add('active');
        });
    }
    if (closeCvModalBtn && cvModal) {
        closeCvModalBtn.addEventListener('click', () => {
            cvModal.classList.remove('active');
        });
    }
    if (cvModal) {
        cvModal.addEventListener('click', (e) => {
            if (e.target === cvModal) {
                cvModal.classList.remove('active');
            }
        });
    }

    // ── MOBILE NAVIGATION TOGGLE ─────────────────────
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
        document.querySelectorAll('.tft-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
            });
        });
    }

    // ── SMOOTH NAV SCROLL & ACTIVE LINK HIGHLIGHT ────
    const navLinks = document.querySelectorAll('.tft-nav-link');
    const sections = document.querySelectorAll('section[id]');
    const rootScroll = document.querySelector('.portfolio-root');

    if (rootScroll) {
        rootScroll.addEventListener('scroll', () => {
            const scrollPos = rootScroll.scrollTop + 180;
            sections.forEach(section => {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                const id = section.getAttribute('id');
                if (scrollPos >= top && scrollPos < top + height) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        });
    }
});
