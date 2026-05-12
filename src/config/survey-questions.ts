/**
 * Source unique de vérité pour le questionnaire « pitch ».
 *
 * - `key` : nom de la propriété envoyée dans `answers` côté API.
 * - `type` : `single` (radio), `multi` (checkboxes), `text` (textarea).
 * - `options` : codes stables + libellés FR. Le code est ce qui est stocké
 *    en base, ce qui rend l'évolution des libellés sans casse possible.
 * - `section` : section UI / regroupement admin.
 *
 * Pour ajouter une question :
 * 1. l'ajouter ici,
 * 2. ajouter la clé optionnelle dans `SurveyAnswers`,
 * 3. ajouter la validation correspondante dans
 *    `backend/src/modules/surveys/surveys.schemas.ts`.
 */

export type SurveyQuestionType = 'single' | 'multi' | 'text';

export interface SurveyOption {
  code: string;
  label: string;
}

export interface SurveyQuestion {
  key: string;
  label: string;
  type: SurveyQuestionType;
  options?: SurveyOption[];
  hint?: string;
  /** Maximum d'options sélectionnables pour une question `multi`. */
  maxMulti?: number;
  /** Affichage admin uniquement : si vrai, le champ est jugé "important". */
  highlight?: boolean;
}

export interface SurveySection {
  id: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
}

