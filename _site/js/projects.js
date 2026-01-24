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
    let selectedSuggestionIndex = -1;

    // Helper de style unifié pour TOUS les boutons (Filtres, Tri, Tags, Types)
    function getSharedBtnStyle(isActive) {
        return isActive
            ? "h-9 px-4 rounded-full bg-white text-[#411FEB] border border-white text-sm font-medium shadow-md transition-all flex items-center gap-1 whitespace-nowrap flex-shrink-0"
            : "h-9 px-4 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20 text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap flex-shrink-0";
    }

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
    fetch('/js/projects.json')
        .then(res => {
            if (!res.ok) throw new Error("Impossible de charger projects.json");
            return res.json();
        })
        .then(data => {
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

            // Initialiser l'animation sur les cartes existantes
            rowDelayMap.clear();
            allCards.forEach(card => {
                registerScrollAnimation(card);
            });

            generateFilters();
            generateSortControls();
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

        // Style Helper (Style Pillule / Translucide unifié)


        // 2. Créer l'UI pour les Types
        // Ajouter le label "Filtrer par :" au début
        const filterLabel = document.createElement('span');
        filterLabel.className = "text-sm text-white font-medium whitespace-nowrap mr-2";
        filterLabel.textContent = "Filtrer par :";
        filtersContainer.appendChild(filterLabel);

        if (typeCounts.size > 0) {
            Array.from(typeCounts.keys())
                .sort((a, b) => typeCounts.get(b) - typeCounts.get(a))
                .forEach(type => {
                    const btn = document.createElement('button');
                    const isActive = selectedTypes.has(type);
                    btn.className = getSharedBtnStyle(isActive);
                    btn.textContent = type;
                    btn.onclick = () => toggleFilter(btn, type, 'type');
                    filtersContainer.appendChild(btn);
                });
        }

        // 3. Créer l'UI pour les Tags
        if (tagCounts.size > 0) {
            Array.from(tagCounts.keys())
                .sort((a, b) => tagCounts.get(b) - tagCounts.get(a))
                .forEach(tagName => {
                    const tagIcon = tagIcons.get(tagName);
                    const btn = document.createElement('button');
                    const isActive = selectedTags.has(tagName);
                    btn.className = getSharedBtnStyle(isActive);
                    btn.innerHTML = `<i class='${tagIcon} text-base'></i> ${tagName}`;
                    btn.onclick = () => toggleFilter(btn, tagName, 'tag');
                    filtersContainer.appendChild(btn);
                });
        }
    }



    // --- Gestion du Tri (Sort Controls) ---
    function generateSortControls() {
        const sortContainer = document.getElementById('sortControlsContainer');
        if (!sortContainer) return;
        sortContainer.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = "w-full flex flex-nowrap overflow-x-auto gap-2 items-center scrollbar-hide mb-2";

        const label = document.createElement('span');
        label.className = "text-sm text-white font-medium whitespace-nowrap";
        label.textContent = "Trier par :";
        wrapper.appendChild(label);

        const btnGroup = document.createElement('div');
        btnGroup.className = "flex items-center gap-2";
        btnGroup.id = "sortBtnGroup";
        wrapper.appendChild(btnGroup);

        sortContainer.appendChild(wrapper);
        updateSortUI();
    }

    function updateSortUI() {
        const btnGroup = document.getElementById('sortBtnGroup');
        if (!btnGroup) return;
        btnGroup.innerHTML = '';

        // Fonction pour générer le style des boutons (DOIT ETRE IDENTIQUE AU FILTRE)
        // Utilisation du helper partagé
        const getBtnStyle = getSharedBtnStyle;

        // Bouton "Plus populaire"
        const btnPop = document.createElement('button');
        const isPopActive = currentSort === 'meilleur';
        btnPop.className = getBtnStyle(isPopActive);
        btnPop.innerHTML = `<i class='bx ${isPopActive ? 'bxs-star' : 'bx-star'} text-base'></i> Plus populaire`;
        btnPop.onclick = () => {
            if (currentSort === 'meilleur') {
                currentSort = 'default';
            } else {
                currentSort = 'meilleur';
            }
            updateSortUI();
            sortAndRenderCards();
        };
        btnGroup.appendChild(btnPop);

        // Bouton "Date"
        const btnDate = document.createElement('button');
        const isDateActive = currentSort === 'date_desc' || currentSort === 'date_asc' || currentSort === 'date';
        const isAsc = currentSort === 'date_asc'; // Plus ancien

        let dateLabel = "Date : Plus récent";
        let dateIconClass = "bx-sort-down";

        if (isDateActive) {
            if (isAsc) {
                dateLabel = "Date : Plus ancien";
                dateIconClass = "bx-sort-down";
            } else {
                dateLabel = "Date : Plus récent";
                dateIconClass = "bx-sort-up";
            }
        }

        btnDate.className = getBtnStyle(isDateActive);
        btnDate.innerHTML = `<i class='bx ${dateIconClass} text-base'></i> ${dateLabel}`;
        btnDate.onclick = () => {
            if (currentSort === 'date_desc' || currentSort === 'date') {
                currentSort = 'date_asc';
            } else if (currentSort === 'date_asc') {
                currentSort = 'default';
            } else {
                currentSort = 'date_desc';
            }
            updateSortUI();
            sortAndRenderCards();
        };
        btnGroup.appendChild(btnDate);
    }

    function toggleFilter(btn, value, category) {
        const set = category === 'type' ? selectedTypes : selectedTags;

        if (set.has(value)) {
            set.delete(value);
        } else {
            set.add(value);
        }

        const isActive = set.has(value);
        btn.className = getSharedBtnStyle(isActive);

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
                        <img src="/assets/media/projects/projectnoresult.svg" alt="Aucun projet trouvé" class="h-64 w-64">
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

        if (currentSort === 'date_asc') {
            sortedCards.sort((a, b) => {
                const dateA = parseProjectDate(getProjectData(a.dataset.projectId));
                const dateB = parseProjectDate(getProjectData(b.dataset.projectId));
                return dateA - dateB; // Ancien -> Récent
            });
        } else if (currentSort === 'date_desc' || currentSort === 'date') {
            sortedCards.sort((a, b) => {
                const dateA = parseProjectDate(getProjectData(a.dataset.projectId));
                const dateB = parseProjectDate(getProjectData(b.dataset.projectId));
                return dateB - dateA; // Récent -> Ancien
            });
        } else { // 'meilleur' default (par id)
            sortedCards.sort((a, b) => (Number(a.dataset.projectId) || 0) - (Number(b.dataset.projectId) || 0));
        }

        // Réordonner le DOM
        sortedCards.forEach(card => container.appendChild(card));

        // Mettre à jour la liste de référence pour que le rendu (slice des 9 premiers) suive le nouveau tri
        allCards = sortedCards;

        updateProjects();
    }

    function sortProjects(list) {
        if (currentSort === 'date_asc') return [...list].sort((a, b) => parseProjectDate(a) - parseProjectDate(b));
        if (currentSort === 'date_desc' || currentSort === 'date') return [...list].sort((a, b) => parseProjectDate(b) - parseProjectDate(a));
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
            matches.slice(0, 5).forEach(project => {
                const div = document.createElement('div');
                div.className = "flex items-center gap-2 p-2 hover:bg-[#EDE9FE] dark:hover:bg-[#1A162C] cursor-pointer transition-colors rounded-lg";

                const projectSlug = project.slug || slugify(project.title);
                const projectUrl = `/creations/${projectSlug}/`;

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
                textContainer.className = "flex flex-col sm:flex-row sm:items-center overflow-hidden";

                const titleSpan = document.createElement('span');
                titleSpan.className = "font-semibold text-[#3E3E3E] dark:text-white truncate max-w-[200px] sm:max-w-[250px]";
                titleSpan.textContent = project.title;
                textContainer.appendChild(titleSpan);

                if (project.type) {
                    const typeSpan = document.createElement('span');
                    typeSpan.className = "text-[#3E3E3E] dark:text-gray-300 text-sm opacity-80 mt-0.5 sm:mt-0 flex items-center";
                    const separator = document.createElement('span');
                    separator.innerHTML = '•';
                    separator.className = "hidden sm:inline mx-1 text-[#411FEB] dark:text-[#5536ED] opacity-[0.48]";
                    const typeText = document.createElement('span');
                    typeText.textContent = project.type.charAt(0).toUpperCase() + project.type.slice(1);
                    typeSpan.append(separator, typeText);
                    textContainer.appendChild(typeSpan);
                }
                link.appendChild(textContainer);
                div.appendChild(link);

                div.addEventListener('click', (e) => {
                    // let default link behavior happen
                });
                suggestionsContainer.appendChild(div);
            });
            suggestionsContainer.classList.remove('hidden');
            selectedSuggestionIndex = 0;
            updateSuggestionsHighlight(suggestionsContainer.children);

        } else {
            suggestionsContainer.classList.add('hidden');
            selectedSuggestionIndex = -1;
        }

        updateProjects();
    });

    searchInput.addEventListener('keydown', (e) => {
        const items = suggestionsContainer.children;
        if (items.length === 0 || suggestionsContainer.classList.contains('hidden')) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedSuggestionIndex++;
            if (selectedSuggestionIndex >= items.length) selectedSuggestionIndex = -1;
            updateSuggestionsHighlight(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedSuggestionIndex--;
            if (selectedSuggestionIndex < -1) selectedSuggestionIndex = items.length - 1;
            updateSuggestionsHighlight(items);
        } else if (e.key === 'Enter') {
            if (selectedSuggestionIndex > -1 && items[selectedSuggestionIndex]) {
                e.preventDefault();
                const link = items[selectedSuggestionIndex].querySelector('a');
                if (link) link.click();
            }
        }
    });

    function updateSuggestionsHighlight(items) {
        Array.from(items).forEach((item, index) => {
            if (index === selectedSuggestionIndex) {
                item.classList.add('bg-[#EDE9FE]', 'dark:bg-[#1A162C]');
                // Ensure the item is visible in the scrollable container
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('bg-[#EDE9FE]', 'dark:bg-[#1A162C]');
            }
        });
    }

    document.addEventListener('click', e => {
        if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.classList.add('hidden');
        }
    });
});
