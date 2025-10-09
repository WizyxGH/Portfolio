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

    // --- Chargement du fichier JSON ---
    fetch('/js/projects.json')
        .then(res => {
            if (!res.ok) throw new Error("Impossible de charger projects.json");
            return res.json();
        })
        .then(data => {
            projects = data;

            // --- Initialisation selon la page ---
            const path = window.location.pathname;
            if (path.includes('creations_studies')) filteredProjects = projects.filter(p => p.id >= 23 && p.id <= 30);
            else if (path.includes('creations')) filteredProjects = projects.filter(p => p.id >= 1 && p.id <= 22);
            else filteredProjects = [...projects];

            if (searchInput)
                searchInput.placeholder = `Rechercher parmi ${filteredProjects.length} projet${filteredProjects.length > 1 ? 's' : ''}`;

            // --- Création des cards ---
            filteredProjects.forEach(project => {
                const projectTitleId = project.title.replace(/[^a-zA-Z0-9-_]/g, '_');
                const card = document.createElement("div");
                card.className = "projectCard bg-white rounded-lg text-left cursor-pointer hover:bg-[#EDE9FE] border-8 border-white";
                card.dataset.projectId = project.id;
                card.dataset.title = project.title.toLowerCase();
                card.dataset.description = project.description.toLowerCase();
                card.dataset.text = project.text.toLowerCase();

                // --- Card avec lazy loading des images ---
                card.innerHTML = ` 
                    <div class="h-40 mb-3 rounded-lg bg-[#411FEB] bg-opacity-[0.12] outline outline-2 overflow-hidden">
                        <img data-src="${project.image}" loading="lazy" alt="${project.title}" class="h-40 w-full object-cover rounded-lg transition-transform duration-500 ease-in-out hover:scale-110 lazy-img">
                    </div>
                    <h3 class="text-lg font-semibold text-[#411FEB]">${project.title}</h3>
                    <div class="mt-1 flex flex-wrap gap-2" id="tagsContainer-${projectTitleId}"></div>
                    <p class="text-sm text-gray-600 mt-2">${project.description}</p>
                `;

                const tagsContainer = card.querySelector(`#tagsContainer-${projectTitleId}`);
                if (tagsContainer && project.tags?.length) {
                    project.tags.forEach(tag => {
                        const tagElement = document.createElement("span");
                        tagElement.className =
                            "inline-flex items-center gap-1 px-2 rounded-full border border-[#411FEB] bg-[#411FEB] bg-opacity-[0.12] text-[#411FEB] font-medium text-sm";
                        tagElement.innerHTML = `<i class='${tag.icon} text-base'></i> ${tag.name}`;
                        tagsContainer.appendChild(tagElement);
                    });
                }

                container.appendChild(card);
            });

            allCards = Array.from(container.querySelectorAll(".projectCard"));
            attachEventListenersToCards();
            updateProjects();
            lazyLoadImages();
        })
        .catch(error => console.error(error));

    // --- Lazy loading des images ---
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

    // --- Fonction de mise à jour affichage ---
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

        // --- Fausse carte si aucun projet trouvé ---
        let emptyCard = document.getElementById("emptyProjectCard");
        if (visibleCount === 0) {
            if (!emptyCard) {
                emptyCard = document.createElement("div");
                emptyCard.id = "emptyProjectCard";
                emptyCard.className = "projectCard bg-white rounded-lg text-left border-8 border-white hover:bg-[#EDE9FE] cursor-default";

                emptyCard.innerHTML = `
                    <div class="h-40 mb-3 rounded-lg bg-[#411FEB] bg-opacity-[0.12] border-2 border-dashed border-[#411FEB] flex items-center justify-center overflow-hidden">
                        <img src="/media/projects/projectnoresult.svg" alt="Aucun projet trouvé" class="h-64 w-64">
                    </div>
                    <h3 class="text-lg font-semibold text-[#411FEB] mb-1">Aucun projet trouvé...</h3>
                    <p class="text-sm text-gray-600 mt-2 mb-4">
                        Peut-être en rechercheriez-vous un autre ? Sinon, rassurez-vous, il ne me fait pas peur !
                    </p>
                    <a href="/services" class="inline-flex items-center gap-2 bg-[#411FEB] text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#3216C9] transition">
                        <i class='bx bx-handshake text-base'></i>
                        On le crée ensemble ?
                    </a>
                `;
                container.appendChild(emptyCard);
            }
        } else if (emptyCard) {
            emptyCard.remove();
        }

        // --- Gestion des boutons ---
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

    // --- Événements ---
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

    // --- Gestion des cartes ---
    function attachEventListenersToCards() {
        allCards.forEach(card => {
            card.addEventListener('click', () => {
                const projectId = Number(card.dataset.projectId);
                const project = projects.find(p => Number(p.id) === projectId);
                if (project) openModal(project);
            });
        });
    }

    // --- Modal ---
    function openModal(project) {
        const modal = document.getElementById("modal");
        if (!modal) return;

        const modalTitle = document.getElementById("modalTitle");
        const modalMeta = document.getElementById("modalMeta");
        const modalImage = document.getElementById("modalImage");
        const modalText = document.getElementById("modalText");
        const modalButton = document.getElementById("modalButton");
        const modalWebsite = document.getElementById("modalWebsite");
        const modalTags = document.getElementById("modalTags");

        modalTitle.textContent = project.title;
        modalText.innerHTML = project.text.replace(/\n/g, "<br>");
        modalImage.style.backgroundImage = `url('${project.image}')`;
        modalImage.style.backgroundSize = "cover";
        modalImage.style.backgroundPosition = "center";

        let formattedDate = project.date ? new Date(project.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long" }) : "";
        const type = project.type ? project.type.charAt(0).toUpperCase() + project.type.slice(1) : "";
        const context = project.context || "";

        modalMeta.innerHTML = `
        <div class="flex items-center gap-1 text-gray-600 text-sm">
            <i class="bx bxs-calendar-alt text-[#411FEB] opacity-[0.48] text-base"></i>
            <span>${formattedDate || "Date inconnue"}</span>
            ${type ? `<span class="mx-1 text-[#411FEB] opacity-[0.48]">•</span><span>${type}</span>` : ""}
            ${context ? `<span class="mx-1 text-[#411FEB] opacity-[0.48]">•</span><span>${context}</span>` : ""}
        </div>`;

        modalTags.innerHTML = "";
        project.tags?.forEach(tag => {
            const span = document.createElement("span");
            span.className =
                "inline-flex items-center gap-1 px-2 rounded-full border border-[#411FEB] bg-[#411FEB] bg-opacity-[0.12] text-[#411FEB] font-medium";
            span.innerHTML = `<i class='${tag.icon} text-base'></i> ${tag.name}`;
            modalTags.appendChild(span);
        });

        if (project.driveLink) {
            modalButton.href = project.driveLink;
            modalButton.classList.remove("hidden");
        } else modalButton.classList.add("hidden");

        if (project.projectLink) {
            modalWebsite.href = project.projectLink;
            modalWebsite.classList.remove("hidden");
            modalWebsite.innerHTML =
                project.type === "app"
                    ? `<i class='bx bx-globe'></i> Voir l'application`
                    : `<i class='bx bx-globe'></i> Visiter le site web`;
        } else modalWebsite.classList.add("hidden");

        modal.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
    }

    function closeModal() {
        document.body.classList.remove("overflow-hidden");
        document.getElementById("modal").classList.add("hidden");
    }

    window.closeModal = closeModal;
    document.querySelector('.bx-x')?.addEventListener('click', closeModal);
});