export const SURVEY_SECTIONS: SurveySection[] = [
  {
    id: 'stocks',
    title: 'Stocks & ventes',
    description:
      'Pour mieux comprendre comment vous écoulez vos produits aujourd’hui.',
    questions: [
      {
        key: 'sellOutInTime',
        label:
          'Arrivez-vous à écouler tous vos stocks dans les temps impartis ?',
        type: 'single',
        highlight: true,
        options: [
          { code: 'always', label: 'Toujours' },
          { code: 'often', label: 'Souvent' },
          { code: 'sometimes', label: 'Parfois' },
          { code: 'rarely', label: 'Rarement' },
          { code: 'never', label: 'Jamais' },
        ],
      },
      {
        key: 'lossPercentage',
        label:
          'Sur une production / saison, quel pourcentage de stock part à la perte faute d’acheteur à temps ?',
        type: 'single',
        highlight: true,
        options: [
          { code: 'none', label: '0 %' },
          { code: 'lt10', label: 'Moins de 10 %' },
          { code: '10_25', label: '10 à 25 %' },
          { code: 'gt25', label: 'Plus de 25 %' },
        ],
      },
      {
        key: 'newStockFrequency',
        label: 'À quelle fréquence avez-vous de nouveaux stocks à écouler ?',
        type: 'single',
        options: [
          { code: 'daily', label: 'Quotidienne' },
          { code: 'weekly', label: 'Hebdomadaire' },
          { code: 'monthly', label: 'Mensuelle' },
          { code: 'seasonal', label: 'Saisonnière' },
        ],
      },
      {
        key: 'pricing',
        label: 'Comment fixez-vous vos prix ?',
        type: 'single',
        options: [
          { code: 'mercuriale', label: 'Mercuriale / cours du marché' },
          { code: 'case_by_case', label: 'À la tête du client' },
          { code: 'fixed', label: 'Prix fixe' },
          { code: 'negotiated', label: 'Négociation au cas par cas' },
        ],
      },
      {
        key: 'refusedOrderForLackOfVisibility',
        label:
          'Avez-vous déjà refusé une commande faute de visibilité sur votre stock disponible ?',
        type: 'single',
        options: [
          { code: 'yes', label: 'Oui' },
          { code: 'no', label: 'Non' },
        ],
      },
    ],
  },
  {
    id: 'commercial',
    title: 'Relation commerciale',
    description: 'Vos clients, vos prospects, vos canaux.',
    questions: [
      {
        key: 'hasContactList',
        label: 'Avez-vous une liste de commerçants / clients avec leurs contacts ?',
        type: 'single',
        highlight: true,
        options: [
          { code: 'yes', label: 'Oui' },
          { code: 'partial', label: 'Partiellement' },
          { code: 'no', label: 'Non' },
        ],
      },
      {
        key: 'regularClientsCount',
        label: 'Combien de clients réguliers avez-vous environ ?',
        type: 'single',
        options: [
          { code: 'lt5', label: 'Moins de 5' },
          { code: '5_15', label: '5 à 15' },
          { code: '15_50', label: '15 à 50' },
          { code: 'plus50', label: 'Plus de 50' },
        ],
      },
      {
        key: 'newClientAcquisition',
        label:
          'Comment trouvez-vous de nouveaux commerçants / clients à qui vendre vos stocks ?',
        type: 'multi',
        highlight: true,
        hint: 'Plusieurs réponses possibles.',
        maxMulti: 6,
        options: [
          { code: 'word_of_mouth', label: 'Bouche-à-oreille' },
          { code: 'market', label: 'Marchés / foires' },
          { code: 'phone_prospecting', label: 'Prospection téléphonique' },
          { code: 'social_media', label: 'Réseaux sociaux' },
          { code: 'trade_show', label: 'Salons professionnels' },
          { code: 'other', label: 'Autre' },
        ],
      },
      {
        key: 'newStockMessageBroadcast',
        label:
          'Lorsque vous avez de nouveaux stocks, envoyez-vous un message à tous vos contacts ?',
        type: 'single',
        highlight: true,
        options: [
          { code: 'all', label: 'Oui, à tous' },
          { code: 'selective', label: 'Oui, mais sélectivement' },
          { code: 'no', label: 'Non' },
        ],
      },
      {
        key: 'tools',
        label: 'Quels outils utilisez-vous aujourd’hui pour gérer vos contacts / commandes ?',
        type: 'multi',
        hint: 'Plusieurs réponses possibles.',
        maxMulti: 8,
        options: [
          { code: 'whatsapp', label: 'WhatsApp' },
          { code: 'sms', label: 'SMS' },
          { code: 'phone', label: 'Téléphone' },
          { code: 'email', label: 'E-mail' },
          { code: 'excel', label: 'Excel' },
          { code: 'paper', label: 'Cahier / papier' },
          { code: 'dedicated_software', label: 'Logiciel dédié' },
        ],
      },
      {
        key: 'paymentDelay',
        label: 'Quel est votre délai de paiement moyen ?',
        type: 'single',
        options: [
          { code: 'immediate', label: 'Immédiat' },
          { code: '7d', label: 'Sous 7 jours' },
          { code: '30d', label: 'Sous 30 jours' },
          { code: '60d', label: 'Sous 60 jours' },
          { code: 'plus60d', label: 'Plus de 60 jours' },
        ],
      },
      {
        key: 'hasUnpaid',
        label: 'Avez-vous régulièrement des impayés ?',
        type: 'single',
        options: [
          { code: 'yes', label: 'Oui' },
          { code: 'no', label: 'Non' },
        ],
      },
      {
        key: 'expandZone',
        label: 'Souhaiteriez-vous élargir votre zone de vente ?',
        type: 'single',
        options: [
          { code: 'yes', label: 'Oui' },
          { code: 'maybe', label: 'Peut-être' },
          { code: 'no', label: 'Non' },
        ],
      },
    ],
  },
  {
    id: 'management',
    title: 'Gestion & visibilité',
    description: 'Facturation, outils, présence en ligne.',
    questions: [
      {
        key: 'invoiceManagement',
        label: 'Comment gérez-vous vos factures ?',
        type: 'single',
        options: [
          { code: 'paper', label: 'Sur papier' },
          { code: 'excel', label: 'Sur Excel' },
          { code: 'dedicated_software', label: 'Logiciel dédié' },
          { code: 'external_accountant', label: 'Comptable externe' },
        ],
      },
      {
        key: 'invoiceSoftware',
        label: 'Si logiciel, lequel ?',
        type: 'single',
        options: [
          { code: 'none', label: 'Aucun' },
          { code: 'excel', label: 'Excel' },
          { code: 'sage_ebp', label: 'Sage / EBP' },
          { code: 'other', label: 'Autre' },
        ],
      },
      {
        key: 'onlineVisibility',
        label: 'Avez-vous une visibilité en ligne (publicité, Instagram, Facebook…) ?',
        type: 'multi',
        hint: 'Plusieurs réponses possibles.',
        maxMulti: 6,
        options: [
          { code: 'none', label: 'Aucune' },
          { code: 'instagram', label: 'Instagram' },
          { code: 'facebook', label: 'Facebook' },
          { code: 'google', label: 'Google / SEA' },
          { code: 'website', label: 'Site web' },
          { code: 'other', label: 'Autre' },
        ],
      },
      {
        key: 'platformReferencing',
        label: 'Êtes-vous référencé·e sur des plateformes existantes ?',
        type: 'multi',
        hint: 'Plusieurs réponses possibles.',
        maxMulti: 5,
        options: [
          { code: 'wholesale_market', label: 'Marché de gros' },
          { code: 'pourdebon', label: 'Pourdebon' },
          { code: 'other', label: 'Autre' },
          { code: 'none', label: 'Aucune' },
        ],
      },
      {
        key: 'invoiceTimeOver2h',
        label: 'Passez-vous plus de 2 h par semaine à faire de la gestion de factures ?',
        type: 'single',
        highlight: true,
        options: [
          { code: 'yes', label: 'Oui' },
          { code: 'no', label: 'Non' },
        ],
      },
    ],
  },
  {
    id: 'needs',
    title: 'Vos besoins',
    description: 'Pour calibrer la solution autour de vos vrais problèmes.',
    questions: [
      {
        key: 'biggestPainPoint',
        label: 'Quel est votre plus gros problème au quotidien ?',
        type: 'text',
        highlight: true,
        hint: 'Réponse libre, en quelques mots.',
      },
      {
        key: 'platformInterest',
        label:
          'Seriez-vous intéressé·e par une plateforme qui vous mette en relation directement avec des commerçants / producteurs locaux vérifiés ?',
        type: 'single',
        highlight: true,
        options: [
          { code: 'yes', label: 'Oui' },
          { code: 'maybe', label: 'Peut-être' },
          { code: 'no', label: 'Non' },
        ],
      },
      {
        key: 'paymentWillingness',
        label: 'Combien seriez-vous prêt·e à payer par mois pour un tel service ?',
        type: 'single',
        highlight: true,
        options: [
          { code: 'free', label: 'Gratuit uniquement' },
          { code: 'lt10', label: 'Moins de 10 € / mois' },
          { code: '10_30', label: '10 à 30 € / mois' },
          { code: '30_50', label: '30 à 50 € / mois' },
          { code: 'plus50', label: 'Plus de 50 € / mois' },
          { code: 'commission', label: 'Plutôt une commission à la vente' },
        ],
      },
    ],
  },
];

