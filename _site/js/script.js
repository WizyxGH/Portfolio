document.addEventListener("DOMContentLoaded", function () {
    const showMoreButton = document.getElementById("showMoreButton");
    const showLessButton = document.getElementById("showLessButton");
    const searchInput = document.getElementById('searchInput');
    const clearSearchButton = document.getElementById('clearSearch');
    const container = document.getElementById("projectsContainer");
    if (!container) return;

    let projects = [];
    let projectsVisible = 9;
    let filteredProjects = [];
    let allCards = [];
    let currentSort = 'meilleur'; // 'meilleur' (par id) ou 'date'
    const carouselEls = {
        container: document.getElementById('modalCarousel'),
        track: document.getElementById('carouselTrack'),
        dots: document.getElementById('carouselDots'),
        prev: document.getElementById('carouselPrev'),
        next: document.getElementById('carouselNext'),
        counter: document.getElementById('carouselCounter'),
    };

    const modalController = window.ProjectModal?.init({ carouselEls }) || null;
    const openModal = modalController?.openModal || (() => {});
    const closeModal = modalController?.closeModal || (() => {});

    // --- Chargement du fichier JSON ---
    fetch('/js/projects.json')
        .then(res => {
            if (!res.ok) throw new Error("Impossible de charger projects.json");
            return res.json();
        })
        .then(data => {
            projects = data;

            const path = window.location.pathname;
            if (path.includes('creations_studies')) filteredProjects = projects.filter(p => p.id >= 24 && p.id <= 31);
            else if (path.includes('creations')) filteredProjects = projects.filter(p => p.id >= 1 && p.id <= 23);
            else filteredProjects = [...projects];

            if (searchInput)
                searchInput.placeholder = `Rechercher parmi ${filteredProjects.length} projet${filteredProjects.length > 1 ? 's' : ''}`;

            filteredProjects.forEach(project => {
                const projectTitleId = project.title.replace(/[^a-zA-Z0-9-_]/g, '_');
                const card = document.createElement("div");
                card.className = "projectCard bg-white dark:bg-[#121212] rounded-lg text-left cursor-pointer hover:bg-[#EDE9FE] dark:hover:bg-[#1A162C] border-8 border-white dark:border-[#121212]";
                card.dataset.projectId = project.id;
                card.dataset.title = project.title.toLowerCase();
                card.dataset.description = project.description.toLowerCase();
                card.dataset.text = project.text.toLowerCase();

                card.innerHTML = ` 
                    <div class="h-40 mb-3 rounded-lg bg-[#411FEB] bg-opacity-[0.12] outline outline-2 overflow-hidden">
                        <img data-src="${project.image}" loading="lazy" alt="${project.title}" class="h-40 w-full object-cover rounded-lg transition-transform duration-500 ease-in-out hover:scale-110 lazy-img">
                    </div>
                    <h3 class="text-lg font-semibold text-[#411FEB] dark:text-[#5536ED]">${project.title}</h3>
                    <div class="mt-1 flex flex-wrap gap-2" id="tagsContainer-${projectTitleId}"></div>
                    <p class="text-sm text-[#121212] dark:text-white mt-2">${project.description}</p>
                `;

                const tagsContainer = card.querySelector(`#tagsContainer-${projectTitleId}`);
                if (tagsContainer && project.tags?.length) {
                    project.tags.forEach(tag => {
                        const tagElement = document.createElement("span");
                        tagElement.className =
                            "inline-flex items-center gap-1 px-2 rounded-full border border-[#411FEB] bg-[#411FEB] bg-opacity-[0.12] text-[#411FEB] dark:text-[#5536ED] font-medium text-sm";
                        tagElement.innerHTML = `<i class='${tag.icon} text-base'></i> ${tag.name}`;
                        tagsContainer.appendChild(tagElement);
                    });
                }

                container.appendChild(card);
            });

            allCards = Array.from(container.querySelectorAll(".projectCard"));
            attachEventListenersToCards();
            sortAndRenderCards();
            lazyLoadImages();

            const urlParams = new URLSearchParams(window.location.search);
            const projectIdFromUrl = urlParams.get("project");
            if (projectIdFromUrl) {
                const project = projects.find(p => String(p.id) === projectIdFromUrl);
                if (project) openModal(project);
            }
        })
        .catch(console.error);

    // --- Lazy loading ---
    function lazyLoadImages() {
        const lazyImages = document.querySelectorAll(".lazy-img");
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove("lazy-img");
                    obs.unobserve(img);
                }
            });
        });
        lazyImages.forEach(img => observer.observe(img));
    }

    // --- Update affichage ---
    function updateProjects() {
        const query = searchInput?.value.toLowerCase() || "";
        let visibleCount = 0;

        allCards.forEach(card => {
            const matches = !query || card.dataset.title.includes(query) || card.dataset.description.includes(query) || card.dataset.text.includes(query);
            if (matches && visibleCount < projectsVisible) {
                card.classList.remove("hidden");
                visibleCount++;
            } else {
                card.classList.add("hidden");
            }
        });

        let emptyCard = document.getElementById("emptyProjectCard");
        if (visibleCount === 0) {
            if (!emptyCard) {
                emptyCard = document.createElement("div");
                emptyCard.id = "emptyProjectCard";
                emptyCard.className = "projectCard bg-white rounded-lg text-left border-8 border-white hover:bg-[#EDE9FE] dark:hover:bg-[#EDE9FE] cursor-default";
                emptyCard.innerHTML = `
                    <div class="h-40 mb-3 rounded-lg bg-[#411FEB] bg-opacity-[0.12] border-2 border-dashed border-[#411FEB] flex items-center justify-center overflow-hidden">
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
            }
        } else if (emptyCard) emptyCard.remove();

        const totalMatches = allCards.filter(card =>
            !query || card.dataset.title.includes(query) || card.dataset.description.includes(query) || card.dataset.text.includes(query)
        ).length;

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

    function attachEventListenersToCards() {
        allCards.forEach(card => {
            card.addEventListener('click', () => {
                const projectId = Number(card.dataset.projectId);
                const project = projects.find(p => Number(p.id) === projectId);
                if (project) openModal(project);
            });
        });
    }
    // --- Autosuggestions ---
    const suggestionsContainer = document.getElementById('suggestionsContainer');

    // Parse date helper
    function parseProjectDate(p) {
        if (!p || !p.date) return 0;
        const d = Date.parse(p.date);
        if (!isNaN(d)) return d;
        const yearMatch = String(p.date).match(/(19|20)\d{2}/);
        if (yearMatch) return new Date(Number(yearMatch[0]), 0, 1).getTime();
        const tryDate = new Date(p.date);
        if (!isNaN(tryDate)) return tryDate.getTime();
        return 0;
    }

    // --- Fonction tri et réaffichage des cartes sur la page ---
    function sortAndRenderCards() {
        let sortedCards = [...allCards];
        if (currentSort === 'date') {
            sortedCards.sort((a, b) => {
                const dateA = parseProjectDate(projects.find(p => p.id == a.dataset.projectId));
                const dateB = parseProjectDate(projects.find(p => p.id == b.dataset.projectId));
                return dateB - dateA;
            });
        } else { // 'meilleur' ou id
            sortedCards.sort((a, b) => (Number(a.dataset.projectId) || 0) - (Number(b.dataset.projectId) || 0));
        }

        container.innerHTML = '';
        sortedCards.forEach(card => container.appendChild(card));
        updateProjects();
    }

    // Tri fonction pour suggestions uniquement
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

                    // Tri les cartes affichées sur la page
                    sortAndRenderCards();

                    // Tri et affichage des suggestions
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

                    const img = document.createElement('img');
                    img.src = project.image;
                    img.alt = project.title;
                    img.className = "w-12 h-12 object-cover rounded-lg flex-shrink-0";
                    div.appendChild(img);

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

                    div.appendChild(textContainer);
                    div.addEventListener('click', () => {
                        openModal(project);
                        suggestionsContainer.classList.add('hidden');
                        searchInput.value = '';
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
