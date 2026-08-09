// ─────────────────────────────────────────────────────────────────────────────
//  Contenu de /candidature-briveo — textes et données uniquement.
//
//  Ce fichier est volontairement séparé de la page : il ne contient aucun
//  markup, aucune CSS, aucun script. On peut donc le retravailler sans jamais
//  entrer en conflit avec des modifications de structure ou de style.
//
//  Les chaînes de LETTRE acceptent du HTML inline (<strong>, <mark>) : elles
//  sont injectées via set:html côté page.
// ─────────────────────────────────────────────────────────────────────────────

// Format international : les recruteurs enregistrent le numéro tel quel, et
// le lien tel: doit rester sans espaces pour être composable partout.
export const TEL_DISPLAY = '+33 7 78 40 78 87';
export const TEL_HREF = '+33778407887';

// Parcours réel, repris de l'export LinkedIn. Les logos vivent déjà dans
// public/assets/media/brands/ ; ceux qui manquent tombent sur un monogramme.
// Le badge de contrat porte sa propre couleur : le poste actuel doit se
// repérer d'un coup d'œil dans la colonne.
// `Record<string, string>` est nécessaire : sans lui TypeScript infère la
// forme exacte de l'objet et refuse de l'indexer avec une chaîne quelconque.
// Chaque libellé est listé explicitement plutôt que de laisser un repli
// silencieux ranger un CDD ou une alternance dans le style « stage ».
export const CONTRAT_STYLE: Record<string, string> = {
  CDI: 'poste',
  CDD: 'poste',
  Alternance: 'poste',
  Freelance: 'freelance',
  Stage: 'stage',
  Stages: 'stage',
};

// Type explicite : sans lui, TypeScript infère une union depuis les deux
// formes de `stages` (avec et sans `lieu`) et refuse ensuite d'y accéder.
export type Experience = {
  logo: string | null;
  logoZoom?: boolean;
  theme?: string;
  mono?: string | null;
  contrat: string;
  entreprise: string;
  poste: string;
  periode: string;
  lieu?: string;
  texte?: string;
  stages?: { periode: string; lieu?: string; texte: string }[];
};

export const EXPERIENCES: Experience[] = [
  {
    logo: '/assets/media/brands/Kosmos%20Digital.svg',
    theme: 'dark',
    mono: null,
    contrat: 'CDI',
    entreprise: 'Kosmos Digital',
    poste: 'UI/UX Designer',
    periode: 'Depuis juillet 2026',
    lieu: 'Villeneuve-Loubet, France',
    texte:
      "Ateliers de cadrage avec prospects et clients, identité visuelle et guidelines, design systems (composants, règles, scalabilité), user flows et architecture de l'information, maquettes haute fidélité responsive, prototypage interactif ainsi que les spécifications transmises aux développeurs.",
  },
  {
    logo: '/assets/media/logo.webp',
    theme: 'dark',
    mono: null,
    contrat: 'Freelance',
    entreprise: 'Wizyx — indépendant',
    poste: 'Product Designer',
    periode: 'Depuis février 2026',
    lieu: 'Remote',
    texte:
      "Design produit de bout en bout comme refonte d'existant en lien étroit avec des fondateurs : cadrage, recherche, maquettes, design system, prototypes, UX writing.",
  },
  {
    // Verrouillage horizontal d'origine : la licorne se retrouvait minuscule
    // à côté du lettrage. Version recadrée sur la seule marque, comme sur
    // leur page LinkedIn.
    logo: '/assets/media/brands/Digital%20Unicorn%20Mark.svg',
    logoZoom: true,
    theme: 'dark',
    mono: null,
    // Même poste, même agence, deux contrats qui se suivent : l'en-tête ne se
    // répète pas. Pas de lieu ici non plus — le stage était sur place, le CDD
    // à distance, chaque ligne porte donc le sien.
    contrat: 'Stage puis CDD',
    entreprise: 'Digital Unicorn',
    poste: 'UI/UX Designer',
    periode: 'Mars – juillet 2025',
    texte:
      "Trois mois dans une agence de développement informatique internationale, à l'autre bout du monde.",
    // Antéchronologique, comme le reste du parcours : le plus récent d'abord.
    stages: [
      {
        periode: 'Juillet 2025 · CDD',
        lieu: 'Remote',
        texte:
          "L'agence m'a gardé un mois de plus, en contrat, pour terminer un projet en cours, faire une présentation à un client sur Paris ainsi qu'aller rencontrer un prospect.",
      },
      {
        periode: 'Mars – juin 2025 · Stage',
        lieu: 'Đà Nẵng, Vietnam',
        texte:
          "Maquettes de sites, d'applications et de jeux mobiles, product design, UX writing, copywriting, management d'équipe, et des rendez-vous clients et prospects menés en ligne comme en présentiel.",
      },
    ],
  },
  {
    logo: '/assets/media/brands/Mafigue.svg',
    theme: 'dark',
    mono: null,
    contrat: 'Stage',
    entreprise: 'Mafigue',
    poste: 'UI/UX Designer & stratège en communication',
    periode: 'Janvier – mars 2024 · 3 mois',
    lieu: "La Ciotat, France",
    texte:
      "Création de maquettes de sites internet et d'applications, mise en place et exécution d'une stratégie de communication, rédaction de contenus pour les réseaux sociaux.",
  },
  {
    logo: '/assets/media/brands/optimum-cit.png',
    theme: 'light',
    mono: null,
    contrat: 'Stages',
    entreprise: 'OPTIMUM CIT',
    poste: 'Développeur web',
    periode: '',
    lieu: 'La Seyne-sur-Mer, France',
    // Deux stages, même poste et même entreprise : l'en-tête ne se répète pas.
    // Descriptions reprises telles quelles de LinkedIn.
    stages: [
      {
        periode: 'Janvier – février 2023',
        texte:
          "Aide à la mise en place d'un projet de digitalisation de l'entreprise au sein de l'ensemble des services.",
      },
      {
        periode: 'Mai – juin 2022',
        texte:
          "Adaptation du logiciel Optimum Live pour les opticiens et les audioprothésistes pour permettre sa traduction afin de s'internationaliser et atteindre un public mondial.",
      },
    ],
  },
];

