document.addEventListener("DOMContentLoaded", function () {
    const showMoreButton = document.getElementById("showMoreButton");
    const showLessButton = document.getElementById("showLessButton");
    const menuButton = document.getElementById('menuButton');
    const navMenu = document.getElementById('navMenu');
    const dropdownButton = document.getElementById('dropdownButton');
    const dropdownMenu = document.getElementById('dropdownMenu');

    let projectsVisible = 6; // Nombre de projets visibles au départ

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
        projectsVisible = 6;
        renderProjects(projectsVisible);
    }

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
            card.className = "projectCard bg-white rounded-lg text-left cursor-pointer hover:bg-[#EDE9FE]";
            card.dataset.projectId = project.id;

            card.innerHTML = ` 
                <div class="h-40 mb-3 rounded-lg bg-[#411FEB] outline outline-2">
                    <img src="${project.image}" alt="${project.title}" class="h-40 w-full object-cover rounded-lg">
                </div>
                <h3 class="text-lg font-semibold text-[#411FEB]">${project.title}</h3>
                <div class="mt-1 flex space-x-2" id="tagsContainer-${projectTitleId}"></div>
                <p class="text-sm text-gray-600 mt-2">${project.description}</p>
            `;

            const imageDiv = card.querySelector("div");
            imageDiv.style.backgroundImage = `url('${project.image}')`;
            imageDiv.style.backgroundSize = 'cover';
            imageDiv.style.backgroundPosition = 'center';

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

    function attachEventListenersToCards() {
        document.querySelectorAll('.projectCard').forEach(card => {
            card.addEventListener('click', () => {
                const projectId = card.dataset.projectId;
                const project = projects.find(p => p.id === projectId);

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
        const modalImage = document.getElementById("modalImage");
        const modalText = document.getElementById("modalText");
        const modalButton = document.getElementById("modalButton");
    
        modalTitle.textContent = project.title;
        modalText.innerHTML = project.text.replace(/\n/g, "<br>"); // Gestion des sauts de ligne
        modalImage.style.backgroundImage = `url('${project.image}')`;
        modalImage.style.backgroundSize = 'cover';
        modalImage.style.backgroundPosition = 'center';
    
        if (project.driveLink) {
            modalButton.href = project.driveLink;
            modalButton.classList.remove("hidden");
        } else {
            modalButton.classList.add("hidden");
        }
    
        modal.classList.remove("hidden");
    }    
    
    function closeModal() {
        document.body.classList.remove("overflow-hidden"); // Réactive le scroll du body
        document.getElementById("modal").classList.add("hidden");
    }
    
    // Attache l'événement au bouton de fermeture
    document.querySelector('.bx-x').addEventListener("click", closeModal);

    const modalCloseButton = document.querySelector('.bx-x');
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeModal);
    }

    // Vérification pour le menu burger
    if (menuButton && navMenu) {
        menuButton.addEventListener('click', () => {
            navMenu.classList.toggle('hidden');
        });
    }

    // Vérification pour le menu déroulant
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

    renderProjects(projectsVisible);
});
