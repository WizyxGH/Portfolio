(function (global) {
    function encodePathSegments(path) {
        if (!path) return "";
        if (/^https?:\/\//i.test(path)) return path;
        return path.split('/').map(seg => encodeURIComponent(seg)).join('/');
    }

    function extractFileName(src) {
        if (!src) return "";
        const parts = src.split("/").filter(Boolean);
        if (!parts.length) return "";
        const raw = parts[parts.length - 1].split(/[?#]/)[0];
        try {
            return decodeURIComponent(raw);
        } catch {
            return raw;
        }
    }

    function isVideo(src) {
        return /\.(mp4|webm|mov)$/i.test(src);
    }

    function isPdf(src) {
        return /\.(pdf)$/i.test(src);
    }

    function initProjectCarousel(config) {
        const {
            images = [],
            projectTitle = "",
            containerId = "projectCarousel",
            trackSelector = ".carousel-track",
            prevBtnId = "prevBtn",
            nextBtnId = "nextBtn",
            dotsId = "carouselDots",
            currentSlideId = "currentSlide",
            totalSlidesId = "totalSlides"
        } = config;

        const container = document.getElementById(containerId);
        if (!container) return;

        const carouselEls = {
            container: container,
            track: container.querySelector(trackSelector),
            prev: document.getElementById(prevBtnId),
            next: document.getElementById(nextBtnId),
            dots: document.getElementById(dotsId),
            currentSlide: document.getElementById(currentSlideId),
            totalSlides: document.getElementById(totalSlidesId)
        };

        const NAV_BTN_CLASS = "absolute top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center shadow-md text-white transition z-30 transform hover:scale-110";
        const DOT_CLASS = "rounded-full transition-all duration-300 w-3 h-3 block flex-shrink-0 bg-[#411FEB]/30 hover:bg-[#411FEB]/50 focus:outline-none p-0 border-0";
        const DOT_ACTIVE_CLASS = "rounded-full transition-all duration-300 w-3 h-3 block flex-shrink-0 bg-[#411FEB] focus:outline-none scale-125 p-0 border-0";

        let activeGalleryImages = (images || []).filter(Boolean);
        let currentSlideIndex = 0;
        let isGlobalMuted = true; // Default to muted like Instagram
        let globalVolumeLevel = 1.0; // 0 to 1

        // Fullscreen vars
        let fullscreenOverlay = null;
        let fullscreenMedia = null; // Can be img or video
        let fullscreenZoomed = false;
        let fullscreenPanX = 0;
        let fullscreenPanY = 0;
        let fullscreenPointerId = null;
        let fullscreenDragStart = null;
        let overlaySwipeConsumed = false;

        // Touch/Swipe vars
        let touchStartX = null;
        let touchStartY = null;
        let pointerStartX = null;
        let pointerStartY = null;
        const swipeThreshold = 40;
        const wheelThreshold = 25;
        const wheelDebounceMs = 220;
        let lastWheelTs = 0;

        // --- Video Management ---
        function stopAllVideosInTrack() {
            if (!carouselEls.track) return;
            const videos = carouselEls.track.querySelectorAll('video');
            videos.forEach(v => {
                v.pause();
                v.currentTime = 0;
            });
        }

        function playCurrentVideo() {
            if (!carouselEls.track) return;
            const slides = carouselEls.track.children;
            const total = slides.length;
            if (!total) return;

            // Current slide
            const currentSlide = slides[currentSlideIndex];
            if (!currentSlide) return;

            const video = currentSlide.querySelector('video');
            if (video) {
                // Apply global state
                video.muted = isGlobalMuted;
                video.volume = globalVolumeLevel;
                updateVolumeUI(currentSlide);

                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // console.log("Auto-play prevented:", error);
                        // If unmuted autoplay fails, try muted?
                        if (!isGlobalMuted) {
                            video.muted = true;
                            updateVolumeUI(currentSlide);
                            video.play().catch(e => { });
                        }
                    });
                }
            }
        }

        function toggleMute(e, slide) {
            e.stopPropagation(); // Don't trigger fullscreen

            isGlobalMuted = !isGlobalMuted;

            // If unmoting and volume is 0, set to 1
            if (!isGlobalMuted && globalVolumeLevel === 0) {
                globalVolumeLevel = 1.0;
            }

            // Update current video immediately
            const video = slide.querySelector('video');
            if (video) {
                video.muted = isGlobalMuted;
                if (!isGlobalMuted) video.volume = globalVolumeLevel;
            }
            updateVolumeUI(slide);
        }

        function onVolumeChange(e, slide) {
            e.stopPropagation();
            const value = parseFloat(e.target.value);
            globalVolumeLevel = value;

            if (globalVolumeLevel > 0 && isGlobalMuted) {
                isGlobalMuted = false;
            } else if (globalVolumeLevel === 0) {
                isGlobalMuted = true;
            }

            const video = slide.querySelector('video');
            if (video) {
                video.muted = isGlobalMuted;
                video.volume = globalVolumeLevel;
            }
            updateVolumeUI(slide);
        }

        function updateVolumeUI(slide) {
            const btnIcon = slide.querySelector('.volume-icon');
            const slider = slide.querySelector('input[type="range"]');

            // Update Icon
            if (btnIcon) {
                if (isGlobalMuted || globalVolumeLevel === 0) {
                    btnIcon.className = 'bx bx-volume-mute text-md volume-icon';
                } else if (globalVolumeLevel < 0.5) {
                    btnIcon.className = 'bx bx-volume-low text-md volume-icon';
                } else {
                    btnIcon.className = 'bx bx-volume-full text-md volume-icon';
                }
            }

            // Update Slider Value
            if (slider) {
                slider.value = isGlobalMuted ? 0 : globalVolumeLevel;
                // Update track background (simulating fill)
                // Need to use css variable or direct style
                const percentage = (slider.value) * 100;
                // Since input is rotated -90deg, "right" is visually "top".
                slider.style.background = `linear-gradient(to right, white ${percentage}%, rgba(255,255,255,0.2) ${percentage}%)`;
            }
        }

        // --- Fullscreen Logic ---
        function ensureFullscreenOverlay() {
            if (fullscreenOverlay) return;

            fullscreenOverlay = document.createElement("div");
            fullscreenOverlay.id = "modalImageFullscreen";
            fullscreenOverlay.className = "fixed inset-0 w-screen h-screen flex items-center justify-center px-4 z-[100000] hidden backdrop-blur-sm";
            fullscreenOverlay.style.zIndex = "100000";
            fullscreenOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.90)";
            fullscreenOverlay.setAttribute("aria-hidden", "true");

            fullscreenOverlay.addEventListener("click", (e) => {
                if (overlaySwipeConsumed) {
                    overlaySwipeConsumed = false;
                    e.stopPropagation();
                    return;
                }
                // Don't close if clicking video controls
                if (e.target.tagName === 'VIDEO') return;
                closeFullscreenMedia();
            });

            const closeBtn = document.createElement("button");
            closeBtn.type = "button";
            closeBtn.className = "text-white text-2xl hover:scale-110 transition flex items-center justify-center w-10 h-10 rounded-full";
            closeBtn.style.position = "absolute";
            closeBtn.style.top = "20px";
            closeBtn.style.right = "20px";
            closeBtn.style.zIndex = "100001";
            closeBtn.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            closeBtn.style.backdropFilter = "blur(6px)";
            closeBtn.innerHTML = "<i class='bx bx-x'></i>";
            closeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                closeFullscreenMedia();
            });

            // Container for media
            const mediaContainer = document.createElement("div");
            mediaContainer.id = "fullscreenMediaContainer";
            mediaContainer.className = "contents"; // Allow direct child styling

            // Navigation Buttons (Fullscreen)
            const prevFsBtn = document.createElement("button");
            prevFsBtn.className = "absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:scale-110 transition z-[100002] p-4";
            prevFsBtn.innerHTML = "<i class='bx bx-chevron-left text-5xl drop-shadow-lg'></i>";
            prevFsBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                navigateFullscreen(-1);
            });

            const nextFsBtn = document.createElement("button");
            nextFsBtn.className = "absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:scale-110 transition z-[100002] p-4";
            nextFsBtn.innerHTML = "<i class='bx bx-chevron-right text-5xl drop-shadow-lg'></i>";
            nextFsBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                navigateFullscreen(1);
            });

            fullscreenOverlay.appendChild(mediaContainer);
            fullscreenOverlay.appendChild(closeBtn);
            fullscreenOverlay.appendChild(prevFsBtn);
            fullscreenOverlay.appendChild(nextFsBtn);
            document.body.appendChild(fullscreenOverlay);
            attachSwipeHandlers(fullscreenOverlay);
        }

        function navigateFullscreen(dir) {
            if (!activeGalleryImages.length) return;
            const total = activeGalleryImages.length;
            let nextIndex = currentSlideIndex + dir;

            if (nextIndex < 0) nextIndex = total - 1; // infinite loop left
            if (nextIndex >= total) nextIndex = 0; // infinite loop right

            goToSlide(nextIndex); // Sync carousel background

            // Re-open fullscreen with new content
            const src = activeGalleryImages[nextIndex];
            const fileName = extractFileName(src);
            const altText = fileName ? `${projectTitle} - ${fileName}` : `${projectTitle} - visuel ${nextIndex + 1}`;
            openFullscreenMedia(src, altText);
        }

        function openFullscreenMedia(src, alt) {
            if (!src) return;
            ensureFullscreenOverlay();
            resetFullscreenZoom();

            const container = document.getElementById("fullscreenMediaContainer");
            container.innerHTML = ""; // Clear previous

            if (isVideo(src)) {
                fullscreenMedia = document.createElement("video");
                fullscreenMedia.className = "max-h-[90vh] max-w-[90vw] shadow-2xl";
                fullscreenMedia.controls = true; // Use controls in fullscreen
                fullscreenMedia.autoplay = true;
                fullscreenMedia.src = src;

                // Keep global volume intent?
                // Fullscreen usually implies explicit watching, so unmute or keep global level?
                // Defaulting to unmuted for full immersion
                fullscreenMedia.muted = false;
                fullscreenMedia.volume = Math.max(0.5, globalVolumeLevel);
            } else if (isPdf(src)) {
                fullscreenMedia = document.createElement("iframe");
                // "Same system as images": using 90vw/90vh to match max-w-[90vw] max-h-[90vh] of images
                fullscreenMedia.className = "w-[90vw] h-[90vh] shadow-2xl bg-white rounded-lg";
                // Adding view=Fit to try to auto-fit content
                fullscreenMedia.src = src + "#toolbar=0&navpanes=0&view=Fit";
                fullscreenMedia.setAttribute("type", "application/pdf");
            } else {
                fullscreenMedia = document.createElement("img");
                fullscreenMedia.className = "max-h-[90vh] max-w-[90vw] object-contain shadow-2xl";
                fullscreenMedia.alt = alt || "";
                fullscreenMedia.draggable = false;
                fullscreenMedia.style.userSelect = "none";
                fullscreenMedia.style.cursor = "zoom-in";
                fullscreenMedia.src = src;

                fullscreenMedia.addEventListener("click", (e) => e.stopPropagation());
                fullscreenMedia.addEventListener("dblclick", (e) => {
                    e.preventDefault();
                    toggleFullscreenZoom(e);
                });
                fullscreenMedia.addEventListener("pointerdown", onFullscreenPointerDown);
                fullscreenMedia.addEventListener("pointermove", onFullscreenPointerMove);
                fullscreenMedia.addEventListener("pointerup", endFullscreenPointer);
                fullscreenMedia.addEventListener("pointercancel", endFullscreenPointer);
                fullscreenMedia.addEventListener("pointerleave", endFullscreenPointer);
            }

            container.appendChild(fullscreenMedia);

            fullscreenOverlay.classList.remove("hidden");
            fullscreenOverlay.setAttribute("aria-hidden", "false");
            overlaySwipeConsumed = false;
            document.body.classList.add("overflow-hidden");

            // Pause carousel video if playing
            const currentSlide = carouselEls.track.children[currentSlideIndex];
            const video = currentSlide?.querySelector('video');
            if (video) video.pause();
        }

        function closeFullscreenMedia() {
            if (!fullscreenOverlay) return;
            fullscreenOverlay.classList.add("hidden");
            fullscreenOverlay.setAttribute("aria-hidden", "true");

            const container = document.getElementById("fullscreenMediaContainer");
            if (container) container.innerHTML = "";
            fullscreenMedia = null;

            overlaySwipeConsumed = false;
            resetFullscreenZoom();
            document.body.classList.remove("overflow-hidden");

            // Resume carousel video (muted) if appropriate
            if (activeGalleryImages.length > 0) {
                const currentSlide = carouselEls.track.children[currentSlideIndex];
                const video = currentSlide?.querySelector('video');
                if (video) {
                    video.muted = isGlobalMuted; // Restore mute state
                    video.play().catch(e => { });
                }
            }
        }

        function resetFullscreenZoom() {
            fullscreenZoomed = false;
            fullscreenPanX = 0;
            fullscreenPanY = 0;
            fullscreenPointerId = null;
            fullscreenDragStart = null;
            if (!fullscreenMedia || fullscreenMedia.tagName === 'VIDEO' || fullscreenMedia.tagName === 'IFRAME') return;
            fullscreenMedia.style.transformOrigin = "center center";
            fullscreenMedia.style.transform = "translate(0px, 0px) scale(1)";
            fullscreenMedia.style.cursor = "zoom-in";
        }

        function applyFullscreenTransform() {
            if (!fullscreenMedia || fullscreenMedia.tagName === 'VIDEO' || fullscreenMedia.tagName === 'IFRAME') return;
            const scale = fullscreenZoomed ? 2 : 1;
            fullscreenMedia.style.transform = `translate(${fullscreenPanX}px, ${fullscreenPanY}px) scale(${scale})`;
        }

        function toggleFullscreenZoom(event) {
            if (!fullscreenMedia || fullscreenMedia.tagName === 'VIDEO' || fullscreenMedia.tagName === 'IFRAME') return;
            if (!fullscreenZoomed) {
                const rect = fullscreenMedia.getBoundingClientRect();
                const originX = ((event?.clientX ?? rect.left + rect.width / 2) - rect.left) / rect.width * 100;
                const originY = ((event?.clientY ?? rect.top + rect.height / 2) - rect.top) / rect.height * 100;
                fullscreenMedia.style.transformOrigin = `${originX}% ${originY}%`;
                fullscreenZoomed = true;
                fullscreenPanX = 0;
                fullscreenPanY = 0;
                fullscreenMedia.style.cursor = "grab";
                applyFullscreenTransform();
                return;
            }
            resetFullscreenZoom();
        }

        function onFullscreenPointerDown(e) {
            if (fullscreenMedia?.tagName === 'VIDEO') return;
            if (!fullscreenZoomed || e.button !== 0) return;
            fullscreenPointerId = e.pointerId;
            fullscreenDragStart = { x: e.clientX, y: e.clientY, panX: fullscreenPanX, panY: fullscreenPanY };
            fullscreenMedia?.setPointerCapture(fullscreenPointerId);
            fullscreenMedia.style.cursor = "grabbing";
        }

        function onFullscreenPointerMove(e) {
            if (fullscreenMedia?.tagName === 'VIDEO') return;
            if (!fullscreenZoomed || fullscreenPointerId !== e.pointerId || !fullscreenDragStart) return;
            const dx = e.clientX - fullscreenDragStart.x;
            const dy = e.clientY - fullscreenDragStart.y;
            fullscreenPanX = fullscreenDragStart.panX + dx;
            fullscreenPanY = fullscreenDragStart.panY + dy;
            applyFullscreenTransform();
        }

        function endFullscreenPointer(e) {
            if (fullscreenMedia?.tagName === 'VIDEO') return;
            if (fullscreenPointerId === null || e.pointerId !== fullscreenPointerId) return;
            fullscreenPointerId = null;
            fullscreenDragStart = null;
            if (!fullscreenMedia) return;
            fullscreenMedia.releasePointerCapture?.(e.pointerId);
            fullscreenMedia.style.cursor = fullscreenZoomed ? "grab" : "zoom-in";
        }


        // --- Carousel Rendering & Nav ---
        function renderCarousel() {
            if (!carouselEls.track) return;

            carouselEls.track.innerHTML = "";
            activeGalleryImages = (images || []).filter(Boolean);

            carouselEls.track.style.transform = "translateX(0%)";
            const totalSlides = activeGalleryImages.length || 1;
            carouselEls.track.style.width = `${totalSlides * 100}%`;
            carouselEls.track.style.height = "100%";

            if (carouselEls.prev) carouselEls.prev.className = `${NAV_BTN_CLASS} left-3`;
            if (carouselEls.next) carouselEls.next.className = `${NAV_BTN_CLASS} right-3`;

            if (!activeGalleryImages.length) return;

            activeGalleryImages.forEach((src, idx) => {
                const slide = document.createElement("div");
                slide.className = "flex-none h-full flex items-center justify-center bg-black overflow-hidden relative";
                slide.style.width = `${100 / totalSlides}%`;
                slide.style.flex = `0 0 ${100 / totalSlides}%`;

                const fileName = extractFileName(src);
                const altText = fileName ? `${projectTitle} - ${fileName}` : `${projectTitle} - visuel ${idx + 1}`;

                if (isVideo(src)) {
                    // --- VIDEO ---
                    const video = document.createElement("video");
                    // removed opacity-0 entirely to ensure visibility
                    video.className = "h-full w-full object-contain cursor-pointer";
                    video.loop = true;
                    video.muted = true; // start muted
                    video.playsInline = true;
                    video.setAttribute('playsinline', '');
                    video.preload = "metadata";
                    video.src = src;

                    // Click to Toggle Play/Pause instead of Fullscreen
                    video.addEventListener("click", () => {
                        if (video.paused) {
                            video.play();
                        } else {
                            video.pause();
                        }
                    });

                    // --- VOLUME CONTAINER (Instagram style) ---
                    const volContainer = document.createElement("div");
                    // justified-end to keep button at bottom
                    // Using Tailwind classes for positioning
                    // Reverting to inline styles for positioning to guarantee strict adherence to "bottom right" without CSS conflicts
                    volContainer.className = "absolute z-20 flex flex-col items-center justify-end h-auto transition-all";
                    volContainer.style.bottom = "24px";
                    volContainer.style.right = "24px";

                    // Slider Wrapper
                    const sliderWrapper = document.createElement("div");
                    // Static Tailwind classes for formatting
                    // Removed overflow-hidden: this was clipping the unrotated 80px input in the layout phase,
                    // making ends unclickable. using opacity/pointer-events is sufficient for hiding.
                    sliderWrapper.className = "bg-black/60 backdrop-blur-md rounded-full flex flex-col justify-center items-center overflow-hidden transition-all duration-300 px-3";

                    // Dynamic styles for animation (Inline for robustness)
                    sliderWrapper.style.height = "0px";
                    sliderWrapper.style.opacity = "0";
                    sliderWrapper.style.marginBottom = "0px";
                    sliderWrapper.style.pointerEvents = "none";

                    // JS Hover Behavior
                    const showSlider = () => {
                        sliderWrapper.style.height = "128px"; // Equivalent to h-32
                        sliderWrapper.style.opacity = "1";
                        sliderWrapper.style.marginBottom = "12px"; // Equivalent to mb-3
                        sliderWrapper.style.pointerEvents = "auto";
                    };
                    const hideSlider = () => {
                        sliderWrapper.style.height = "0px";
                        sliderWrapper.style.opacity = "0";
                        sliderWrapper.style.marginBottom = "0px";
                        sliderWrapper.style.pointerEvents = "none";
                    };

                    volContainer.addEventListener("mouseenter", showSlider);
                    volContainer.addEventListener("mouseleave", hideSlider);

                    // Input Holder to constrain visual width
                    const inputHolder = document.createElement("div");
                    inputHolder.className = "w-1 h-20 relative";

                    // Native range input styled vertical via rotation
                    // We use a horizontal input rotated -90deg.
                    // This is robust formatting for all browsers.
                    const range = document.createElement("input");
                    range.type = "range";
                    range.min = "0";
                    range.max = "1";
                    range.step = "0.01";
                    range.value = "0"; // initial

                    // Uses utilities for centering and rotation
                    // w-20 (80px), h-6 (24px) to fit container, rounded-2xl
                    // Added z-40 to ensure it sits on top
                    range.className = "appearance-none bg-transparent cursor-pointer w-20 h-6 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 rounded-2xl outline-none z-40 transform";

                    range.addEventListener("input", (e) => onVolumeChange(e, slide));
                    range.addEventListener("click", (e) => e.stopPropagation());
                    range.addEventListener("pointerdown", (e) => e.stopPropagation());

                    inputHolder.appendChild(range);
                    sliderWrapper.appendChild(inputHolder);

                    // Button
                    const volBtn = document.createElement("button");
                    // Matching counter style: bg-black/60 backdrop-blur-md. Added hover for interactivity.
                    // Added p-2 as requested
                    volBtn.className = "bg-black/60 hover:bg-black/80 text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors relative z-30 p-2";
                    volBtn.ariaLabel = "Activer/Désactiver le son";
                    volBtn.innerHTML = "<i class='bx bx-volume-mute text-xl volume-icon'></i>";
                    // Only toggle mute on click. Slider is for volume.
                    volBtn.addEventListener("click", (e) => toggleMute(e, slide));
                    // Prevent propagation to video
                    volBtn.addEventListener("pointerdown", (e) => e.stopPropagation());

                    volContainer.appendChild(sliderWrapper);
                    volContainer.appendChild(volBtn);

                    slide.appendChild(video);
                    slide.appendChild(volContainer);

                    // Initial UI state
                    setTimeout(() => updateVolumeUI(slide), 0);

                } else if (isPdf(src)) {
                    // --- PDF ---
                    const container = document.createElement("div");
                    container.className = "h-full w-full flex items-center justify-center bg-gray-100 relative group-pdf";

                    const iframe = document.createElement("iframe");
                    // Remove scrollbar=0 to ensure scrolling is possible if needed.
                    iframe.src = src + "#toolbar=0&navpanes=0";
                    iframe.className = "h-full w-full object-contain border-0";
                    iframe.setAttribute("type", "application/pdf");

                    // Fullscreen Button
                    const fsBtn = document.createElement("button");
                    // Match Volume Button: w-8 h-8, p-2, bg-black/60, etc.
                    // Using inline styles for bottom/right to guarantee exact match with volume container
                    fsBtn.className = "absolute z-20 bg-black/60 hover:bg-black/80 text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors shadow-md p-2";
                    fsBtn.style.bottom = "24px";
                    fsBtn.style.right = "24px";
                    fsBtn.ariaLabel = "Agrandir le PDF";
                    fsBtn.innerHTML = "<i class='bx bx-fullscreen text-xl'></i>";
                    fsBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        openFullscreenMedia(src, altText);
                    });

                    container.appendChild(iframe);

                    // Interaction Overlay for Desktop (Mouse)
                    // Allows clicking "body" to fullscreen, but leaves right gap for scrollbar
                    // On Touch/Mobile, we skip this to allow native touch interaction (scroll/pan)
                    const isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

                    if (!isTouch) {
                        const clickOverlay = document.createElement("div");
                        // inset-0 but right-4 (16px) or right-6 (24px) for scrollbar
                        clickOverlay.className = "absolute top-0 left-0 bottom-0 right-6 z-10 cursor-pointer bg-transparent";
                        clickOverlay.title = "Cliquez pour agrandir (utilisez la barre de droite pour scroller)";

                        clickOverlay.addEventListener("click", (e) => {
                            e.stopPropagation();
                            openFullscreenMedia(src, altText);
                        });
                        container.appendChild(clickOverlay);
                    }

                    container.appendChild(fsBtn);
                    slide.appendChild(container);

                } else {
                    // --- IMAGE ---
                    const img = document.createElement("img");
                    img.dataset.src = src;
                    img.alt = altText;
                    img.className = "h-full object-contain opacity-0 transition-opacity duration-300 cursor-pointer";
                    img.draggable = false;
                    img.style.userSelect = "none";

                    img.onload = () => img.classList.remove("opacity-0");
                    // Preload check
                    if (img.complete && img.naturalHeight !== 0) img.classList.remove("opacity-0");

                    if (idx === 0) img.src = src;

                    img.addEventListener("click", () => openFullscreenMedia(img.src || img.dataset.src, altText));

                    slide.appendChild(img);
                }

                carouselEls.track.appendChild(slide);
            });

            renderDots(totalSlides);
            updateCarouselUI();
        }

        function renderDots(total) {
            if (!carouselEls.dots) return;
            carouselEls.dots.innerHTML = "";
            if (total <= 1) {
                carouselEls.dots.style.display = 'none';
                return;
            }
            carouselEls.dots.style.display = 'flex';

            const MAX_DOTS = 8;
            const windowSize = Math.min(total, MAX_DOTS);
            let start = Math.max(0, currentSlideIndex - Math.floor(windowSize / 2));
            let end = start + windowSize - 1;
            if (end >= total) {
                end = total - 1;
                start = Math.max(0, end - windowSize + 1);
            }

            for (let i = start; i <= end; i++) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = i === currentSlideIndex ? DOT_ACTIVE_CLASS : DOT_CLASS;
                btn.ariaLabel = `Voir slide ${i + 1}`;
                btn.style.width = "12px";
                btn.style.height = "12px";
                btn.style.display = "block";
                btn.style.padding = "0";
                btn.style.border = "none";
                const isActive = (i === currentSlideIndex);
                btn.style.backgroundColor = "#411FEB";
                btn.style.opacity = isActive ? "1" : "0.3";

                btn.addEventListener("click", () => goToSlide(i));
                carouselEls.dots.appendChild(btn);
            }
        }

        function updateCarouselUI() {
            if (!carouselEls.track) return;
            const total = activeGalleryImages.length;
            const offset = total > 0 ? -(currentSlideIndex * (100 / total)) : 0;
            carouselEls.track.style.transform = `translateX(${offset}%)`;

            // Counter
            if (carouselEls.currentSlide && carouselEls.totalSlides) {
                if (total <= 1) {
                    carouselEls.currentSlide.parentElement.style.display = 'none';
                } else {
                    carouselEls.currentSlide.parentElement.style.display = '';
                    carouselEls.currentSlide.textContent = currentSlideIndex + 1;
                    carouselEls.totalSlides.textContent = total;
                }
            }

            renderDots(total);

            // Hide buttons if need be
            if (carouselEls.prev && carouselEls.next) {
                if (total <= 1) {
                    carouselEls.prev.style.display = 'none';
                    carouselEls.next.style.display = 'none';
                } else {
                    carouselEls.prev.style.display = currentSlideIndex === 0 ? 'none' : 'flex';
                    carouselEls.next.style.display = currentSlideIndex === total - 1 ? 'none' : 'flex';
                }
            }
        }

        function preloadSlide(index) {
            if (!carouselEls.track) return;
            const slides = carouselEls.track.children;
            const total = slides.length;
            if (!total) return;
            const normalized = ((index % total) + total) % total;

            const slide = slides[normalized];
            const img = slide.querySelector("img");
            if (img && !img.getAttribute("src")) {
                const srcToLoad = img.dataset.src;
                if (srcToLoad) img.src = srcToLoad;
            }
            // Videos are not "lazy-loaded" in src usually but we could.
            // For now they are created with src immediately but autoplay handles loading priority.
        }

        function goToSlide(index) {
            if (!activeGalleryImages.length) return;
            const total = activeGalleryImages.length;
            let target = index;

            // Stop playback on current slide before moving
            stopAllVideosInTrack();
            resetAutoPlay(); // Also resets interval

            if (target < 0 || target >= total) return; // No wrapping with buttons, but check logic

            currentSlideIndex = target;
            preloadSlide(target);
            preloadSlide(target + 1);
            preloadSlide(target - 1);
            updateCarouselUI();

            // Play new video if any
            playCurrentVideo();
        }

        // --- Swipe / Inputs ---
        function processSwipe(dx, dy, sourceEl) {
            if (!activeGalleryImages.length) return;
            if (Math.abs(dx) <= Math.abs(dy)) return;
            if (Math.abs(dx) < swipeThreshold) return;
            if (dx < 0) {
                if (currentSlideIndex < activeGalleryImages.length - 1) goToSlide(currentSlideIndex + 1);
            } else {
                if (currentSlideIndex > 0) goToSlide(currentSlideIndex - 1);
            }
            if (sourceEl === fullscreenOverlay) overlaySwipeConsumed = true;
        }

        function attachSwipeHandlers(element) {
            if (!element) return;

            element.addEventListener("touchstart", (e) => {
                if (!e.touches?.length) return;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }, { passive: true });

            element.addEventListener("touchmove", (e) => {
                if (touchStartX === null || touchStartY === null || !e.touches?.length) return;
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > swipeThreshold) {
                    e.preventDefault();
                }
            }, { passive: false });

            element.addEventListener("touchend", (e) => {
                if (touchStartX === null || touchStartY === null) return;
                const touch = e.changedTouches?.[0];
                if (!touch) {
                    touchStartX = touchStartY = null;
                    return;
                }
                const dx = touch.clientX - touchStartX;
                const dy = touch.clientY - touchStartY;
                touchStartX = touchStartY = null;
                processSwipe(dx, dy, e.currentTarget);
            });

            const resetPointer = () => {
                pointerStartX = null;
                pointerStartY = null;
            };

            element.addEventListener("pointerdown", (e) => {
                if (!e.isPrimary || e.button !== 0) return;
                pointerStartX = e.clientX;
                pointerStartY = e.clientY;
            });

            element.addEventListener("pointermove", (e) => {
                if (pointerStartX === null || pointerStartY === null) return;
                const dx = e.clientX - pointerStartX;
                const dy = e.clientY - pointerStartY;
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > swipeThreshold) {
                    e.preventDefault();
                }
            });

            const handlePointerEnd = (e) => {
                if (pointerStartX === null || pointerStartY === null) return resetPointer();
                const dx = e.clientX - pointerStartX;
                const dy = e.clientY - pointerStartY;
                resetPointer();
                processSwipe(dx, dy, e.currentTarget);
            };

            element.addEventListener("pointerup", handlePointerEnd);
            element.addEventListener("pointerleave", handlePointerEnd);

            element.addEventListener("wheel", (e) => {
                const now = Date.now();
                if (now - lastWheelTs < wheelDebounceMs) return;
                if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
                if (Math.abs(e.deltaX) < wheelThreshold) return;

                lastWheelTs = now;
                e.preventDefault();
                if (e.deltaX > 0) {
                    if (currentSlideIndex < activeGalleryImages.length - 1) goToSlide(currentSlideIndex + 1);
                } else {
                    if (currentSlideIndex > 0) goToSlide(currentSlideIndex - 1);
                }
            }, { passive: false });
        }

        // --- Init ---
        renderCarousel();
        // Initial Play
        playCurrentVideo();

        // Bind events
        if (carouselEls.prev) carouselEls.prev.addEventListener('click', () => {
            if (currentSlideIndex > 0) goToSlide(currentSlideIndex - 1);
        });
        if (carouselEls.next) carouselEls.next.addEventListener('click', () => {
            if (currentSlideIndex < activeGalleryImages.length - 1) goToSlide(currentSlideIndex + 1);
        });

        attachSwipeHandlers(carouselEls.track);

        document.addEventListener("keydown", (e) => {
            if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

            if (fullscreenOverlay && !fullscreenOverlay.classList.contains("hidden")) {
                // In fullscreen, we might want to navigate gallery too?
                // The current implementation closes or stays.
                // Let's keep it simple: Escape closes.
                if (e.key === "Escape") closeFullscreenMedia();
                if (e.key === "ArrowLeft") navigateFullscreen(-1);
                if (e.key === "ArrowRight") navigateFullscreen(1);
                return;
            }

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                if (currentSlideIndex > 0) goToSlide(currentSlideIndex - 1);
            }
            if (e.key === "ArrowRight") {
                e.preventDefault();
                if (currentSlideIndex < activeGalleryImages.length - 1) goToSlide(currentSlideIndex + 1);
            }
        });

        // Initialize first slide preload (images)
        preloadSlide(0);
        preloadSlide(1);

        // --- Auto-Play Interval (Slideshow) ---
        // Instagram does NOT auto-advance if video is long.
        // For mixed content, usually we wait X seconds or video end.
        // Let's keep the existing 10s interval but pause it if video is playing?
        // Or just keep it simple: 10s interval unless interacted.

        let autoPlayInterval;
        const AUTO_PLAY_DELAY = 10000;

        function startAutoPlay() {
            stopAutoPlay();
            autoPlayInterval = setInterval(() => {
                const total = activeGalleryImages.length;
                if (!total || total <= 1) return;

                // Check if current slide is a playing video
                const currentSlide = carouselEls.track.children[currentSlideIndex];
                const video = currentSlide?.querySelector('video');

                // Stop auto-advance if a video is present (user request)
                // Whether playing or paused, we don't interrupt the video experience.
                if (video) {
                    return;
                }

                let nextIndex = currentSlideIndex + 1;
                if (nextIndex >= total) {
                    nextIndex = 0; // Loop back
                    // But goToSlide logic above prevents wrapping on click.
                    // AutoPlay usually loops.
                }

                // Allow wrapping for autoplay
                if (nextIndex === 0) {
                    stopAllVideosInTrack();
                    currentSlideIndex = 0;
                    updateCarouselUI();
                    playCurrentVideo();
                } else {
                    goToSlide(nextIndex);
                }

            }, AUTO_PLAY_DELAY);
        }

        function stopAutoPlay() {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
        }

        function resetAutoPlay() {
            stopAutoPlay();
            startAutoPlay();
        }

        startAutoPlay();

        // Stop/Reset on interaction
        container.addEventListener('pointerdown', resetAutoPlay);
        container.addEventListener('keydown', resetAutoPlay);
        // Note: clicks on buttons handled by goToSlide calling resetAutoPlay
        if (carouselEls.dots) carouselEls.dots.addEventListener('click', resetAutoPlay);

        return {
            destroy: () => {
                stopAutoPlay();
            }
        };
    }

    global.ProjectCarousel = { init: initProjectCarousel };

})(window);
