const fs = require('fs');

const content = fs.readFileSync('src/pages/services/ui-ux.astro', 'utf8');
const scriptStart = content.indexOf('<script>');
let scriptContent = content.substring(scriptStart);

// Apply TS fixes:
scriptContent = scriptContent.replace('<script>', '<script lang="ts">');
scriptContent = scriptContent.replace('function activateStep(activeStepId) {', 'function activateStep(activeStepId: string | null) {');
scriptContent = scriptContent.replace('totalStepsHeight += step.offsetHeight;', 'totalStepsHeight += (step as HTMLElement).offsetHeight;');
scriptContent = scriptContent.replace('const containerHeight = stepsContainer.offsetHeight;', 'const containerHeight = (stepsContainer as HTMLElement).offsetHeight;');
scriptContent = scriptContent.replace('previousStepsHeight += processSteps[i].offsetHeight;', 'previousStepsHeight += (processSteps[i] as HTMLElement).offsetHeight;');
scriptContent = scriptContent.replace('const activeStepHeight = processSteps[activeIndex].offsetHeight;', 'const activeStepHeight = (processSteps[activeIndex] as HTMLElement).offsetHeight;');
scriptContent = scriptContent.replace('const activeStepHeight = processSteps[0].offsetHeight;', 'const activeStepHeight = (processSteps[0] as HTMLElement).offsetHeight;');
scriptContent = scriptContent.replace('let carouselTimer = null;', 'let carouselTimer: any = null;');
scriptContent = scriptContent.replace('const slideWidth = carouselSlides[0].offsetWidth;', 'const slideWidth = (carouselSlides[0] as HTMLElement).offsetWidth;');
scriptContent = scriptContent.replace('carouselTrack.style.transform = `translateX(-${translateAmt}px)`;', '(carouselTrack as HTMLElement).style.transform = `translateX(-${translateAmt}px)`;');
scriptContent = scriptContent.replace('const dots = carouselDots.querySelectorAll("button");', 'if (!carouselDots) return;\n                const dots = carouselDots.querySelectorAll("button");');
scriptContent = scriptContent.replace('const faqItems = document.querySelectorAll("#faqList details");\n            faqItems.forEach((item) => {', 'const faqItems = document.querySelectorAll("#faqList details");\n            faqItems.forEach((item) => {\n                const detailsItem = item as HTMLDetailsElement;');
scriptContent = scriptContent.replace('item.addEventListener("toggle", () => {', 'detailsItem.addEventListener("toggle", () => {');
scriptContent = scriptContent.replace('if (!item.open) return;', 'if (!detailsItem.open) return;');
scriptContent = scriptContent.replace('if (other !== item) other.open = false;', 'if (other !== detailsItem) (other as HTMLDetailsElement).open = false;');
scriptContent = scriptContent.replace('item.addEventListener("click", (e) => {', 'detailsItem.addEventListener("click", (e) => {\n                    const target = e.target as HTMLElement;\n                    if (!target) return;');
scriptContent = scriptContent.replace("if (e.target.tagName === 'A' || window.getSelection().toString()) return;", "if (target.tagName === 'A' || window.getSelection()?.toString()) return;");
scriptContent = scriptContent.replace("if (item.open && !e.target.closest('summary')) {", "if (detailsItem.open && !target.closest('summary')) {");
scriptContent = scriptContent.replace('item.open = false;', 'detailsItem.open = false;');

const newUIUX = `---
import Layout from '../../layouts/Layout.astro';
import HeroSection from '../../components/services/ui-ux/HeroSection.astro';
import PainPoints from '../../components/services/ui-ux/PainPoints.astro';
import Benefits from '../../components/services/ui-ux/Benefits.astro';
import Process from '../../components/services/ui-ux/Process.astro';
import Pricing from '../../components/services/ui-ux/Pricing.astro';
import Testimonials from '../../components/services/ui-ux/Testimonials.astro';
import FAQ from '../../components/services/ui-ux/FAQ.astro';
import CTA from '../../components/services/ui-ux/CTA.astro';
---
<Layout title="Freelance UI/UX Designer - Refonte, Audit & Design d'interfaces - Florian Gertner Kilian" description="Besoin d'une refonte, d'un audit UX/UI ou de concevoir votre site/application ? Je crée des interfaces" body_class="">
    <main class="flex-1 flex flex-col">
        <HeroSection />
        <PainPoints />
        <Benefits />
        <Process />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTA />
    </main>

${scriptContent}`;

fs.writeFileSync('src/pages/services/ui-ux.astro', newUIUX);
console.log("ui-ux.astro completely refactored!");
