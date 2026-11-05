// src/core/config.mjs — configuration centralisée.
// Tout ce qui varie selon le contexte (et non selon la machine) y vit.
// UTMs de provenance des visites. Le site n'ajoute pas de UTM tout seul : c'est
// toi qui, quand tu partsages le lien (post, email, Telegram…), ajoutes les valeurs
// ci-dessous. Conserver les identifiants stables = comparer les canaux plus tard.

export const UTM = {
  // Canaux → identifiants constants. À ne pas changer après validation.
  SOURCE: {
    LINKEDIN: 'linkedin',
    LINKEDIN_REC: 'linkedin-rec', // lien partagé par un partenaire / un connu
    EMAIL: 'email',
    TELEGRAM: 'telegram',
    GOOGLE: 'google',             // recherche naturelle
    DIRECT: 'direct',             // lien copié / bookmark / email reçu
    PARTNER: 'partner',           // site d'un partenaire qui renvoie
  },

  // Médiums → identifiants constants.
  MEDIUM: {
    POST: 'post',
    SIGNATURE: 'signature',
    MEETING: 'meeting',           // mail de candidature / demande
    ORGANIC: 'organic',
    RECOMMENDATION: 'referral',   // confiance / partenaire
    DIRECT: 'direct',
  },

  // Exemples de chaînes complètes, prêtes à copier quand tu partsages.
  // Remplace `campaign` par ton contexte (lancement, candidature, signature…).
  example: {
    linkedinPost: (campaign = 'lancement_portfolio') =>
      `https://wizyx.me/?utm_source=linkedin&utm_medium=post&utm_campaign=${campaign}`,
    linkedinRec: (campaign = 'recommandation_thibaut') =>
      `https://wizyx.me/?utm_source=linkedin&utm_medium=referral&utm_campaign=${campaign}`,
    email: (subject = 'contact') =>
      `https://wizyx.me/?utm_source=email&utm_medium=signature&utm_campaign=${subject}`,
    telegram: (campaign = 'partage') =>
      `https://wizyx.me/?utm_source=telegram&utm_medium=post&utm_campaign=${campaign}`,
  },
};