export const ROLE_OPTIONS: SurveyOption[] = [
  { code: 'producer', label: 'Producteur' },
  { code: 'merchant', label: 'Commerçant' },
  { code: 'both', label: 'Les deux' },
];

export const ZONE_OPTIONS: SurveyOption[] = [
  { code: 'north', label: 'Nord' },
  { code: 'south', label: 'Sud' },
  { code: 'east', label: 'Est' },
  { code: 'west', label: 'Ouest' },
  { code: 'all', label: 'Toute La Réunion' },
];

export const SIZE_OPTIONS: SurveyOption[] = [
  { code: 'solo', label: 'Seul·e' },
  { code: '2_5', label: '2 à 5 personnes' },
  { code: 'plus_5', label: 'Plus de 5 personnes' },
];

/** Affiche une valeur `zone` stockée en CSV (ex. east,north ou all). */
export function formatZoneLabelsCsv(zoneRaw: string | null | undefined): string {
  if (!zoneRaw?.trim()) return '—';
  return zoneRaw
    .split(',')
    .map((c) => findOptionLabel(ZONE_OPTIONS, c.trim()))
    .join(', ');
}

/** Helpers pour l'affichage admin : retrouve un libellé à partir d'un code. */
export function findOptionLabel(options: SurveyOption[], code: string): string {
  return options.find((o) => o.code === code)?.label ?? code;
}

/** Construit un index { questionKey -> SurveyQuestion } pour un accès O(1). */
export const SURVEY_QUESTIONS_INDEX: Record<string, SurveyQuestion> =
  SURVEY_SECTIONS.reduce<Record<string, SurveyQuestion>>((acc, section) => {
    for (const q of section.questions) acc[q.key] = q;
    return acc;
  }, {});