// `niveau` fait pour la formation ce que `contrat` fait pour les expériences :
// une étiquette qui se lit avant le texte, pour que les deux onglets du CV
// aient la même grammaire visuelle.
export const FORMATION = [
  {
    logo: '/assets/media/brands/ecv.png',
    theme: 'light',
    mono: null,
    titre: 'Master 1 UX/UI Design',
    ecole: 'ECV — École de création visuelle',
    niveau: 'Bac +4',
    periode: '2025 – 2026',
    lieu: 'Aix-en-Provence, France',
  },
  {
    logo: '/assets/media/brands/univ-toulon.png',
    theme: 'light',
    mono: null,
    titre: 'BUT MMI — Métiers du multimédia et de l’internet',
    ecole: 'Université de Toulon',
    niveau: 'Bac +3',
    periode: '2023 – 2025',
    lieu: 'Toulon, France',
  },
  {
    logo: null,
    mono: 'LB',
    titre: 'BTS SIO (informatique) — Services Informatiques aux Organisations',
    ecole: 'Lycée Bonaparte',
    niveau: 'Bac +2',
    periode: '2021 – 2023',
    lieu: 'Toulon, France',
  },
];

// Liens du pied de page, repris du vrai footer de wizyx.me. Malt atteste
// d'une activité indépendante réelle, Figma donne accès aux fichiers eux-mêmes.
export const LIENS_TRAVAIL = [
  { nom: 'wizyx.me', url: 'https://wizyx.me/' },
  { nom: 'Mes réalisations', url: 'https://wizyx.me/creations' },
  { nom: 'Mes services', url: 'https://wizyx.me/services' },
  { nom: 'À propos', url: 'https://wizyx.me/about' },
];

export const LIENS_RESEAUX = [
  { nom: 'GitHub', url: 'https://github.com/WizyxGH' },
  { nom: 'WhatsApp', url: 'https://wa.me/33778407887' },
];

// Chapitrage de la barre de progression. L'ordre doit suivre l'ordre réel des
// sections dans le DOM : les largeurs sont ensuite calculées depuis les
// positions mesurées, donc un segment = la hauteur de scroll réelle du bloc.
export const CHAPITRES = [
  { id: 'top', label: 'Intro' },
  { id: 'criteres', label: 'Vos critères' },
  { id: 'cv', label: 'Mon parcours' },
  { id: 'profil', label: 'Qui suis-je ?' },
  { id: 'lettre', label: 'Manifeste' },
  { id: 'test', label: 'Me tester' },
  { id: 'contact', label: 'On en discute ?' },
];

