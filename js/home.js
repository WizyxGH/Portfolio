document.addEventListener("DOMContentLoaded", () => {
    // --- Typewriter Effect ---
    const texts = ["Product Designer", "UI/UX Designer", "Web Designer", "Copywriter", "Rédacteur", "Rêveur", "Voyageur"];
    const typingSpeed = 150;
    const erasingSpeed = 100;
    const delayBetween = 3000;

    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typewriter = document.getElementById("typewriter");

    function type() {
        if (!typewriter) return; // Guard clause
        const currentText = texts[textIndex];

        if (isDeleting) {
            charIndex--;
            typewriter.textContent = currentText.substring(0, charIndex);
            if (charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                setTimeout(type, typingSpeed);
            } else {
                setTimeout(type, erasingSpeed);
            }
        } else {
            charIndex++;
            typewriter.textContent = currentText.substring(0, charIndex);
            if (charIndex === currentText.length) {
                isDeleting = true;
                setTimeout(type, delayBetween);
            } else {
                setTimeout(type, typingSpeed);
            }
        }
    }

    type();

    // --- Animation on Scroll ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const delayStep = 150;
    const maxDelaySteps = 2;
    document.querySelectorAll('.animate-on-scroll').forEach((el, i) => {
        const delay = Math.min(i, maxDelaySteps) * delayStep;
        el.style.transitionDelay = `${delay}ms`;
        observer.observe(el);
    });

    // --- Testimonials Truncation ---
    const lineHeight = 24;
    const maxLines = 7;

    document.querySelectorAll(".testimonial").forEach(testimonial => {
        const fullText = testimonial.dataset.fulltext;
        const textEl = testimonial.querySelector(".testimonial-text");
        let isExpanded = false;

        const toggleButton = document.createElement("span");
        toggleButton.className = "font-bold underline text-[#411FEB] dark:text-[#5536ED] cursor-pointer ml-1";
        toggleButton.textContent = "Lire plus";
        toggleButton.addEventListener("click", () => {
            isExpanded = !isExpanded;
            if (isExpanded) {
                textEl.textContent = fullText;
                textEl.appendChild(toggleButton);
                toggleButton.textContent = "Réduire";
            } else {
                showTruncatedText();
            }
        });

        function showTruncatedText() {
            if (!fullText) return;
            const words = fullText.split(" ");
            let truncated = "";
            const clone = textEl.cloneNode(true);
            clone.style.visibility = "hidden";
            clone.style.position = "absolute";
            clone.style.width = textEl.offsetWidth + "px";
            clone.style.height = "auto";
            clone.style.whiteSpace = "normal";
            document.body.appendChild(clone);

            for (let i = 0; i < words.length; i++) {
                clone.textContent = truncated + words[i] + "… Lire plus";
                if (clone.offsetHeight > lineHeight * maxLines) break;
                truncated += words[i] + " ";
            }

            textEl.textContent = truncated.trim() + "…";
            textEl.appendChild(toggleButton);
            toggleButton.textContent = "Lire plus";

            document.body.removeChild(clone);
        }

        showTruncatedText();
    });

    // --- Generic Read More (if any remaining) ---
    document.querySelectorAll('.read-more-btn').forEach(button => {
        button.addEventListener('click', () => {
            const text = button.previousElementSibling.querySelector('.toggle-text');
            text.classList.toggle('line-clamp-3');
            const expanded = !text.classList.contains('line-clamp-3');
            button.textContent = expanded ? 'Lire moins' : 'Lire plus';
        });
    });
});
