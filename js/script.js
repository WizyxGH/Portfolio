document.addEventListener("DOMContentLoaded", function () {
    const showMoreButton = document.getElementById("showMoreButton");
    const showLessButton = document.getElementById("showLessButton");
    const searchInput = document.getElementById('searchInput');
    const clearSearchButton = document.getElementById('clearSearch');
    const filtersContainer = document.getElementById('filtersContainer');
    const container = document.getElementById("projectsContainer");
    if (!container) return; // Si pas de container, on arrête (ex: page projet)

    let projects = [];
    let projectsVisible = 9;
    let filteredProjects = [];
    let allCards = [];
    let currentSort = 'meilleur'; // 'meilleur' (par id) ou 'date'
    let selectedTypes = new Set();
    let selectedTags = new Set();

    let scrollAnimationObserver = null;
    let rowDelayMap = new Map();

    function initScrollAnimationObserver() {
        if (scrollAnimationObserver) return;
        scrollAnimationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const rowKey = Math.round(entry.target.getBoundingClientRect().top).toString();
                    const count = rowDelayMap.get(rowKey) || 0;
                    const delay = Math.min(count * 120, 360); // cascade within a row
                    entry.target.style.transitionDelay = `${delay}ms`;
                    entry.target.style.transitionDuration = '0.45s';
                    rowDelayMap.set(rowKey, count + 1);
                    entry.target.classList.add('show');
                    scrollAnimationObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
    }

    function registerScrollAnimation(el) {
        if (!el) return;
        initScrollAnimationObserver();
        // Classes animation sont déjà dans le HTML, on observe juste
        scrollAnimationObserver.observe(el);
    }

    // Slugs helper pour les suggestions de recherche
    function slugify(text) {
        return text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    }

    // --- Chargement du fichier JSON (pour les filtres et la recherche) ---
    console.log("Fetching /js/projects.json...");
    fetch('/js/projects.json')
        .then(res => {
            console.log("Fetch response:", res.status);
            if (!res.ok) throw new Error("Impossible de charger projects.json");
            return res.json();
        })
        .then(data => {
            console.log("Data loaded:", data.length, "items");
            projects = data;

            // Définir le scope des projets selon la page (pour les filtres)
            const path = window.location.pathname;
            if (path.includes('creations_studies')) filteredProjects = projects.filter(p => p.id >= 27 && p.id <= 34);
            else if (path.includes('creations')) filteredProjects = projects.filter(p => p.id >= 1 && p.id <= 26);
            else filteredProjects = [...projects];

            if (searchInput)
                searchInput.placeholder = `Rechercher parmi ${filteredProjects.length} projet${filteredProjects.length > 1 ? 's' : ''}`;

            // Récupérer les cartes statiques générées par Jekyll
            allCards = Array.from(container.querySelectorAll(".projectCard"));
            console.log("Found static cards:", allCards.length);

            // Initialiser l'animation sur les cartes existantes
            rowDelayMap.clear();
            allCards.forEach(card => {
                registerScrollAnimation(card);
            });

            generateFilters();
            sortAndRenderCards(); // Tri initial (aussi masque ceux qui doivent l'être)
            lazyLoadImages();

            // Gestion de l'URL query param 'project' obsolète ou pour redirection
            // On pourrait rediriger si on détecte ?project=X, mais laissez tel quel pour l'instant.
        })
        .catch(err => {
            console.error("Error loading projects:", err);
        });

    function generateFilters() {
        if (!filtersContainer) return;
        filtersContainer.innerHTML = '';

        // 1. Compter les occurrences pour le tri
        const typeCounts = new Map();
        const tagCounts = new Map();
        const tagIcons = new Map(); // Nom -> Icone

        filteredProjects.forEach(p => {
            if (p.type) {
                typeCounts.set(p.type, (typeCounts.get(p.type) || 0) + 1);
            }
            if (p.tags) {
                p.tags.forEach(t => {
                    tagCounts.set(t.name, (tagCounts.get(t.name) || 0) + 1);
                    if (!tagIcons.has(t.name)) {
                        tagIcons.set(t.name, t.icon);
                    }
                });
            }
        });

        // 2. Créer l'UI pour les Types
        if (typeCounts.size > 0) {
            const typeGroup = document.createElement('div');
            typeGroup.className = 'flex gap-2 overflow-x-auto pb-2';
            typeGroup.style.scrollbarWidth = 'none';
            typeGroup.style.msOverflowStyle = 'none';

            Array.from(typeCounts.keys())
                .sort((a, b) => typeCounts.get(b) - typeCounts.get(a))
                .forEach(type => {
                    const btn = document.createElement('button');
                    btn.className = `h-10 px-4 rounded-full border border-white/20 text-sm font-medium transition bg-white/10 hover:bg-white/20 text-white flex-shrink-0 flex items-center justify-center`;
                    btn.textContent = type;
                    btn.onclick = () => toggleFilter(btn, type, 'type');
                    typeGroup.appendChild(btn);
                });
            filtersContainer.appendChild(typeGroup);
        }

        // 3. Créer l'UI pour les Tags
        if (tagCounts.size > 0) {
            const tagGroup = document.createElement('div');
            tagGroup.className = 'flex gap-2 overflow-x-auto pb-2';
            tagGroup.style.scrollbarWidth = 'none';
            tagGroup.style.msOverflowStyle = 'none';

            Array.from(tagCounts.keys())
                .sort((a, b) => tagCounts.get(b) - tagCounts.get(a))
                .forEach(tagName => {
                    const tagIcon = tagIcons.get(tagName);
                    const btn = document.createElement('button');
                    btn.className = `h-10 px-4 rounded-full border border-white/20 text-sm font-medium transition bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 flex-shrink-0 justify-center`;
                    btn.innerHTML = `<i class='${tagIcon} text-lg'></i> ${tagName}`;
                    btn.onclick = () => toggleFilter(btn, tagName, 'tag');
                    tagGroup.appendChild(btn);
                });
            filtersContainer.appendChild(tagGroup);
        }
    }

    function toggleFilter(btn, value, category) {
        const set = category === 'type' ? selectedTypes : selectedTags;

        if (set.has(value)) {
            set.delete(value);
        } else {
            set.add(value);
        }

        const baseClasses = "h-10 px-4 rounded-full text-sm transition flex-shrink-0 flex items-center justify-center";
        const layoutClasses = category === 'tag' ? " gap-2" : "";

        if (set.has(value)) {
            btn.className = `${baseClasses}${layoutClasses} border border-white font-bold bg-white text-[#411FEB] shadow-lg`;
        } else {
            btn.className = `${baseClasses}${layoutClasses} border border-white/20 font-medium bg-white/10 hover:bg-white/20 text-white`;
        }

        updateProjects();
    }


    // --- Lazy loading ---
    function lazyLoadImages() {
        // Les images ont déjà loading="lazy" en HTML natif, mais on garde le fallback si besoin
        // ou si on utilise data-src. Liquid output src directement, donc lazy-img class n'est plus là par défaut
        // Sauf si on l'ajoute. Pour simplifier, on laisse le natif gérer si src est présent.
        // Si besoin d'animation d'apparition:
        const imgs = document.querySelectorAll("img[loading='lazy']");
        imgs.forEach(img => {
            img.onload = () => img.classList.remove('opacity-0');
            // note: liquid template doesn't seem to set opacity-0 on img directly, but parent container might.
        });
    }

    // --- Update affichage ---
    function updateProjects() {
        const query = searchInput?.value.toLowerCase() || "";

        // On filtre les cartes existantes
        const matchingCards = allCards.filter(card => {
            const title = (card.dataset.title || "").toLowerCase();
            const description = (card.dataset.description || "").toLowerCase();
            const text = (card.dataset.text || "").toLowerCase();

            const matchesSearch = !query || title.includes(query) || description.includes(query) || text.includes(query);

            const cardType = card.dataset.type;
            const matchesType = selectedTypes.size === 0 || selectedTypes.has(cardType);

            const cardTags = (card.dataset.tags || "").split(",");
            const matchesTags = selectedTags.size === 0 || cardTags.some(tag => selectedTags.has(tag));

            return matchesSearch && matchesType && matchesTags;
        });

        const totalMatches = matchingCards.length;
        let visibleCount = 0;

        // Affichage / Masquage
        allCards.forEach(card => {
            if (matchingCards.includes(card)) {
                if (visibleCount < projectsVisible) {
                    card.classList.remove("hidden");
                    // Ré-appliquer animation si besoin ? 
                    visibleCount++;
                } else {
                    card.classList.add("hidden");
                }
            } else {
                card.classList.add("hidden");
            }
        });

        // Gestion de la "Card vide" (Aucun résultat)
        let emptyCard = document.getElementById("emptyProjectCard");
        if (totalMatches === 0) {
            if (!emptyCard) {
                emptyCard = document.createElement("div");
                emptyCard.id = "emptyProjectCard";
                emptyCard.className = "projectCard animate-on-scroll opacity-0 translate-y-10 transition-all duration-600 bg-white rounded-lg text-left border-8 border-white hover:bg-[#EDE9FE] dark:hover:bg-[#EDE9FE] cursor-default";
                emptyCard.innerHTML = `
                    <div class="h-40 mb-3 rounded-lg bg-[rgba(65,31,235,0.12)] border-2 border-dashed border-[#411FEB] flex items-center justify-center overflow-hidden">
                        <img src="/media/projects/projectnoresult.svg" alt="Aucun projet trouvé" class="h-64 w-64">
                    </div>
                    <h3 class="text-lg font-semibold text-[#411FEB] dark:text-[#5536ED] mb-1">Aucun projet trouvé...</h3>
                    <p class="text-sm text-[#121212] dark:text-white mt-2 mb-4">
                        Peut-être en rechercheriez-vous un autre ? Sinon, rassurez-vous, il ne me fait pas peur !
                    </p>
                    <a href="/services" class="inline-flex items-center gap-2 bg-[#411FEB] text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#3216C9] transition">
                        <i class='bx bx-handshake text-base'></i>
                        On le crée ensemble ?
                    </a>
                `;
                container.appendChild(emptyCard);
                registerScrollAnimation(emptyCard);
            }
        } else if (emptyCard) emptyCard.remove();

        // Gestion boutons Voir plus/moins
        if (!showMoreButton || !showLessButton) return;

        if (totalMatches <= 9) {
            showMoreButton.classList.add("hidden");
            showLessButton.classList.add("hidden");
        } else if (projectsVisible >= totalMatches) {
            showMoreButton.classList.add("hidden");
            showLessButton.classList.remove("hidden");
        } else {
            showMoreButton.classList.remove("hidden");
            showLessButton.classList.add("hidden");
        }
    }

    // --- Events ---
    searchInput?.addEventListener("input", () => {
        clearSearchButton?.classList.toggle('opacity-0', searchInput.value === '');
        clearSearchButton?.classList.toggle('pointer-events-none', searchInput.value === '');
        clearSearchButton?.classList.toggle('opacity-100', searchInput.value.length > 0);
        clearSearchButton?.classList.toggle('pointer-events-auto', searchInput.value.length > 0);
        projectsVisible = 9;
        updateProjects();
    });

    clearSearchButton?.addEventListener("click", () => {
        searchInput.value = '';
        projectsVisible = 9;
        updateProjects();
    });

    showMoreButton?.addEventListener("click", () => {
        projectsVisible = allCards.length;
        updateProjects();
    });

    showLessButton?.addEventListener("click", () => {
        projectsVisible = 9;
        updateProjects();
    });

    // --- Autosuggestions ---
    const suggestionsContainer = document.getElementById('suggestionsContainer');

    function parseProjectDate(p) {
        if (!p || !p.date) return 0;
        const d = Date.parse(p.date);
        if (!isNaN(d)) return d;
        const yearMatch = String(p.date).match(/(19|20)\d{2}/);
        if (yearMatch) return new Date(Number(yearMatch[0]), 0, 1).getTime();
        return 0;
    }

    function sortAndRenderCards() {
        // Note: Le tri est déjà fait partiellement par Jekyll (par ID), 
        // mais le tri dynamique peut changer l'ordre DOM.
        let sortedCards = [...allCards];

        // Map projectId to projects data for dates
        const getProjectData = (id) => projects.find(p => p.id == id);

        if (currentSort === 'date') {
            sortedCards.sort((a, b) => {
                const dateA = parseProjectDate(getProjectData(a.dataset.projectId));
                const dateB = parseProjectDate(getProjectData(b.dataset.projectId));
                return dateB - dateA;
            });
        } else { // 'meilleur' default (par id)
            sortedCards.sort((a, b) => (Number(a.dataset.projectId) || 0) - (Number(b.dataset.projectId) || 0));
        }

        // Réordonner le DOM
        // Attention: cela peut être coûteux, mais nécessaire pour le tri visuel
        // On n'efface pas tout, on appendChild (qui déplace l'élément existant)
        sortedCards.forEach(card => container.appendChild(card));

        // Reset animations state logic if needed?
        // Let's just update visibility
        updateProjects();
    }

    function sortProjects(list) {
        if (currentSort === 'date') return [...list].sort((a, b) => parseProjectDate(b) - parseProjectDate(a));
        return [...list].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    }

    searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        let matches = filteredProjects.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.text.toLowerCase().includes(q)
        );

        matches = sortProjects(matches);

        suggestionsContainer.innerHTML = '';
        if (q && matches.length) {
            const sortContainer = document.createElement('div');
            sortContainer.className = "relative flex items-center justify-between px-3 py-3 border-b border-[#E5E5E5] bg-white mb-2 rounded-t-lg";

            // ... (Code tri suggestions identique)
            const sortButton = document.createElement('button');
            sortButton.className = "flex items-center gap-2 px-4 py-2 rounded-lg border border-[#411FEB]/20 text-[#3E3E3E] bg-[#F9F8FF] hover:bg-[#F2EEFF] transition text-sm font-medium";

            const sortIcon = document.createElement('i');
            sortIcon.className = "bx bx-sort text-[#411FEB] dark:text-[#5536ED]";
            sortButton.appendChild(sortIcon);

            const sortLabel = document.createElement('span');
            sortLabel.innerHTML = `Trier par <span class="font-semibold">${currentSort === 'meilleur' ? 'Meilleur' : 'Date'}</span>`;
            sortButton.appendChild(sortLabel);

            const sortChevron = document.createElement('i');
            sortChevron.className = "bx bx-chevron-down text-[#411FEB] dark:text-[#5536ED]";
            sortButton.appendChild(sortChevron);

            const dropdown = document.createElement('div');
            dropdown.className = "absolute top-full left-0 mt-2 w-40 bg-white border border-[#E5E5E5] rounded-xl shadow-md hidden z-20";
            dropdown.innerHTML = `
                <button data-value="meilleur" class="block w-full text-left px-4 py-2 text-[#3E3E3E] hover:bg-[#EDE9FE] transition rounded-t-xl">Meilleur</button>
                <button data-value="date" class="block w-full text-left px-4 py-2 text-[#3E3E3E] hover:bg-[#EDE9FE] transition rounded-b-xl">Date</button>
            `;

            sortButton.addEventListener('click', e => {
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
            });

            dropdown.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    currentSort = btn.dataset.value;
                    sortLabel.innerHTML = `Trier par <span class="font-semibold">${currentSort === 'meilleur' ? 'Meilleur' : 'Date'}</span>`;
                    dropdown.classList.add('hidden');
                    sortAndRenderCards();
                    renderSuggestions(sortProjects(matches), sortContainer);
                });
            });

            document.addEventListener('click', e => {
                if (!sortButton.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.add('hidden');
            });

            sortContainer.append(sortButton, dropdown);
            suggestionsContainer.appendChild(sortContainer);

            function renderSuggestions(list, containerTop) {
                suggestionsContainer.innerHTML = '';
                suggestionsContainer.appendChild(containerTop);

                list.slice(0, 5).forEach(project => {
                    const div = document.createElement('div');
                    div.className = "flex items-center gap-2 p-2 hover:bg-[#EDE9FE] cursor-pointer transition-colors rounded-lg";
                    // Link vers la page projet
                    // On doit générer l'URL. 
                    const projectSlug = slugify(project.title);
                    const projectUrl = `/projects/${projectSlug}/`;

                    const link = document.createElement('a');
                    link.href = projectUrl;
                    link.className = "flex items-center gap-2 w-full text-inherit no-underline";

                    const img = document.createElement('img');
                    img.src = project.image;
                    img.alt = project.title;
                    img.width = 48;
                    img.height = 48;
                    img.className = "w-12 h-12 object-cover rounded-lg flex-shrink-0";
                    link.appendChild(img);

                    const textContainer = document.createElement('div');
                    textContainer.className = "flex flex-col sm:flex-row sm:items-center sm:gap-2 overflow-hidden";

                    const titleSpan = document.createElement('span');
                    titleSpan.className = "font-semibold text-[#3E3E3E] truncate max-w-[200px] sm:max-w-[250px]";
                    titleSpan.textContent = project.title;
                    textContainer.appendChild(titleSpan);

                    if (project.type) {
                        const typeSpan = document.createElement('span');
                        typeSpan.className = "text-[#3E3E3E] text-sm opacity-80 mt-0.5 sm:mt-0 flex items-center";
                        const separator = document.createElement('span');
                        separator.textContent = '•';
                        separator.style.color = '#411FEB';
                        separator.style.opacity = '0.48';
                        separator.className = "hidden sm:inline mx-1";
                        const typeText = document.createElement('span');
                        typeText.textContent = project.type.charAt(0).toUpperCase() + project.type.slice(1);
                        typeSpan.append(separator, typeText);
                        textContainer.appendChild(typeSpan);
                    }
                    link.appendChild(textContainer);
                    div.appendChild(link);

                    div.addEventListener('click', (e) => {
                        // Laisse le lien faire son travail ou force location
                        // window.location.href = projectUrl;
                    });
                    suggestionsContainer.appendChild(div);
                });
            }

            renderSuggestions(matches, sortContainer);
            suggestionsContainer.classList.remove('hidden');
        } else {
            suggestionsContainer.classList.add('hidden');
        }

        updateProjects();
    });

    document.addEventListener('click', e => {
        if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.classList.add('hidden');
        }
    });
});



// Global Animation Observer - Moved outside to ensure it runs independently or properly integrated
document.addEventListener("DOMContentLoaded", () => {
    // Check if we need to re-run observer on existing elements that might have been missed
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const targets = document.querySelectorAll('.animate-on-scroll');
    targets.forEach((el) => {
        observer.observe(el);
        // Fallback: if already visible or something blocked it, force show after a delay
        setTimeout(() => {
            // double check if it's still hidden? 
            // actually, let's just force it if needed via CSS fallback, but here we can't easily.
        }, 1000);
    });
});

