document.addEventListener("DOMContentLoaded", function () {
    const showMoreButton = document.getElementById("showMoreButton");
    const showLessButton = document.getElementById("showLessButton");
    const menuButton = document.getElementById('menuButton');
    const navMenu = document.getElementById('navMenu');
    const dropdownButton = document.getElementById('dropdownButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const searchInput = document.getElementById('searchInput');
    const clearSearchButton = document.getElementById('clearSearch');

    if (searchInput && clearSearchButton) {
        searchInput.addEventListener('input', () => {
            // Afficher/cacher le bouton "x"
            if (searchInput.value.length > 0) {
                clearSearchButton.classList.remove('opacity-0', 'pointer-events-none');
                clearSearchButton.classList.add('opacity-100', 'pointer-events-auto');
            } else {
                clearSearchButton.classList.add('opacity-0', 'pointer-events-none');
                clearSearchButton.classList.remove('opacity-100', 'pointer-events-auto');
            }

            // Filtrage dynamique
            const query = searchInput.value.toLowerCase();
            const filteredProjects = projects.filter(project =>
                project.title.toLowerCase().includes(query) ||
                project.description.toLowerCase().includes(query) ||
                project.text.toLowerCase().includes(query)
            );

            renderProjects(filteredProjects.slice(0, projectsVisible));
        });

        clearSearchButton.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchButton.classList.add('opacity-0', 'pointer-events-none');
            clearSearchButton.classList.remove('opacity-100', 'pointer-events-auto');
            renderProjects(projects.slice(0, projectsVisible));
        });
    }

    let projectsVisible = 9; // Nombre de projets visibles au départ

    // Filtrage des projets selon la page
    if (typeof projects !== "undefined" && Array.isArray(projects)) {
        const path = window.location.pathname;

        if (path.includes('creations_studies')) {
            projects = projects.filter(project => Number(project.id) >= 22 && Number(project.id) <= 29);
        } else if (path.includes('creations')) {
            projects = projects.filter(project => Number(project.id) >= 1 && Number(project.id) <= 21);
        }

        console.log("Projets filtrés :", projects);
    } else {
        console.error("La variable 'projects' est introuvable ou n'est pas un tableau.");
        return;
    }

    // Placeholder avec nombre total de projets
    if (searchInput) {
        searchInput.placeholder = `Rechercher parmi ${projects.length} projet${projects.length > 1 ? 's' : ''}`;
    }

    // Gestion des boutons "Afficher plus / moins"
    if (showMoreButton && showLessButton) {
        showMoreButton.addEventListener("click", function () {
            projectsVisible = projects.length;
            renderProjects(projects.slice(0, projectsVisible));
            showMoreButton.classList.add("hidden");
            showLessButton.classList.remove("hidden");
        });

        showLessButton.addEventListener("click", function () {
            projectsVisible = 9;
            renderProjects(projects.slice(0, projectsVisible));
            showLessButton.classList.add("hidden");
            showMoreButton.classList.remove("hidden");
        });
    }

    // Recherche dynamique
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();

            const filteredProjects = projects.filter(project =>
                project.title.toLowerCase().includes(query) ||
                project.description.toLowerCase().includes(query) ||
                project.text.toLowerCase().includes(query)
            );

            // Limite au nombre de projets visibles
            const projectsToShow = filteredProjects.slice(0, projectsVisible);

            renderProjects(projectsToShow);
        });
    }

    // Affichage initial des projets
    renderProjects(projects.slice(0, projectsVisible));

    // --- Fonctions principales ---

    function renderProjects(listToRender) {
        const container = document.getElementById("projectsContainer");
        if (!container) return;
        container.innerHTML = '';

        if (!Array.isArray(listToRender) || listToRender.length === 0) {
            container.innerHTML = '<p class="text-center col-span-full">Aucun projet trouvé.</p>';
            return;
        }

        listToRender.forEach(project => {
            const projectTitleId = project.title.replace(/[^a-zA-Z0-9-_]/g, '_');
            const card = document.createElement("div");
            card.className = "projectCard bg-white rounded-lg text-left cursor-pointer hover:bg-[#EDE9FE] border-8 border-white";
            card.dataset.projectId = project.id;

            card.innerHTML = ` 
                <div class="h-40 mb-3 rounded-lg bg-[#411FEB]/12 outline outline-2 overflow-hidden">
                    <img src="${project.image}" alt="${project.title}" class="h-40 w-full object-cover rounded-lg transition-transform duration-500 ease-in-out hover:scale-110">
                </div>
                <h3 class="text-lg font-semibold text-[#411FEB]">${project.title}</h3>
                <div class="mt-1 flex space-x-2" id="tagsContainer-${projectTitleId}"></div>
                <p class="text-sm text-gray-600 mt-2">${project.description}</p>
            `;

            const tagsContainer = card.querySelector(`#tagsContainer-${projectTitleId}`);
            if (tagsContainer && project.tags && Array.isArray(project.tags)) {
                tagsContainer.innerHTML = "";
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

        attachEventListenersToCards();
    }

    function attachEventListenersToCards() {
        document.querySelectorAll('.projectCard').forEach(card => {
            card.addEventListener('click', () => {
                const projectId = Number(card.dataset.projectId);
                const project = projects.find(p => Number(p.id) === projectId);
                if (project && project.title) {
                    openModal(project);
                }
            });
        });
    }

    // --- Modal ---
    function openModal(project) {
        const modal = document.getElementById("modal");
        if (!modal) return;

        const modalTitle = document.getElementById("modalTitle");
        const modalSubtitle = document.getElementById("modalSubtitle");
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

        if (project.date) {
            const dateObj = new Date(project.date);
            const options = { year: 'numeric', month: 'long' };
            modalSubtitle.textContent = `Réalisé en ${dateObj.toLocaleDateString('fr-FR', options)}`;
        } else {
            modalSubtitle.textContent = '';
        }

        modalTags.innerHTML = "";
        if (project.tags && project.tags.length > 0) {
            project.tags.forEach(tag => {
                const span = document.createElement("span");
                span.className =
                    "inline-flex items-center gap-1 px-2 rounded-full border border-[#411FEB] bg-[#411FEB] bg-opacity-[0.12] text-[#411FEB] font-medium";
                span.innerHTML = `<i class='${tag.icon} text-base'></i> ${tag.name}`;
                modalTags.appendChild(span);
            });
        }

        if (project.driveLink) {
            modalButton.href = project.driveLink;
            modalButton.classList.remove("hidden");
        } else {
            modalButton.classList.add("hidden");
        }

        if (project.projectLink) {
            modalWebsite.href = project.projectLink;
            modalWebsite.classList.remove("hidden");
            modalWebsite.innerHTML = project.type === "app" ?
                `<i class='bx bx-globe'></i> Voir l'application` :
                `<i class='bx bx-globe'></i> Visiter le site web`;
        } else {
            modalWebsite.classList.add("hidden");
        }

        modal.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
    }

    function closeModal() {
        document.body.classList.remove("overflow-hidden");
        document.getElementById("modal").classList.add("hidden");
    }

    window.closeModal = closeModal; // ✅ rend la fonction accessible depuis le HTML

    const modalCloseButton = document.querySelector('.bx-x');
    if (modalCloseButton) modalCloseButton.addEventListener('click', closeModal);

    // Menu burger
    if (menuButton && navMenu) {
        menuButton.addEventListener('click', () => navMenu.classList.toggle('hidden'));
    }

    // Dropdown
    if (dropdownButton && dropdownMenu) {
        dropdownButton.addEventListener("click", (event) => {
            event.stopPropagation();
            dropdownMenu.classList.toggle("hidden");
        });
        document.addEventListener("click", (event) => {
            if (!dropdownButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.add("hidden");
            }
        });
    }

});