export const OFFRE = {
  intitule: 'Product Designer',
  lieu: 'Nice (HQ) / Remote-friendly',
  contrat: 'CDI ou freelance',
  criteres: [
    'Expérience product/design 3+ ans',
    'Sensibilité au luxe et à la précision',
    'Capacité à interagir directement avec les utilisateurs',
  ],
};

// `litteral` sert aux valeurs qui ne sont pas des nombres : le compteur
// animé ne saurait pas compter jusqu'à l'infini, et la blague ne marche que
// si le glyphe est posé d'emblée au milieu de chiffres qui, eux, défilent.
export const STATS: { valeur?: number; suffixe?: string; litteral?: string; label: string }[] = [
  { valeur: 3, suffixe: '', label: "Années d'expérience" },
  { valeur: 20, suffixe: '+', label: 'Projets menés à bien' },
  { valeur: 100, suffixe: '%', label: 'Clients satisfaits' },
  { valeur: 4, suffixe: '', label: 'Entreprises · dont 3 mois au Vietnam' },
  { litteral: '∞', label: 'Temps passé à concevoir et sur Figma' },
];

// Version courte et volontairement non prescriptive. Le détail d'origine
// (nombre d'entretiens, profils ciblés, parcours à refondre) décidait à leur
// place de leurs priorités, alors que l'étape 01 prétend justement écouter.
// Jeu d'icônes au trait, dans l'esprit lucide utilisé par briveo.fr :
// même grille 24, même épaisseur, mêmes terminaisons arrondies.
export const ico = (inner: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;

export const SKILLS = [
  {
    titre: 'Design produit',
    texte: "Cadrage, parcours, arbitrages de périmètre, priorisation. Surtout : savoir ce qu'on ne fait pas.",
    icon: ico('<circle cx="12" cy="12" r="9"/><path d="M15.9 8.1l-2 5.8-5.8 2 2-5.8z"/>'),
  },
  {
    titre: 'UI & design system',
    texte: 'Tokens, composants, états, documentation. Une interface qui reste cohérente après six mois de sprints.',
    icon: ico('<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>'),
  },
  {
    titre: 'UX research',
    texte: "Entretiens, questionnaires, tests d'utilisabilité. Interroger ceux qui ont abandonné, pas seulement ceux qui sont restés.",
    icon: ico('<circle cx="9" cy="7.5" r="3.6"/><path d="M2.5 20.5v-1.6a4 4 0 014-4h5a4 4 0 014 4v1.6"/><path d="M16.5 4.3a3.6 3.6 0 010 6.9"/><path d="M18.8 15.2a4 4 0 013 3.7v1.6"/>'),
  },
  {
    titre: 'UX writing & copywriting',
    texte: "Les mots d'une interface font partie de l'interface. Sur un acte à 450 000 €, une phrase mal écrite coûte une vente.",
    icon: ico('<path d="M12.5 20.5H21"/><path d="M16.4 3.9a2.1 2.1 0 013 3L7.3 19H4.2l.1-3.1z"/>'),
  },
  {
    titre: 'Interfaces métier',
    texte: "Tableaux de bord, densité d'information, hiérarchies complexes. Rendre lisible ce qui est objectivement compliqué.",
    icon: ico('<path d="M3.5 3.5v17h17"/><path d="M18 16.5V9"/><path d="M13 16.5V5.5"/><path d="M8 16.5v-3.5"/>'),
  },
  {
    titre: 'Front-end',
    texte: 'HTML, CSS, intégration. Assez pour prototyper vrai, dialoguer avec les devs et livrer des specs exécutables.',
    icon: ico('<path d="M15.5 17.5L21 12l-5.5-5.5"/><path d="M8.5 6.5L3 12l5.5 5.5"/><path d="M13.5 4l-3 16"/>'),
  },
];

// Traits tirés de wizyx.me/about — chacun est relié à un enjeu concret de Briveo,
// sinon c'est du remplissage sympathique et ça ne fait recruter personne.
//
// Règle de cette section : elle ne contient QUE ce qu'une annonce ne sait pas
// demander. Tout ce qui répond à un critère de l'offre appartient à « Vos
// critères », et les recommandations au bandeau qui la suit. Trois entrées ont
// été retirées à ce titre, pas par faiblesse : « Énergie » reprenait mot pour
// mot deux citations du bandeau, « Rédactionnel » répondait à l'UX writer de
// l'intitulé, « Curiosité » rejouait le Vietnam déjà cité deux fois plus haut.
export const TRAITS = [
  {
    tag: 'Persévérance',
    titre: '10 km par jour pendant 100 jours.',
    texte:
      "Challenge lancé et réussi à mes 20 ans, suivi de mon premier marathon cette année ! en 4 h 28 min 35 sec (oui, les secondes sont importantes). C'est probablement le même travers qui me fait aligner chaque élément au pixel sur une interface. Un design system ne se gagne pas au sprint : il se tient sur la durée jours lorsque plus personne n'y prête attention.",
  },
  {
    tag: 'Autonomie',
    titre: 'Autonome, mais pas solitaire.',
    texte:
      "Quatorze ans de sport collectif (sept ans de football et autant d'années de basket), m'ont appris que même si on est capable d'avancer tout seul, il est possible d'aller encore plus loin en groupe.",
  },
  {
    tag: 'Franchise',
    titre: 'Je dis quand je ne sais pas.',
    texte:
      "Autodidacte avant d'être diplômé, j'ai appris que bluffer coûte toujours plus cher que demander. Vous construisez un produit dont l'argument central est la transparence : je serais très mal placé pour vous vendre du vernis. L'honnêteté et la transparence prime toujours malgré ceux que l'on peut nous faire croire.",
  },
  {
    tag: 'Entrepreneuriat',
    titre: "Je gère ma propre activité, et l'immobilier m'intéresse.",
    texte:
      "En tant que freelance, je prospecte, je chiffre, je contractualise, je livre et je relance seul. Ça donne un rapport très concret à la valeur d'un produit. Entre ce qu'il coûte à faire, ce qu'un client accepte de payer, pourquoi il signe ou pourquoi il part. Pour de futurs investissements, l'immobilier m'intéresse depuis longtemps. Avec vous, ces deux curiosités arrêtent d'être des à-côtés.",
  },
  {
    tag: 'Gestion',
    titre: "J'archive des bandes dessinées Disney du monde entier.",
    texte:
      "Je contribue depuis des années à une base communautaire qui recense des magazines publiés dans des dizaines de pays. Concrètement : normaliser des métadonnées, arbitrer des cas limites, tenir un référentiel que des inconnus interrogeront encore dans dix ans. J'aime quand l'environnement est structuré et organisé afin de faciliter la recherche d'informations.",
  },
];

// Tous les témoignages publics du portfolio, réunis. Les deux « Coming
// soon… » de wizyx.me sont écartés : un témoignage vide ne prouve rien, et
// dans un bandeau défilant il se lirait comme un trou. `avatar` est une clé,
// pas un chemin : la page fait la correspondance avec ses imports, seule
// façon de laisser astro:assets optimiser les images.
export const TEMOIGNAGES = [
  {
    avatar: 'caroline',
    auteur: 'Caroline Aubert',
    role: 'Product Designer & fondatrice de Mafigue',
    texte:
      "Motivé, hyper proactif, enseignable, il a su, dès les premiers jours, être opérationnel. […] Je recommande son profil à l'embauche si vous souhaitez ne pas prendre de risque, puisqu'il coche toutes les cases.",
  },
  {
    avatar: 'lucas',
    auteur: 'Lucas Kacem',
    role: 'Co-fondateur & Président, Digital Unicorn',
    texte:
      "Super impliqué, intelligent et toujours dans l'action, il a vraiment apporté de la valeur à l'équipe.",
  },
  {
    avatar: 'jonathan',
    auteur: 'Jonathan Vaissière',
    role: 'Entrepreneur, Le Guide du Golfe de Saint-Tropez',
    texte:
      "Un travail pro et sérieux comme on aime et surtout comme on a BESOIN ! […] Rapide, efficace et agréable.",
  },
];

export const OBJECTIONS = [
  {
    q: 'Vous êtes jeune.',
    r: "Oui. Et j'ai trois ans de pratique, déjà une vingtaine de projets délivrés dans divers environnements, des clients satisfaits et qui acceptent de mettre leur nom sous un témoignage. Le portfolio est en ligne, ouvert, daté. Jugez mon travail avant une date de naissance.",
  },
  {
    q: 'Vous ne venez pas de l\'immobilier.',
    r: "Non. Je viens du design produit où l'on peut changer très vite d'un contexte à l'autre en fonction du brief client. La loi Hoguet, le DPE et le registre des mandats, ça s'apprend. L'obsession du détail, non.",
  },
  {
    q: 'CDI ou freelance ?',
    r: "Vous laissez le choix, je le prends : le CDI. Je cherche une collaboration longue pour comprendre vos utilisateurs, structurer le design system avec les équipes dev, puis refondre et mesurer dans la durée. En mission ponctuelle, c'est faisable, mais une vraie valeur se construit dans le temps au fil des retours et itérations. L'objectif est de mener Briveo au plus haut.",
  },
  {
    q: 'Product manager, designer ou UX writer ?',
    r: "Vous cherchez les trois et cela tombe bien : le design produit et l'UX writing sont mon quotidien, le cadrage produit je le pratique depuis que je travaille en direct avec des fondateurs. Et je code assez pour ne pas faire perdre de temps à votre équipe tech.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Lettre de motivation
//
//  Une entrée = un bloc, dans l'ordre d'affichage. Ajouter, supprimer ou
//  déplacer un paragraphe se fait ici, sans toucher au markup.
//    · 'hi'    — la salutation
//    · 'lead'  — le chapô, en corps légèrement plus grand
//    · 'p'     — un paragraphe courant
//    · 'quote' — la phrase détachée, sur fond crème avec filet émeraude
//
//  `texte` accepte du HTML inline : <strong> pour appuyer, <mark> pour
//  surligner, &nbsp; pour une espace insécable avant « : » ou « ? ».
// ─────────────────────────────────────────────────────────────────────────────
export type BlocLettre = { type: 'hi' | 'lead' | 'p' | 'quote'; texte: string };

export const LETTRE: BlocLettre[] = [
  { type: 'hi', texte: 'Bonjour,' },
  {
    type: 'lead',
    texte:
      "Je postule à beaucoup moins d'offres qu'on ne l'imagine. Celle-ci, je l'ai lue deux fois, puis j'ai passé la soirée sur briveo.fr — d'abord par curiosité, ensuite parce que je n'ai pas réussi à en sortir.",
  },
  {
    type: 'p',
    texte: "Ce qui m'a retenu, ce n'est pas «&nbsp;l'IA dans l'immobilier&nbsp;».",
  },
  {
    type: 'quote',
    texte: "C'est que vous avez pris le problème par la friction plutôt que par la promesse.",
  },
  {
    type: 'p',
    texte:
      "Ce qui coince dans une vente n'est jamais la promesse&nbsp;: c'est l'attente sans nouvelles, le prix qu'on ne sait pas justifier, les papiers qu'on ressaisit trois fois. Un produit qui s'attaque à ça d'abord fait des <strong>choix de conception, pas du marketing</strong> — et ça, ça se voit dans une interface.",
  },
  {
    type: 'p',
    texte:
      "Rendre lisible ce qui est compliqué, <mark>c'est exactement le métier que je veux faire</mark>. Chez vous, les montants sont énormes, <strong>la confiance est fragile</strong>, et la moitié des gens qui entrent dans le produit n'ont jamais vendu de leur vie&nbsp;: le terrain le plus exigeant de la catégorie. Et <mark>je suis d'ici</mark> — Nice, Toulon, le Var —, avec un intérêt pour ce marché qui est bien antérieur à votre annonce.",
  },
  {
    type: 'p',
    texte:
      "Mes résultats récents tiennent en une phrase&nbsp;: <strong>des produits en ligne, et des clients qui signent leur nom dessous.</strong> Le site et l'application du Guide du Golfe de Saint-Tropez, redessinés et livrés. JOBBRR et PHOQ.tv, en production. Et le test technique qui m'a valu mon poste chez Kosmos&nbsp;: une maquette, jugée sur pièce.",
  },
  {
    type: 'p',
    texte:
      "Ce que je n'ai pas encore, ce sont des courbes&nbsp;: en agence, on est rarement là six mois après la mise en ligne. <mark>C'est mon projet des deux à trois prochaines années</mark> — <strong>arrêter de livrer et commencer à mesurer ce que je livre.</strong> Un design system tenu dans la durée, une recherche utilisateur continue, et des décisions que je peux relire dans les chiffres. Ça se fait dans une équipe, sur un produit vivant. Pas en mission de trois semaines.",
  },
  {
    type: 'p',
    texte:
      "Sur mon site, ma promesse tient en quatre mots&nbsp;: <strong>fini le blabla, place au concret</strong>. Vous envoyer un PDF aurait été malvenu&nbsp;: j'ai relevé votre design system, reconstruit cette page, et <strong>vous lisez le livrable</strong>.",
  },
];
