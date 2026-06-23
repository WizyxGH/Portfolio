document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const formMessage = document.getElementById('formMessage');
    const formLoadTime = Date.now();

    // Budget Selector Logic
    const budgetInput = document.getElementById('budgetInput');
    const budgetPills = document.querySelectorAll('.budget-pill');
    const budgetError = document.getElementById('budgetError');

    budgetPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const isSelected = pill.classList.contains('border-[#411FEB]');
            
            // Reset all pills
            budgetPills.forEach(p => {
                p.classList.remove('border-[#411FEB]', 'bg-[#411FEB]/10', 'text-[#411FEB]', 'dark:border-[#5536ED]', 'dark:bg-[#5536ED]/10', 'dark:text-[#5536ED]');
                p.classList.add('border-gray-200', 'dark:border-gray-800', 'text-gray-600', 'dark:text-gray-400', 'bg-white', 'dark:bg-[#121212]');
            });

            if (isSelected) {
                // Toggle off if already selected
                budgetInput.value = '';
            } else {
                // Toggle on
                pill.classList.remove('border-gray-200', 'dark:border-gray-800', 'text-gray-600', 'dark:text-gray-400', 'bg-white', 'dark:bg-[#121212]');
                pill.classList.add('border-[#411FEB]', 'bg-[#411FEB]/10', 'text-[#411FEB]', 'dark:border-[#5536ED]', 'dark:bg-[#5536ED]/10', 'dark:text-[#5536ED]');
                budgetInput.value = pill.getAttribute('data-budget');
                // Clear error on select
                budgetError.classList.add('hidden');
            }
        });
    });

    function validateBudgetField() {
        if (!budgetInput) return true;
        if (budgetInput.value === '') {
            budgetError.textContent = "Veuillez sélectionner une tranche de budget pour votre projet.";
            budgetError.classList.remove('hidden');
            return false;
        } else {
            budgetError.classList.add('hidden');
            return true;
        }
    }

    // Email validation logic
    const emailInput = document.getElementById('emailInput');
    const emailError = document.getElementById('emailError');

    function validateEmail(email) {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(String(email).toLowerCase());
    }

    function validateEmailField() {
        if (!emailInput) return true;
        const value = emailInput.value.trim();
        if (value === '') {
            emailError.textContent = "L'adresse mail est requise.";
            emailError.classList.remove('hidden');
            emailInput.classList.add('border-red-500', 'focus:ring-red-500');
            return false;
        }
        const isValid = validateEmail(value);
        if (!isValid) {
            emailError.textContent = "L'adresse mail ne semble pas valide (ex. john@example.com).";
            emailError.classList.remove('hidden');
            emailInput.classList.add('border-red-500', 'focus:ring-red-500');
            return false;
        } else {
            emailError.classList.add('hidden');
            emailInput.classList.remove('border-red-500', 'focus:ring-red-500');
            return true;
        }
    }

    if (emailInput) {
        emailInput.addEventListener('input', () => {
            if (emailInput.value.trim() === '') {
                emailError.classList.add('hidden');
                emailInput.classList.remove('border-red-500', 'focus:ring-red-500');
            } else {
                validateEmailField();
            }
        });
    }

    // Phone validation logic
    const phoneInput = document.getElementById('phoneInput');
    const phoneError = document.getElementById('phoneError');

    function validatePhone(phoneNumber) {
        const cleaned = phoneNumber.replace(/[\s\-\.\(\)\+]/g, '');
        if (cleaned === '') return true; // Optional field
        
        // Permissive check: digits only, between 8 and 15 digits
        return /^\d{8,15}$/.test(cleaned);
    }

    function validatePhoneField() {
        if (!phoneInput) return true;
        const value = phoneInput.value;
        const isValid = validatePhone(value);
        if (!isValid) {
            phoneError.textContent = "Le numéro de téléphone ne correspond pas au format attendu (ex. 06 12 34 56 78).";
            phoneError.classList.remove('hidden');
            phoneInput.classList.add('border-red-500', 'focus:ring-red-500');
            return false;
        } else {
            phoneError.classList.add('hidden');
            phoneInput.classList.remove('border-red-500', 'focus:ring-red-500');
            return true;
        }
    }

    if (phoneInput) {
        phoneInput.addEventListener('input', () => {
            if (phoneInput.value.trim() === '') {
                phoneError.classList.add('hidden');
                phoneInput.classList.remove('border-red-500', 'focus:ring-red-500');
            } else {
                validatePhoneField();
            }
        });
    }

    // File Upload Logic
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const dropZonePrompt = document.getElementById('dropZonePrompt');
    const dropZonePreview = document.getElementById('dropZonePreview');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileIcon = document.getElementById('fileIcon');
    const fileError = document.getElementById('fileError');
    const removeFileButton = document.getElementById('removeFileButton');

    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'zip'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    function validateAndSelectFile(file) {
        if (!file) return;

        const extension = file.name.split('.').pop().toLowerCase();
        
        // Validate Extension
        if (!allowedExtensions.includes(extension)) {
            showFileError("Format non supporté. Veuillez joindre un PDF, PNG, JPG, DOCX ou ZIP.");
            clearFile();
            return;
        }

        // Validate Size
        if (file.size > maxFileSize) {
            showFileError("Fichier trop lourd. La taille maximale autorisée est de 10 Mo.");
            clearFile();
            return;
        }

        // Hide errors
        fileError.classList.add('hidden');
        
        // Update text
        fileName.textContent = file.name;
        fileSize.textContent = formatBytes(file.size);

        // Set file icon based on extension
        if (['png', 'jpg', 'jpeg'].includes(extension)) {
            fileIcon.className = "bx bx-image";
        } else if (extension === 'zip') {
            fileIcon.className = "bx bx-archive";
        } else {
            fileIcon.className = "bx bx-file";
        }

        // Update UI state
        dropZonePrompt.classList.add('hidden');
        dropZonePreview.classList.remove('hidden');
        
        // Add highlight style to dropzone
        dropZone.classList.add('border-[#411FEB]', 'dark:border-[#5536ED]', 'bg-[#411FEB]/5', 'dark:bg-[#5536ED]/5');
        dropZone.classList.remove('border-gray-200', 'dark:border-gray-800', 'bg-white', 'dark:bg-[#121212]');
    }

    function clearFile() {
        if (!fileInput) return;
        fileInput.value = '';
        dropZonePrompt.classList.remove('hidden');
        dropZonePreview.classList.add('hidden');
        
        // Reset dropzone styles
        dropZone.classList.remove('border-[#411FEB]', 'dark:border-[#5536ED]', 'bg-[#411FEB]/5', 'dark:bg-[#5536ED]/5');
        dropZone.classList.add('border-gray-200', 'dark:border-gray-800', 'bg-white', 'dark:bg-[#121212]');
    }

    function showFileError(msg) {
        fileError.textContent = msg;
        fileError.classList.remove('hidden');
    }

    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 Octets';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    if (dropZone) {
        // Click zone to trigger input
        dropZone.addEventListener('click', (e) => {
            // Ignore click if remove button was clicked
            if (e.target.closest('#removeFileButton')) return;
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                validateAndSelectFile(fileInput.files[0]);
            }
        });
    }

    if (removeFileButton) {
        removeFileButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent trigger click on dropZone
            clearFile();
            fileError.classList.add('hidden');
        });
    }

    if (dropZone) {
        // Drag & Drop event listeners
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('border-[#411FEB]', 'dark:border-[#5536ED]', 'bg-[#411FEB]/5', 'dark:bg-[#5536ED]/5');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (fileInput.files.length === 0) {
                    dropZone.classList.remove('border-[#411FEB]', 'dark:border-[#5536ED]', 'bg-[#411FEB]/5', 'dark:bg-[#5536ED]/5');
                }
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                fileInput.files = files; // Assign files to input
                validateAndSelectFile(files[0]);
            }
        });
    }

    // Submission Logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        // 1. Vérifier le honeypot (anti-bots)
        if (formData.get('_honey')) {
            console.log('Spam détecté : honeypot rempli');
            return;
        }

        // 2. Vérifier le temps minimum (3 secondes - anti-soumission automatique)
        const timeSinceLoad = Date.now() - formLoadTime;
        if (timeSinceLoad < 3000) {
            alert("Veuillez prendre le temps de remplir le formulaire correctement.");
            return;
        }

        // 3. Vérifier la longueur minimale du message
        const message = formData.get('message') || '';
        if (message.length < 10) {
            alert("Votre message est trop court. Veuillez fournir plus de détails.");
            return;
        }

        // 3b. Vérifier la validité de l'adresse mail
        if (!validateEmailField()) {
            emailInput.focus();
            return;
        }

        // 3c. Vérifier la validité du budget (obligatoire)
        if (!validateBudgetField()) {
            budgetError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // 4. Vérifier la validité du numéro de téléphone
        if (!validatePhoneField()) {
            phoneInput.focus();
            return;
        }

        // Mettre à jour le sujet pour l'email reçu
        formData.set('_subject', formData.get('subject') || 'Nouveau message');

        // State indicators
        const submitBtn = document.getElementById('submitBtn');
        const submitBtnText = submitBtn.querySelector('span');
        const submitBtnIcon = submitBtn.querySelector('i');

        // Loading State
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        submitBtnText.textContent = 'Envoi en cours...';
        submitBtnIcon.className = 'bx bx-loader-alt animate-spin';

        try {
            const response = await fetch(form.action, {
                method: form.method,
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                formMessage.classList.remove('hidden');
                form.reset();
                clearFile();
                // Reset budget selections visual state
                budgetPills.forEach(p => {
                    p.classList.remove('border-[#411FEB]', 'bg-[#411FEB]/10', 'text-[#411FEB]', 'dark:border-[#5536ED]', 'dark:bg-[#5536ED]/10', 'dark:text-[#5536ED]');
                    p.classList.add('border-gray-200', 'dark:border-gray-800', 'text-gray-600', 'dark:text-gray-400', 'bg-white', 'dark:bg-[#121212]');
                });
                budgetError.classList.add('hidden');
                // Reset email validation state
                emailError.classList.add('hidden');
                emailInput.classList.remove('border-red-500', 'focus:ring-red-500');
                // Reset phone validation state
                phoneError.classList.add('hidden');
                phoneInput.classList.remove('border-red-500', 'focus:ring-red-500');
                phoneInput.placeholder = '06 12 34 56 78';
                setTimeout(() => formMessage.classList.add('hidden'), 5000);
            } else {
                alert("Une erreur est survenue. Veuillez réessayer.");
            }
        } catch (err) {
            alert("Impossible d'envoyer le message. Vérifiez votre connexion et réessayez.");
        } finally {
            // Reset Button State
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            submitBtnText.textContent = 'Envoyer';
            submitBtnIcon.className = 'bx bx-send-alt';
        }
    });
});
