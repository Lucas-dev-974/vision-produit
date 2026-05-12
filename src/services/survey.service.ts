import { httpClient } from './http-client';

export type SurveyRespondentRole = 'producer' | 'merchant' | 'both';

/**
 * Réponses du questionnaire. Les valeurs sont des codes (cf. SURVEY_QUESTIONS),
 * jamais le libellé affiché. Les questions multi-choix utilisent un tableau
 * de codes ; les questions à réponse libre utilisent une string.
 */
export interface SurveyAnswers {
  // Stocks & ventes
  sellOutInTime?: string;
  lossPercentage?: string;
  newStockFrequency?: string;
  pricing?: string;
  refusedOrderForLackOfVisibility?: string;

  // Relation commerciale
  hasContactList?: string;
  regularClientsCount?: string;
  newClientAcquisition?: string[];
  newStockMessageBroadcast?: string;
  tools?: string[];
  paymentDelay?: string;
  hasUnpaid?: string;
  expandZone?: string;

  // Gestion & visibilité
  invoiceManagement?: string;
  invoiceSoftware?: string;
  onlineVisibility?: string[];
  platformReferencing?: string[];
  invoiceTimeOver2h?: string;

  // Pain points & solution
  biggestPainPoint?: string;
  platformInterest?: string;
  paymentWillingness?: string;
}

export interface CreateSurveyResponseInput {
  contactName?: string;
  contactEmail: string;
  contactPhone: string;

  role: SurveyRespondentRole;
  activityType?: string;
  zone?: string[];
  sizeBracket?: string;

  answers: SurveyAnswers;

  consentRgpd: true;
  consentRecontact?: boolean;
  source?: string;
}

export interface CreateSurveyResponseResponse {
  id: string;
  ok: boolean;
}

export const surveyService = {
  create: (input: CreateSurveyResponseInput) =>
    httpClient.post<CreateSurveyResponseResponse>('/public/surveys', input),
};
