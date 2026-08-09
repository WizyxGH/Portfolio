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
          "L'agence m'a gardé un mois de plus, en contrat, pour terminer les chantiers en cours.",
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
      "Auprès de Caroline Aubert, à répondre à des briefs clients en quasi-autonomie. C'est là qu'a été mené le redesign du site et de l'application du Guide du Golfe de Saint-Tropez, et là que j'ai appris à écrire autant qu'à dessiner.",
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
  },
  {
    logo: '/assets/media/brands/univ-toulon.png',
    theme: 'light',
    mono: null,
    titre: 'BUT MMI — Métiers du multimédia et de l’internet',
    ecole: 'Université de Toulon',
    niveau: 'Bac +3',
    periode: '2023 – 2025',
    lieu: 'Toulon',
  },
  {
    logo: null,
    mono: 'LB',
    titre: 'BTS Informatique (SIO)',
    ecole: 'Lycée Bonaparte',
    niveau: 'Bac +2',
    periode: '2021 – 2023',
    lieu: 'Toulon',
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
  { id: 'lettre', label: 'La lettre' },
  { id: 'test', label: 'Me tester' },
];

export const OFFRE = {
  intitule: 'Product Designer',
  lieu: 'Nice (HQ) / Remote-friendly',
  contrat: 'CDI ou freelance',
  criteres: [
    'Expérience product/design 3 ans+',
    'Sensibilité au luxe + à la précision',
    'Capacité à interagir directement avec utilisateurs',
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
// Les deux retards réels sur l'annonce, assumés. Une candidature qui
// n'énumère que des forces se fait démonter au premier entretien.
export const LACUNES = [
  {
    num: '01',
    titre: "L'immobilier, je ne le connais pas encore",
    texte:
      "Je ne vais pas vous raconter que je maîtrise la loi Hoguet, le DPE ou les subtilités d'un mandat exclusif. Je les apprendrai. Ce que je sais faire en revanche, c'est entrer dans un métier en écoutant ceux qui le pratiquent : chez Kosmos, je participe à des ateliers de cadrage sur des secteurs que je découvre le matin même, et j'en ressors avec de quoi dessiner. La mécanique sera la même chez vous, avec vos agents et vos vendeurs.",
  },
  {
    num: '02',
    titre: "Je n'ai pas encore de chiffres d'impact à vous montrer",
    texte:
      "Sur mes projets, j'ai livré des interfaces, pas des courbes de conversion. C'est une vraie limite, et c'est exactement ce qui m'attire chez vous : un produit vivant, avec des utilisateurs, des données publiques et un tunnel qui se mesure. Je veux arrêter de livrer et commencer à mesurer ce que je livre.",
  },
  {
    num: '03',
    titre: 'Ma vitesse d’apprentissage, elle, est documentée',
    texte:
      "BTS informatique, puis BUT MMI, puis Master 1 UX/UI Design : trois disciplines en cinq ans, chacune validée. À 21 ans, 3 mois dans une agence au Vietnam, en français comme en anglais, à mener des rendez-vous clients et prospects. Je n'arrive jamais sur un terrain connu — c'est devenu ma zone de confort.",
  },
];

export const TRAITS = [
  {
    tag: 'Énergie',
    titre: "« Toujours dans l'action » — ce n'est pas moi qui le dis.",
    texte:
      "Deux personnes qui m'ont encadré emploient les mêmes mots sans s'être concertées : « super impliqué, intelligent et toujours dans l'action » (Lucas Kacem, Digital Unicorn), « motivé, hyper proactif, opérationnel dès les premiers jours » (Caroline Aubert, Mafigue). Je préfère arriver avec trois pistes à débattre qu'avec une question à poser. Dans une équipe qui construit vite, ce tempérament fait gagner des semaines.",
  },
  {
    tag: 'Entrepreneuriat',
    titre: "Je gère ma propre activité, et votre marché me passionne déjà.",
    texte:
      "Wizyx n'est pas un projet du dimanche : je prospecte, je chiffre, je contractualise, je livre et je relance seul. Ça donne un rapport très concret à la valeur d'un produit — ce qu'il coûte à faire, ce qu'un client accepte de payer, pourquoi il signe ou pourquoi il part. L'immobilier m'intéresse depuis longtemps en dehors du travail : les prix au mètre carré, ce qui fait vraiment la valeur d'un bien, la façon dont un marché local se retourne. Chez vous, ces deux curiosités arrêtent d'être des à-côtés.",
  },
  {
    tag: 'Archiviste',
    titre: "J'archive des bandes dessinées Disney du monde entier.",
    texte:
      "Je contribue depuis des années à une base communautaire qui recense des magazines publiés dans des dizaines de pays. Concrètement : normaliser des métadonnées, arbitrer des cas limites, tenir un référentiel que des inconnus interrogeront encore dans dix ans. C'est exactement le rapport que Briveo entretient avec le DVF, le cadastre et le registre des mandats. J'aime les données propres au point d'en avoir fait un loisir.",
  },
  {
    tag: 'Persévérance',
    titre: '10 km par jour pendant 100 jours.',
    texte:
      "Objectif tenu. Marathon en 4 h 30, record de semi-marathon en 1 h 43 min 06 s (oui, les secondes sont importantes), ce qui est probablement le même travers que celui qui me fait aligner des chiffres en tabulaire dans une interface. Un design system ne se gagne pas au sprint : il se tient sur la durée jours lorsque plus personne n'y prête attention.",
  },
  {
    tag: 'Autonomie',
    titre: 'Autonome, mais pas solitaire.',
    texte:
      "Je travaille très bien seul : sur Wizyx, je prospecte, je chiffre, je livre et je relance sans que personne n'ait à me suivre. Mais quatorze ans de sport collectif — sept ans de football, sept ans de basket — laissent une trace : je ne confonds pas autonomie et isolement. Je préfère une décision prise à cinq devant un écran à un fichier Figma parfait envoyé par mail, et je vais chercher un avis avant de m'enfermer trois jours sur une piste.",
  },
  {
    tag: 'Rédactionnel',
    titre: "J'écris autant que je dessine.",
    texte:
      "Articles, copywriting, questionnaires, microcopie. Vous cherchez un UX writer dans la même annonce que le designer produit : ce n'est pas un hasard de rédaction, c'est le même geste. Sur un produit où l'utilisateur finit par signer un mandat, le mot juste vaut la maquette juste.",
  },
  {
    tag: 'Curiosité',
    titre: "J'ai pris le goût de voyager avant celui de designer.",
    texte:
      "Trois mois de travail au Vietnam, une tolérance élevée à l'inconnu, et l'habitude de me retrouver quelque part où je ne comprends rien — c'est-à-dire exactement l'état d'un propriétaire qui ouvre votre plateforme pour la première fois. Designer, c'est se souvenir de ce que ça fait de ne pas savoir.",
  },
  {
    tag: 'Franchise',
    titre: 'Je dis quand je ne sais pas.',
    texte:
      "Autodidacte avant d'être diplômé, j'ai appris que bluffer coûte toujours plus cher que demander. Vous construisez un produit dont l'argument central est la transparence : je serais très mal placé pour vous vendre du vernis.",
  },
];

export const OBJECTIONS = [
  {
    q: 'Vous êtes jeune.',
    r: "Oui. Et j'ai trois ans de pratique, déjà une vingtaine de projets délivrés dans divers environnements, des clients satisfaits et qui acceptent de mettre leur nom sous un témoignage. Le portfolio est en ligne, ouvert, daté. Jugez mon travail avant une date de naissance.",
  },
  {
    q: 'Vous ne venez pas de l\'immobilier.',
    r: "Non. Je viens du tourisme haut de gamme sur la Côte d'Azur, des marketplaces à deux faces et des tableaux de bord métier. La loi Hoguet, le DPE et le registre des mandats, ça s'apprend en trois semaines avec vos agents. L'obsession du détail, non.",
  },
  {
    q: 'CDI ou freelance ?',
    r: "Vous laissez le choix, je le prends : le CDI. Mon objectif est une collaboration longue, pas une mission. Concrètement, ce que je viens faire tient en trois temps : écouter d'abord pour cartographier les frictions réelles plutôt que supposées ; systématiser ensuite sur Figma (design system, guidelines, variables...) tout en étant alignés sur ce que vos devs manipulent déjà ; refondre et mesurer enfin, l'UX writing compris, en specs qu'un dev n'a pas à deviner. Aucune de ces trois étapes ne survit à des missions détachées : un design system se tient dans la durée, et la valeur arrive au bout de la deuxième année, pas de la deuxième semaine. Si vous préférez vérifier avant de vous engager, une mission d'essai payée me va très bien : elle mène au même endroit, avec une étape de plus.",
  },
  {
    q: 'Product manager, designer ou UX writer ?',
    r: "Vous cherchez les trois. J'en fais deux et demi : design produit et UX writing sont mon quotidien, le cadrage produit je le pratique depuis que je travaille en direct avec des fondateurs. Et je code assez pour ne pas faire perdre de temps à votre équipe tech.",
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
      "Une estimation sourcée sur des données publiques, un dossier généré plutôt que ressaisi, une commission annoncée avant d'être prise. <strong>Ce sont des décisions produit, pas des arguments marketing.</strong> Elles se voient dans l'interface, et c'est rare.",
  },
  {
    type: 'p',
    texte:
      "Il se trouve que <mark>c'est exactement le métier que je veux faire</mark>&nbsp;: rendre lisible ce qui est compliqué. Des tunnels de vente, des tableaux de bord, des parcours où l'utilisateur prend une décision qui l'engage. Chez vous les montants sont énormes, <strong>la confiance est fragile</strong>, et la moitié des gens qui entrent dans le produit n'ont jamais vendu de leur vie. C'est le terrain le plus exigeant de cette catégorie, et c'est précisément ce qui m'attire.",
  },
  {
    type: 'p',
    texte:
      "Il y a aussi une raison plus simple, et je préfère l'assumer&nbsp;: <mark>je suis d'ici</mark>. Nice, Toulon, le Var, les Alpes-Maritimes. Votre marché m'intéresse depuis longtemps en dehors du travail — les prix au mètre carré, ce qui fait vraiment la valeur d'un bien, la façon dont un marché local se retourne — et je n'ai pas envie de faire ce métier depuis un open space parisien. <strong>Une boîte tech ambitieuse implantée à Nice, ça ne se présente pas tous les ans.</strong>",
  },
  {
    type: 'p',
    texte:
      "Un CV ne prouve pas grand-chose dans un métier où le livrable est visuel. Alors j'ai fait ce que je ferais chez vous&nbsp;: j'ai pris votre design system, je l'ai relevé, reconstruit, et j'ai livré quelque chose de fini plutôt que de vous le décrire.",
  },
];
