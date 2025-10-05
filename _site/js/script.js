document.addEventListener("DOMContentLoaded", function () {
    const showMoreButton = document.getElementById("showMoreButton");
    const showLessButton = document.getElementById("showLessButton");
    const menuButton = document.getElementById('menuButton');
    const navMenu = document.getElementById('navMenu');
    const dropdownButton = document.getElementById('dropdownButton');
    const dropdownMenu = document.getElementById('dropdownMenu');

    let projectsVisible = 9; // Nombre de projets visibles au départ

    // Filtrage des projets selon la page
    if (typeof projects !== "undefined" && Array.isArray(projects)) {
        const path = window.location.pathname;

        if (path.includes('creations_studies')) {
            projects = projects.filter(project => Number(project.id) >= 21 && Number(project.id) <= 28);
        } else if (path.includes('creations')) {
            projects = projects.filter(project => Number(project.id) >= 1 && Number(project.id) <= 20);
        }

        console.log("Projets filtrés :", projects);
    } else {
        console.error("La variable 'projects' est introuvable ou n'est pas un tableau.");
        return;
    }

    // Gestion des boutons "Afficher plus / moins"
    if (showMoreButton && showLessButton) {
        showMoreButton.addEventListener("click", function () {
            loadMoreProjects();
            showMoreButton.classList.add("hidden");
            showLessButton.classList.remove("hidden");
        });

        showLessButton.addEventListener("click", function () {
            loadLessProjects();
            showLessButton.classList.add("hidden");
            showMoreButton.classList.remove("hidden");
        });
    }

    function loadMoreProjects() {
        projectsVisible = projects.length;
        renderProjects(projectsVisible);
    }

    function loadLessProjects() {
        projectsVisible = 9;
        renderProjects(projectsVisible);
    }

    // Affichage des projets
    function renderProjects(visibleCount) {
        const container = document.getElementById("projectsContainer");
        if (!container) return;
        container.innerHTML = '';

        if (!Array.isArray(projects) || projects.length === 0) {
            console.error('Aucun projet trouvé dans la variable projects.');
            return;
        }

        projects.slice(0, visibleCount).forEach(project => {
            const projectTitleId = project.title.replace(/[^a-zA-Z0-9-_]/g, '_');
            const card = document.createElement("div");
            card.className = "projectCard bg-white rounded-lg text-left cursor-pointer hover:bg-[#EDE9FE] border-8 border-white";
            card.dataset.projectId = project.id;

            card.innerHTML = ` 
                <div class="h-40 mb-3 rounded-lg bg-[#411FEB] outline outline-2 overflow-hidden">
                    <img src="${project.image}" alt="${project.title}" class="h-40 w-full object-cover rounded-lg transition-transform duration-500 ease-in-out hover:scale-110">
                </div>
                <h3 class="text-lg font-semibold text-[#411FEB]">${project.title}</h3>
                <div class="mt-1 flex space-x-2" id="tagsContainer-${projectTitleId}"></div>
                <p class="text-sm text-gray-600 mt-2">${project.description}</p>
            `;

            const tagsContainer = card.querySelector(`#tagsContainer-${projectTitleId}`);
            if (tagsContainer && project.tags && Array.isArray(project.tags)) {
                project.tags.forEach(tag => {
                    const tagElement = document.createElement("span");
                    tagElement.className = "bg-[#EDE9FE] text-[#411FEB] border border-[#411FEB] px-2 text-xs rounded-full flex items-center";
                    tagElement.innerHTML = `<i class='${tag.icon} text-sm mr-1'></i> ${tag.name}`;
                    tagsContainer.appendChild(tagElement);
                });
            }

            container.appendChild(card);
        });

        attachEventListenersToCards();
    }

    // Gestion du clic sur les cartes pour ouvrir le modal
    function attachEventListenersToCards() {
        document.querySelectorAll('.projectCard').forEach(card => {
            card.addEventListener('click', () => {
                const projectId = Number(card.dataset.projectId);
                const project = projects.find(p => Number(p.id) === projectId);

                console.log("Carte cliquée - ID:", projectId, "Projet trouvé:", project);

                if (project) {
                    openModal(project);
                } else {
                    console.error(`Le projet avec l'ID ${projectId} n'a pas été trouvé.`);
                }
            });
        });
    }

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

        // --- Contenu principal ---
        modalTitle.textContent = project.title;
        modalText.innerHTML = project.text.replace(/\n/g, "<br>");
        modalImage.style.backgroundImage = `url('${project.image}')`;
        modalImage.style.backgroundSize = "cover";
        modalImage.style.backgroundPosition = "center";

        // 🗓️ Affichage de la date au bon format
        if (project.date) {
            const dateObj = new Date(project.date);
            const options = { year: 'numeric', month: 'long' };
            const formattedDate = dateObj.toLocaleDateString('fr-FR', options);
            modalSubtitle.textContent = `Réalisé en ${formattedDate}`;
        } else {
            modalSubtitle.textContent = '';
        }

        // --- Tags dynamiques ---
        modalTags.innerHTML = ""; // on vide avant d’ajouter
        if (project.tags && project.tags.length > 0) {
            project.tags.forEach(tag => {
                const span = document.createElement("span");
                span.className =
                    "inline-flex items-center gap-2 px-3 py-1 rounded-xl border border-[#411FEB] bg-[#411FEB] bg-opacity-[0.12] text-[#411FEB] font-medium text-sm"; // texte réduit
                span.innerHTML = `<i class='${tag.icon} text-lg'></i> ${tag.name}`;
                modalTags.appendChild(span);
            });
        }

        // --- Bouton "Voir le résultat" ---
        if (project.driveLink) {
            modalButton.href = project.driveLink;
            modalButton.classList.remove("hidden");
        } else {
            modalButton.classList.add("hidden");
        }

        // 🔗 Bouton site web / appli
        if (project.projectLink) {
            modalWebsite.href = project.projectLink;
            modalWebsite.classList.remove("hidden");

            // 🔤 Wording dynamique
            if (project.type === "app") {
                modalWebsite.innerHTML = `<i class='bx bx-globe'></i> Voir l'application`;
            } else {
                modalWebsite.innerHTML = `<i class='bx bx-globe'></i> Visiter le site web`;
            }
        } else {
            modalWebsite.classList.add("hidden");
        }

        // --- Affichage final ---
        modal.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
    }

    function closeModal() {
        document.body.classList.remove("overflow-hidden");
        document.getElementById("modal").classList.add("hidden");
    }

    const modalCloseButton = document.querySelector('.bx-x');
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeModal);
    }

    // Menu burger
    if (menuButton && navMenu) {
        menuButton.addEventListener('click', () => {
            navMenu.classList.toggle('hidden');
        });
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

    // Affichage initial des projets
    renderProjects(projectsVisible);
});
