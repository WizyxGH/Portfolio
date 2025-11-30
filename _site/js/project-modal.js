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
            button: document.getElementById("modalButton"),
            website: document.getElementById("modalWebsite"),
            tags: document.getElementById("modalTags"),
        };

        let activeGalleryImages = [];
        let currentSlideIndex = 0;
        let resultsManifestPromise = null;

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

        function renderCarousel(images, projectTitle) {
            if (!carouselEls.container || !carouselEls.track || !carouselEls.dots) return;

            carouselEls.track.innerHTML = "";
            carouselEls.dots.innerHTML = "";
            activeGalleryImages = (images || []).filter(Boolean);
            currentSlideIndex = 0;

            if (!activeGalleryImages.length) {
                carouselEls.container.classList.add("hidden");
                carouselEls.counter?.classList.add("hidden");
                return;
            }

            activeGalleryImages.forEach((src, idx) => {
                const slide = document.createElement("div");
                slide.className = "min-w-full aspect-[4/3] flex items-center justify-center bg-[#121212] dark:bg-[#E8E4FC]";

                const img = document.createElement("img");
                img.dataset.src = src;
                img.alt = `${projectTitle} - visuel ${idx + 1}`;
                img.loading = "lazy";
                img.className = "w-full h-full object-contain opacity-0 transition-opacity duration-300";
                slide.appendChild(img);

                carouselEls.track.appendChild(slide);
            });

            carouselEls.container.classList.remove("hidden");
            goToSlide(0);
            preloadSlide(1);
        }

        function renderDots(total) {
            if (!carouselEls.dots) return;
            carouselEls.dots.innerHTML = "";
            if (total <= 1) return;

            const maxMain = 6;
            const mainCount = Math.min(total, maxMain);
            const windowStart = Math.max(0, Math.min(currentSlideIndex - Math.floor((mainCount - 1) / 2), total - mainCount));
            const windowEnd = Math.min(total - 1, windowStart + mainCount - 1);

            const hasLeftMore = windowStart > 0;
            const hasRightMore = windowEnd < total - 1;

            const createDot = (idx, isActive, isMini) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = [
                    "rounded-full transition-all duration-300",
                    isMini ? "w-2 h-2 bg-[#D7D0FA] dark:bg-[#2C2744] opacity-70" : "w-2.5 h-2.5 bg-[#D7D0FA] dark:bg-[#2C2744]"
                ].join(" ");
                if (!isMini && isActive) {
                    btn.classList.add("bg-[#411FEB]", "dark:bg-[#5536ED]", "w-6");
                    btn.classList.remove("bg-[#D7D0FA]", "dark:bg-[#2C2744]");
                }
                btn.addEventListener("click", () => goToSlide(idx));
                carouselEls.dots.appendChild(btn);
            };

            if (hasLeftMore) createDot(windowStart - 1, false, true);
            for (let i = windowStart; i <= windowEnd; i++) {
                createDot(i, i === currentSlideIndex, false);
            }
            if (hasRightMore) createDot(windowEnd + 1, false, true);
        }

        function updateCarouselUI(totalSlides) {
            if (!carouselEls.track) return;
            const total = totalSlides || activeGalleryImages.length;
            carouselEls.track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;

            renderDots(total);

            if (carouselEls.counter) {
                carouselEls.counter.textContent = `${currentSlideIndex + 1} / ${total}`;
                carouselEls.counter.classList.toggle("hidden", total <= 1);
            }

            if (carouselEls.prev && carouselEls.next) {
                const hideNav = total <= 1;
                carouselEls.prev.classList.toggle("hidden", hideNav);
                carouselEls.next.classList.toggle("hidden", hideNav);
                carouselEls.prev.disabled = currentSlideIndex === 0;
                carouselEls.next.disabled = currentSlideIndex === total - 1;
                carouselEls.prev.classList.toggle("opacity-40", currentSlideIndex === 0);
                carouselEls.next.classList.toggle("opacity-40", currentSlideIndex === total - 1);
            }
        }

        function preloadSlide(index) {
            if (!carouselEls.track) return;
            const slides = carouselEls.track.children;
            const total = slides.length;
            if (!total) return;
            const normalized = ((index % total) + total) % total;
            const img = slides[normalized]?.querySelector("img");
            if (img && !img.src) {
                img.src = img.dataset.src;
                img.onload = () => img.classList.remove("opacity-0");
                img.onerror = () => img.classList.add("opacity-40");
            }
        }

        function goToSlide(index) {
            if (!activeGalleryImages.length || !carouselEls.track) return;
            const total = activeGalleryImages.length;
            const clamped = Math.min(Math.max(index, 0), total - 1);
            if (clamped === currentSlideIndex && (index < 0 || index >= total)) return;
            currentSlideIndex = clamped;
            preloadSlide(currentSlideIndex);
            preloadSlide(currentSlideIndex + 1);
            updateCarouselUI(total);
        }

        async function openModal(project) {
            if (!project || !modalEls.modal) return;

            modalEls.title.textContent = project.title;
            modalEls.text.innerHTML = project.text.replace(/\n/g, "<br>");

            const { images: gallerySources, source: gallerySourceType } = await resolveGallerySources(project);
            const heroImage = gallerySources[0] || project.image;

            const formattedDate = project.date ? new Date(project.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long" }) : "";
            const type = project.type ? project.type.charAt(0).toUpperCase() + project.type.slice(1) : "";
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
                    "inline-flex items-center gap-1 px-2 rounded-full border border-[#411FEB] bg-[#411FEB] bg-opacity-[0.12] text-[#411FEB] dark:text-[#5536ED] font-medium";
                span.innerHTML = `<i class='${tag.icon} text-base'></i> ${tag.name}`;
                modalEls.tags.appendChild(span);
            });

            const hasGallery = gallerySources.length > 0;

            // Version sans conditions : on alimente toujours les deux boutons avec le lien (ou "#")
            const link = (project.projectLink || "#").trim() || "#";

            if (modalEls.website) {
                modalEls.website.href = link;
                modalEls.website.classList.remove("hidden");
                modalEls.website.innerHTML =
                    project.type === "app"
                        ? `<i class='bx bx-globe'></i> Voir l'application`
                        : `<i class='bx bx-globe'></i> Visiter le site web`;
            }

            if (modalEls.button) {
                modalEls.button.href = link;
                modalEls.button.classList.remove("hidden");
                modalEls.button.innerHTML = `<i class='bx bx-show'></i> Voir le r&eacute;sultat`;
            }

            renderCarousel(hasGallery ? gallerySources : (heroImage ? [heroImage] : []), project.title);

            modalEls.modal.classList.remove("hidden");
            document.body.classList.add("overflow-hidden");

            const newUrl = `?project=${project.id}`;
            window.history.replaceState(null, '', newUrl);
        }

        function closeModal() {
            document.body.classList.remove("overflow-hidden");
            modalEls.modal?.classList.add("hidden");
            carouselEls.track?.replaceChildren();
            carouselEls.dots?.replaceChildren();
            carouselEls.container?.classList.add("hidden");
            carouselEls.counter?.classList.add("hidden");
            activeGalleryImages = [];
            currentSlideIndex = 0;
            window.history.replaceState(null, '', window.location.pathname);
        }

        carouselEls.prev?.addEventListener("click", () => goToSlide(currentSlideIndex - 1));
        carouselEls.next?.addEventListener("click", () => goToSlide(currentSlideIndex + 1));
        document.querySelector('.bx-x')?.addEventListener('click', closeModal);
        global.closeModal = closeModal;

        return { openModal, closeModal };
    }

    global.ProjectModal = { init: initProjectModal };
})(window);
