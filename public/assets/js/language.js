document.addEventListener('DOMContentLoaded', () => {
    const defaultLang = 'fr';
    const supportedLangs = ['fr', 'en'];
    let translations = {};

    // 1. Determine Language
    function getLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        let lang = urlParams.get('lang');

        // If URL param is valid, it takes format priority
        if (lang && supportedLangs.includes(lang)) {
            // If explicit param, save preference
            localStorage.setItem('lang', lang);
            return lang;
        }

        // If no param, check storage
        const storedLang = localStorage.getItem('lang');
        if (storedLang && supportedLangs.includes(storedLang)) {
            return storedLang;
        }

        // Feature: Auto-detect Browser Lang for new users
        // If navigator.language starts with 'en', suggest EN
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && browserLang.startsWith('en')) {
            return 'en';
        }

        return defaultLang;
    }

    const currentLang = getLanguage();
    
    // Update the switcher immediately to avoid flickering while fetching translations
    updateSwitcher(currentLang);

    // 2. Load Translations
    // We fetch the JSON file containing translations.

    async function loadTranslations() {
        try {
            const response = await fetch('/assets/data/translations.json');
            translations = await response.json();
            applyLanguage(currentLang);
            updateUrl(currentLang);
        } catch (error) {
            console.error('Could not load translations:', error);
        }
    }

    // 3. Apply Translations
    function applyLanguage(lang) {
        if (!translations[lang]) return;

        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                // Check if it's an input with placeholder
                if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                    el.placeholder = translations[lang][key];
                } else {
                    el.textContent = translations[lang][key];
                }
            }
        });

        // Update Links to preserve ?lang= param
        // Only internal links
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel:') || href.startsWith('sms:') || href.startsWith('javascript:')) return;

            // If current lang is NOT default, append param
            // If default, remove param (clean URL) - per constraint "FR par défaut"
            // Constraint: "FR par défaut : https://wizyx.me/services ou https://wizyx.me/services?lang=fr"
            // "Une seule URL par page... ?lang="

            const url = new URL(link.href, window.location.origin);
            if (lang !== defaultLang) {
                url.searchParams.set('lang', lang);
            } else {
                url.searchParams.delete('lang');
            }
            link.href = url.pathname + url.search; // Keep hash if any? url.hash
        });

        // Update Language Switcher State
        updateSwitcher(lang);
    }

    // 4. Update URL (History API)
    function updateUrl(lang) {
        const url = new URL(window.location);
        const currentParam = url.searchParams.get('lang');

        if (lang !== defaultLang) {
            if (currentParam !== lang) {
                url.searchParams.set('lang', lang);
                window.history.replaceState({}, '', url);
            }
        } else {
            // Default language: remove param if we want clean URLs, OR keep it if user explicitly chose it?
            // "il n’y a pas de paramètre ?lang= dans l’URL" => implies clean URL for FR default detection.
            // But "FR ... : ...services?lang=fr" is also allowed.
            // Let's clean it for aesthetics if it's standard FR logic, unless specifically requested to keep.
            // User example: "FR par défaut : ...services ou ...services?lang=fr"
            // But "EN : ...services?lang=en"
            // I'll keep it clean for FR to match the "Detection... si il n'y a pas de param" logic.
            if (currentParam) {
                url.searchParams.delete('lang');
                window.history.replaceState({}, '', url);
            }
        }
    }

    // 5. Switcher Logic
    function updateSwitcher(lang) {
        const switcherBtns = document.querySelectorAll('.lang-toggle, #lang-toggle');
        
        const frSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" class="w-5 h-auto rounded-sm shadow-sm"><rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#FFFFFF"/><rect x="2" width="1" height="2" fill="#EF4135"/></svg>`;
        const enSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" class="w-5 h-auto rounded-sm shadow-sm"><clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="t"><path d="M30,15 h30 v15 z v-15 h-30 z h-30 v-15 z v15 h30 z"/></clipPath><g clip-path="url(#s)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#t)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g></svg>`;

        if (switcherBtns.length > 0) {
            // Example: click simply toggles between the two
            const nextLang = lang === 'fr' ? 'en' : 'fr';
            const flagSvg = nextLang === 'fr' ? frSvg : enSvg;
            
            switcherBtns.forEach(btn => {
                btn.innerHTML = flagSvg;
                btn.onclick = (e) => {
                    e.preventDefault();
                    setLanguage(nextLang);
                };
            });
        }

        // If we have distinct buttons
        const frBtn = document.getElementById('lang-btn-fr');
        const enBtn = document.getElementById('lang-btn-en');
        if (frBtn) {
            frBtn.classList.toggle('font-bold', lang === 'fr');
            frBtn.classList.toggle('opacity-50', lang !== 'fr');
        }
        if (enBtn) {
            enBtn.classList.toggle('font-bold', lang === 'en');
            enBtn.classList.toggle('opacity-50', lang !== 'en');
        }
    }

    window.setLanguage = function (lang) {
        if (!supportedLangs.includes(lang)) return;
        localStorage.setItem('lang', lang);

        // Reload is NOT forced, but we update state
        applyLanguage(lang);
        updateUrl(lang);
    }

    loadTranslations();
});
