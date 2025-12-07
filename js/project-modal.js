(function (global) {
    function encodePathSegments(path) {
        if (!path) return "";
        if (/^https?:\/\//i.test(path)) return path;
        return path.split('/').map(seg => encodeURIComponent(seg)).join('/');
    }

    function normalizeKey(str) {
        return (str || "")
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function initProjectModal(options = {}) {
        const carouselEls = options.carouselEls || {};
        const modalEls = {
            modal: document.getElementById("modal"),
            title: document.getElementById("modalTitle"),
            meta: document.getElementById("modalMeta"),
            text: document.getElementById("modalText"),
            website: document.getElementById("modalWebsite"),
            tags: document.getElementById("modalTags"),
        };
        const NAV_BTN_CLASS = "absolute top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-md text-[#111] dark:text-white transition";
        const DOT_CLASS = "rounded-full transition-all duration-300 w-2.5 h-2.5 bg-[#D7D0FA] dark:bg-[#2C2744]";
        const DOT_ACTIVE_CLASS = "rounded-full transition-all duration-300 w-6 h-2.5 bg-[#411FEB] dark:bg-[#5536ED]";

        function getDotColors() {
            const isDark = document.documentElement.classList.contains("dark");
            return {
                base: isDark ? "#2C2744" : "#D7D0FA",
                active: isDark ? "#5536ED" : "#411FEB",
            };
        }

        function applyDotStyles(btn, isActive) {
            const colors = getDotColors();
            btn.style.width = "10px";
            btn.style.height = "10px";
            btn.style.borderRadius = "9999px";
            btn.style.backgroundColor = isActive ? colors.active : colors.base;
            btn.style.transition = "all 0.3s ease";
            btn.style.flexShrink = "0";
            btn.style.opacity = "1";
        }

        // Retire le bouton obsolète s'il existe encore dans le DOM
        document.getElementById("modalButton")?.remove();

        let activeGalleryImages = [];
        let currentSlideIndex = 0;
        let resultsManifestPromise = null;
        let fullscreenOverlay = null;
        let fullscreenImage = null;
        let touchStartX = null;
        let touchStartY = null;
        const swipeThreshold = 40;
        const wheelThreshold = 25;
        const wheelDebounceMs = 220;
        let lastWheelTs = 0;
        let pointerStartX = null;
        let pointerStartY = null;
        let currentProjectTitle = "";
        let overlaySwipeConsumed = false;
        let fullscreenZoomed = false;
        let fullscreenPanX = 0;
        let fullscreenPanY = 0;
        let fullscreenPointerId = null;
        let fullscreenDragStart = null;

        async function getResultsManifest() {
            if (resultsManifestPromise) return resultsManifestPromise;
            resultsManifestPromise = fetch('/media/projects/results/manifest.json', { cache: 'no-cache' })
                .then(res => res.ok ? res.json() : {})
                .then(raw => {
                    const normalized = {};
                    Object.entries(raw || {}).forEach(([key, list]) => {
                        const nk = normalizeKey(key);
                        if (!nk) return;
                        normalized[nk] = (list || []).map(rel => encodePathSegments(`/media/projects/results/${rel}`));
                    });
                    return normalized;
                })
                .catch(() => ({}));
            return resultsManifestPromise;
        }

        function deriveGalleryFolder(project) {
            if (!project) return null;
            if (project.galleryFolder) return project.galleryFolder.replace(/\/$/, '');
            if (!project.image) return null;
            const match = project.image.match(/\/([^/]+)\.[a-zA-Z0-9]+$/);
            if (!match) return null;
            return `/media/projects/${match[1]}`;
        }

        async function fetchGalleryManifest(folder) {
            const base = folder.endsWith('/') ? folder.slice(0, -1) : folder;
            try {
                const res = await fetch(`${base}/gallery.json`, { cache: 'no-cache' });
                if (res.ok) {
                    const files = await res.json();
                    if (Array.isArray(files) && files.length) {
                        return files
                            .filter(Boolean)
                            .map(file => {
                                const asString = String(file);
                                if (/^https?:\/\//i.test(asString) || asString.startsWith('/')) return asString;
                                const cleanFile = asString.replace(/^\/+/, '');
                                return encodePathSegments(`${base}/${cleanFile}`);
                            });
                    }
                }
        } catch (e) {
            console.info('Gallery not found for', base);
        }
        return [];
    }

        async function resolveGallerySources(project) {
            if (!project) return { images: [], source: "fallback" };
            const folder = deriveGalleryFolder(project);

            if (Array.isArray(project.gallery) && project.gallery.length) {
                const mapped = project.gallery
                    .filter(Boolean)
                    .map(src => {
                        if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src;
                        if (!folder) return encodePathSegments(src);
                        const normalizedFolder = folder.endsWith('/') ? folder.slice(0, -1) : folder;
                        const cleanSrc = src.replace(/^\/+/, '');
                        return encodePathSegments(`${normalizedFolder}/${cleanSrc}`);
                    });
                return { images: mapped, source: "project" };
            }

            const resultsManifest = await getResultsManifest();
            const normalizedTitle = normalizeKey(project.title);
            if (normalizedTitle && resultsManifest[normalizedTitle]?.length) {
                return { images: resultsManifest[normalizedTitle], source: "results" };
            }

            if (folder) {
                const manifest = await fetchGalleryManifest(folder);
                if (manifest.length) return { images: manifest, source: "manifest" };
            }

            return { images: project.image ? [project.image] : [], source: "fallback" };
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

        function ensureFullscreenOverlay() {
            if (fullscreenOverlay && fullscreenImage) return;

            fullscreenOverlay = document.createElement("div");
            fullscreenOverlay.id = "modalImageFullscreen";
            // Superposer au-dessus de tout et couvrir 100% du viewport avec assombrissement (inline pour compatibilité)
            fullscreenOverlay.className = "fixed inset-0 w-screen h-screen flex items-center justify-center px-4 z-[100000] hidden";
            fullscreenOverlay.style.zIndex = "100000";
            fullscreenOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
            fullscreenOverlay.setAttribute("aria-hidden", "true");
            fullscreenOverlay.addEventListener("click", (e) => {
                if (overlaySwipeConsumed) {
                    overlaySwipeConsumed = false;
                    e.stopPropagation();
                    return;
                }
                closeFullscreenImage();
            });

            const closeBtn = document.createElement("button");
            closeBtn.type = "button";
            closeBtn.className = "text-white text-2xl hover:scale-110 transition flex items-center justify-center w-10 h-10 rounded-full";
            closeBtn.style.position = "absolute";
            closeBtn.style.top = "20px";
            closeBtn.style.right = "20px";
            closeBtn.style.zIndex = "100001";
            closeBtn.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
            closeBtn.style.backdropFilter = "blur(6px)";
            closeBtn.innerHTML = "<i class='bx bx-x'></i>";
            closeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                closeFullscreenImage();
            });

            fullscreenImage = document.createElement("img");
            fullscreenImage.className = "max-h-[90vh] max-w-[90vw] object-contain shadow-2xl";
            fullscreenImage.alt = "";
            fullscreenImage.draggable = false;
            fullscreenImage.style.userSelect = "none";
            fullscreenImage.style.cursor = "zoom-in";
            fullscreenImage.addEventListener("click", (e) => e.stopPropagation());
            fullscreenImage.addEventListener("dblclick", (e) => {
                e.preventDefault();
                toggleFullscreenZoom(e);
            });
            fullscreenImage.addEventListener("pointerdown", onFullscreenPointerDown);
            fullscreenImage.addEventListener("pointermove", onFullscreenPointerMove);
            fullscreenImage.addEventListener("pointerup", endFullscreenPointer);
            fullscreenImage.addEventListener("pointercancel", endFullscreenPointer);
            fullscreenImage.addEventListener("pointerleave", endFullscreenPointer);

            fullscreenOverlay.appendChild(fullscreenImage);
            fullscreenOverlay.appendChild(closeBtn);
            document.body.appendChild(fullscreenOverlay);
            attachSwipeHandlers(fullscreenOverlay);
        }

        function openFullscreenImage(src, alt) {
            if (!src) return;
            ensureFullscreenOverlay();
            resetFullscreenZoom();
            fullscreenImage.src = src;
            fullscreenImage.alt = alt || "";
            fullscreenOverlay.classList.remove("hidden");
            fullscreenOverlay.setAttribute("aria-hidden", "false");
            overlaySwipeConsumed = false;
            clearAutoAdvance();
            refreshFullscreenImage();
        }

        function closeFullscreenImage(shouldResumeAuto = true) {
            if (!fullscreenOverlay || !fullscreenImage) return;
            fullscreenOverlay.classList.add("hidden");
            fullscreenOverlay.setAttribute("aria-hidden", "true");
            fullscreenImage.src = "";
            overlaySwipeConsumed = false;
            resetFullscreenZoom();
            if (modalEls.modal?.classList.contains("hidden")) {
                document.body.classList.remove("overflow-hidden");
            } else if (shouldResumeAuto) {
                scheduleAutoAdvance();
            }
        }

        function resetFullscreenZoom() {
            fullscreenZoomed = false;
            fullscreenPanX = 0;
            fullscreenPanY = 0;
            fullscreenPointerId = null;
            fullscreenDragStart = null;
            if (!fullscreenImage) return;
            fullscreenImage.style.transformOrigin = "center center";
            fullscreenImage.style.transform = "translate(0px, 0px) scale(1)";
            fullscreenImage.style.cursor = "zoom-in";
        }

        function applyFullscreenTransform() {
            if (!fullscreenImage) return;
            const scale = fullscreenZoomed ? 2 : 1;
            fullscreenImage.style.transform = `translate(${fullscreenPanX}px, ${fullscreenPanY}px) scale(${scale})`;
        }

        function toggleFullscreenZoom(event) {
            if (!fullscreenImage) return;
            if (!fullscreenZoomed) {
                const rect = fullscreenImage.getBoundingClientRect();
                const originX = ((event?.clientX ?? rect.left + rect.width / 2) - rect.left) / rect.width * 100;
                const originY = ((event?.clientY ?? rect.top + rect.height / 2) - rect.top) / rect.height * 100;
                fullscreenImage.style.transformOrigin = `${originX}% ${originY}%`;
                fullscreenZoomed = true;
                fullscreenPanX = 0;
                fullscreenPanY = 0;
                fullscreenImage.style.cursor = "grab";
                applyFullscreenTransform();
                return;
            }
            resetFullscreenZoom();
        }

        function onFullscreenPointerDown(e) {
            if (!fullscreenZoomed || e.button !== 0) return;
            fullscreenPointerId = e.pointerId;
            fullscreenDragStart = { x: e.clientX, y: e.clientY, panX: fullscreenPanX, panY: fullscreenPanY };
            fullscreenImage?.setPointerCapture(fullscreenPointerId);
            fullscreenImage.style.cursor = "grabbing";
        }

        function onFullscreenPointerMove(e) {
            if (!fullscreenZoomed || fullscreenPointerId !== e.pointerId || !fullscreenDragStart) return;
            const dx = e.clientX - fullscreenDragStart.x;
            const dy = e.clientY - fullscreenDragStart.y;
            fullscreenPanX = fullscreenDragStart.panX + dx;
            fullscreenPanY = fullscreenDragStart.panY + dy;
            applyFullscreenTransform();
        }

        function endFullscreenPointer(e) {
            if (fullscreenPointerId === null || e.pointerId !== fullscreenPointerId) return;
            fullscreenPointerId = null;
            fullscreenDragStart = null;
            if (!fullscreenImage) return;
            fullscreenImage.releasePointerCapture?.(e.pointerId);
            fullscreenImage.style.cursor = fullscreenZoomed ? "grab" : "zoom-in";
        }

        function clearAutoAdvance() {
            // auto-advance désactivé
        }

        function scheduleAutoAdvance() {
            // auto-advance désactivé
        }

        function renderCarousel(images, projectTitle) {
            if (!carouselEls.container || !carouselEls.track || !carouselEls.dots) return;

            carouselEls.track.innerHTML = "";
            carouselEls.dots.innerHTML = "";
            activeGalleryImages = (images || []).filter(Boolean);
            currentSlideIndex = 0;
            carouselEls.track.style.transform = "translateX(0%)";
            const totalSlides = activeGalleryImages.length || 1;
            carouselEls.track.style.width = `${totalSlides * 100}%`;
            carouselEls.track.style.height = "100%";
            if (carouselEls.prev) carouselEls.prev.className = `${NAV_BTN_CLASS} left-3`;
            if (carouselEls.next) carouselEls.next.className = `${NAV_BTN_CLASS} right-3`;

            if (!activeGalleryImages.length) {
                carouselEls.container.classList.add("hidden");
                carouselEls.counter?.classList.add("hidden");
                return;
            }

            activeGalleryImages.forEach((src, idx) => {
                const slide = document.createElement("div");
                // Slide pleine hauteur, fond sombre façon Instagram
                slide.className = "flex-none aspect-[4/3] self-start flex items-center justify-center bg-black dark:bg-[#E8E4FC] overflow-hidden";
                const basis = 100 / totalSlides;
                slide.style.flex = `0 0 ${basis}%`;
                slide.style.width = `${basis}%`;
                const isMobile = window.matchMedia("(max-width: 1023px)").matches;
                slide.style.maxHeight = isMobile ? "50vh" : "70vh"; // limite plus bas sur mobile pour laisser voir le texte

                const img = document.createElement("img");
                img.dataset.src = src;
                const fileName = extractFileName(src);
                img.alt = fileName ? `${projectTitle} - ${fileName}` : `${projectTitle} - visuel ${idx + 1}`;
                img.loading = "lazy";
                img.decoding = "async";
                img.sizes = "(min-width: 1024px) 60vw, 90vw";
                // Image centrée avec letterbox si nécessaire
                // Ne jamais dépasser le cadre, sans étirer : on limite largeur/hauteur et laisse le ratio
                img.className = "w-auto h-auto max-h-full max-w-full object-contain opacity-0 transition-opacity duration-300";
                img.draggable = false;
                img.style.userSelect = "none";
                img.style.maxHeight = "100%";
                img.style.maxWidth = "100%";
                img.style.height = "auto";
                img.style.width = "auto";
                // Charge seulement la première tout de suite, les autres à la demande
                if (idx === 0) {
                    img.src = src;
                }
                img.addEventListener("click", () => {
                    const srcToShow = img.src || img.dataset.src || "";
                    if (srcToShow) openFullscreenImage(srcToShow, img.alt);
                });
                img.addEventListener("load", () => {
                    img.classList.remove("opacity-0");
                });
                img.addEventListener("error", () => img.classList.add("opacity-40"));
                slide.appendChild(img);

                carouselEls.track.appendChild(slide);
            });

            if (carouselEls.dots) {
                carouselEls.dots.style.minHeight = "16px";
            }
            carouselEls.container.classList.remove("hidden");
            renderDots(totalSlides);
            preloadSlide(0);
            preloadSlide(1);
            goToSlide(0);
        }

        function renderDots(total) {
            if (!carouselEls.dots) return;
            carouselEls.dots.innerHTML = "";
            if (total <= 1) return;

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
                applyDotStyles(btn, i === currentSlideIndex);
                btn.addEventListener("click", () => goToSlide(i));
                carouselEls.dots.appendChild(btn);
            }
        }

        function updateCarouselUI(totalSlides) {
            if (!carouselEls.track) return;
            const total = totalSlides || activeGalleryImages.length;
            const offset = total > 0 ? -(currentSlideIndex * (100 / total)) : 0;
            carouselEls.track.style.transform = `translateX(${offset}%)`;

            renderDots(total);

            if (carouselEls.counter) {
                carouselEls.counter.textContent = `${currentSlideIndex + 1} / ${total}`;
                carouselEls.counter.classList.toggle("hidden", total <= 1);
            }

            if (carouselEls.prev && carouselEls.next) {
                const hidePrev = total <= 1 || currentSlideIndex === 0;
                const hideNext = total <= 1 || currentSlideIndex === total - 1;
                carouselEls.prev.classList.toggle("hidden", hidePrev);
                carouselEls.next.classList.toggle("hidden", hideNext);
                carouselEls.prev.disabled = false;
                carouselEls.next.disabled = false;
            }
        }

        function preloadSlide(index) {
            if (!carouselEls.track) return;
            const slides = carouselEls.track.children;
            const total = slides.length;
            if (!total) return;
            const normalized = ((index % total) + total) % total;
            const img = slides[normalized]?.querySelector("img");
            if (!img) return;
            if (img.getAttribute("src")) return;
            const srcToLoad = img.dataset.src;
            if (!srcToLoad) return;
            img.src = srcToLoad;
        }

        function goToSlide(index) {
            if (!activeGalleryImages.length || !carouselEls.track) return;
            const total = activeGalleryImages.length;
            const clamped = Math.min(Math.max(index, 0), total - 1);
            if (clamped === currentSlideIndex && (index < 0 || index >= total)) return;
            currentSlideIndex = clamped;
            preloadSlide(clamped);
            preloadSlide(clamped + 1);
            preloadSlide(clamped - 1);
            updateCarouselUI(total);
            refreshFullscreenImage();
        }

        function refreshFullscreenImage() {
            if (!fullscreenOverlay || !fullscreenImage || fullscreenOverlay.classList.contains("hidden")) return;
            const src = activeGalleryImages[currentSlideIndex];
            if (!src) return;
            resetFullscreenZoom();
            fullscreenImage.src = src;
            fullscreenImage.alt = currentProjectTitle
                ? `${currentProjectTitle} - visuel ${currentSlideIndex + 1}`
                : "";
        }

        function processSwipe(dx, dy, sourceEl) {
            if (!activeGalleryImages.length) return;
            if (Math.abs(dx) <= Math.abs(dy)) return;
            if (Math.abs(dx) < swipeThreshold) return;
            if (dx < 0) {
                goToSlide(currentSlideIndex + 1);
            } else {
                goToSlide(currentSlideIndex - 1);
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

            // Trackpad / souris (scroll horizontal)
            element.addEventListener("wheel", (e) => {
                const now = Date.now();
                if (now - lastWheelTs < wheelDebounceMs) return;
                if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
                if (Math.abs(e.deltaX) < wheelThreshold) return;
                lastWheelTs = now;
                e.preventDefault();
                if (e.deltaX > 0) {
                    goToSlide(currentSlideIndex + 1);
                } else {
                    goToSlide(currentSlideIndex - 1);
                }
            }, { passive: false });
        }

        async function openModal(project) {
            if (!project || !modalEls.modal) return;

            clearAutoAdvance();
            currentProjectTitle = project.title || "";
            modalEls.title.textContent = project.title;
            modalEls.text.innerHTML = project.text.replace(/\n/g, "<br>");

            const { images: gallerySources, source: gallerySourceType } = await resolveGallerySources(project);
            const heroImage = gallerySources[0] || project.image;

            const formattedDate = project.date ? new Date(project.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long" }) : "";
            const type = project.type ? project.type.charAt(0).toUpperCase() + project.type.slice(1) : "";
            const typeNormalized = (project.type || "").toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const context = project.context || "";

            modalEls.meta.innerHTML = `
        <div class="flex items-center gap-1 text-[#121212] dark:text-white text-sm">
            <i class="bx bxs-calendar-alt text-[#411FEB] dark:text-[#5536ED] opacity-[0.48] text-base"></i>
            <span>${formattedDate || "Date inconnue"}</span>
            ${type ? `<span class="mx-1 text-[#411FEB] dark:text-[#5536ED] opacity-[0.48]">&middot;</span><span>${type}</span>` : ""}
            ${context ? `<span class="mx-1 text-[#411FEB] dark:text-[#5536ED] opacity-[0.48]">&middot;</span><span>${context}</span>` : ""}
        </div>`;

            modalEls.tags.innerHTML = "";
            project.tags?.forEach(tag => {
                const span = document.createElement("span");
                span.className =
                    "inline-flex items-center gap-1 px-2 rounded-full border border-[#411FEB] text-[#411FEB] dark:text-[#5536ED] font-medium text-sm";
                span.style.backgroundColor = "rgba(65, 31, 235, 0.12)"; // fallback pour le fond
                span.innerHTML = `<i class='${tag.icon} text-base'></i> ${tag.name}`;
                modalEls.tags.appendChild(span);
            });

            const hasGallery = gallerySources.length > 0;

            const rawLink = (project.projectLink || "").trim();
            const hasLink = !!rawLink && rawLink !== "#";
            const link = hasLink ? rawLink : "#";
            const websiteLabel = typeNormalized.includes("app") || typeNormalized.includes("mobile")
                ? "Voir l'application"
                : "Visiter le site web";

            if (modalEls.website) {
                if (hasLink) {
                    modalEls.website.href = link;
                    modalEls.website.classList.remove("hidden");
                    modalEls.website.innerHTML = `<i class='bx bx-globe'></i> ${websiteLabel}`;
                } else {
                    modalEls.website.classList.add("hidden");
                    modalEls.website.removeAttribute("href");
                }
            }
            renderCarousel(hasGallery ? gallerySources : (heroImage ? [heroImage] : []), project.title);

            modalEls.modal.classList.remove("hidden");
            document.body.classList.add("overflow-hidden");
            scheduleAutoAdvance();

            const newUrl = `?project=${project.id}`;
            window.history.replaceState(null, '', newUrl);
        }

        function closeModal() {
            clearAutoAdvance();
            document.body.classList.remove("overflow-hidden");
            closeFullscreenImage(false);
            modalEls.modal?.classList.add("hidden");
            carouselEls.track?.replaceChildren();
            carouselEls.dots?.replaceChildren();
            carouselEls.container?.classList.add("hidden");
            carouselEls.counter?.classList.add("hidden");
            activeGalleryImages = [];
            currentSlideIndex = 0;
            currentProjectTitle = "";
            window.history.replaceState(null, '', window.location.pathname);
        }

        carouselEls.prev?.addEventListener("click", () => goToSlide(currentSlideIndex - 1));
        carouselEls.next?.addEventListener("click", () => goToSlide(currentSlideIndex + 1));
        modalEls.modal?.querySelector('.bx-x')?.addEventListener('click', closeModal);
        attachSwipeHandlers(carouselEls.track);
        document.addEventListener("keydown", (e) => {
            const modalOpen = !!modalEls.modal && !modalEls.modal.classList.contains("hidden");
            if (!modalOpen) return;
            if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                const delta = e.key === "ArrowLeft" ? -1 : 1;
                goToSlide(currentSlideIndex + delta);
                return;
            }
            if (e.key === "Escape") {
                if (fullscreenOverlay && !fullscreenOverlay.classList.contains("hidden")) {
                    closeFullscreenImage();
                } else {
                    closeModal();
                }
            }
        });
        global.closeModal = closeModal;

        return { openModal, closeModal };
    }

    global.ProjectModal = { init: initProjectModal };
})(window);






