import { A } from '@solidjs/router';
import { APP_NAME } from '../../config/constants';

/**
 * Conditions Générales d'Utilisation — version V1.
 *
 * Ce contenu couvre les points fonctionnels du dossier technique (marché B2B,
 * pré-commandes sans paiement intégré, validation admin, RGPD/UE, messagerie,
 * notations, signalements). Les blocs entre crochets `[À COMPLÉTER]` doivent
 * être renseignés par l'éditeur (mentions légales, SIRET, contact, etc.) et
 * une relecture juridique est requise avant publication officielle.
 */
export function Cgu() {
  const lastUpdated = '4 mai 2026';

  return (
    <div class="min-h-full bg-gradient-to-b from-cream to-cream-dark">
      <header class="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
        <A href="/" class="font-display text-xl font-semibold text-moss">
          {APP_NAME}
        </A>
        <A href="/" class="text-sm text-ink/60 hover:text-moss">
          Retour à l'accueil
        </A>
      </header>

      <main class="mx-auto max-w-3xl px-4 pb-16">
        <article class="space-y-8 rounded-2xl border border-cream-dark bg-cream/80 p-6 shadow-sm sm:p-10">
          <div>
            <p class="font-mono text-xs uppercase tracking-wide text-moss">
              Document légal
            </p>
            <h1 class="mt-2 font-display text-3xl font-semibold text-ink">
              Conditions générales d'utilisation
            </h1>
            <p class="mt-2 text-sm text-ink/60">
              Dernière mise à jour : {lastUpdated}
            </p>
          </div>

          <p class="rounded-xl border border-ochre/30 bg-ochre/10 px-4 py-3 text-sm text-ink/80">
            Document de travail à finaliser avant l'ouverture publique : les
            mentions légales (raison sociale, SIRET, RCS, capital social,
            directeur de la publication, hébergeur précis) et l'adresse de
            contact doivent être renseignées par l'éditeur, et une relecture
            juridique est recommandée.
          </p>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              1. Préambule
            </h2>
            <p class="text-ink/80">
              Les présentes conditions générales d'utilisation (ci-après «&nbsp;CGU&nbsp;»)
              régissent l'accès et l'utilisation de la plateforme {APP_NAME}
              (ci-après la «&nbsp;Plateforme&nbsp;»), service en ligne destiné à
              mettre en relation, sur l'île de La Réunion (974), des
              producteurs agricoles et des commerçants professionnels
              (restaurants, primeurs, épiceries, etc.) en vue de la
              pré-commande de produits alimentaires locaux, sans
              intermédiation financière.
            </p>
            <p class="text-ink/80">
              La Plateforme est éditée par&nbsp;:{' '}
              <span class="rounded bg-cream-dark/60 px-1 font-mono text-xs">
                [À COMPLÉTER : raison sociale, forme juridique, capital, siège,
                SIRET, RCS, n° TVA intracommunautaire, directeur de la
                publication, e-mail de contact]
              </span>
              . Hébergement&nbsp;:{' '}
              <span class="rounded bg-cream-dark/60 px-1 font-mono text-xs">
                [À COMPLÉTER : prestataire d'hébergement, adresse, pays
                (Union européenne)]
              </span>
              .
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              2. Définitions
            </h2>
            <ul class="list-disc space-y-2 pl-6 text-ink/80">
              <li>
                <strong>Utilisateur</strong>&nbsp;: toute personne physique ou
                morale disposant d'un compte sur la Plateforme.
              </li>
              <li>
                <strong>Producteur</strong>&nbsp;: utilisateur identifié comme
                exploitant agricole, immatriculé au registre du commerce ou au
                registre national des entreprises.
              </li>
              <li>
                <strong>Commerçant</strong>&nbsp;: utilisateur professionnel
                acheteur (restaurateur, épicier, primeur, etc.) immatriculé.
              </li>
              <li>
                <strong>Administrateur</strong>&nbsp;: équipe de l'éditeur en
                charge de la modération et de la validation des comptes.
              </li>
              <li>
                <strong>Pré-commande</strong>&nbsp;: demande d'achat émise par
                un Commerçant auprès d'un Producteur, n'engageant les parties
                qu'après acceptation explicite par le Producteur, et hors
                tout flux de paiement transitant par la Plateforme.
              </li>
            </ul>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              3. Acceptation des CGU
            </h2>
            <p class="text-ink/80">
              L'inscription, la pré-inscription et toute utilisation de la
              Plateforme valent acceptation pleine et entière des présentes
              CGU. Les Utilisateurs reconnaissent en avoir pris connaissance
              avant la création de leur compte ou l'envoi du formulaire de
              pré-inscription.
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              4. Éligibilité et inscription
            </h2>
            <p class="text-ink/80">
              L'accès à la Plateforme est réservé aux professionnels majeurs
              disposant d'un numéro SIRET valide et exerçant leur activité à
              La Réunion. L'éditeur se réserve le droit de vérifier les
              informations fournies (notamment via l'API Sirene de l'INSEE) et
              de refuser ou suspendre tout compte ne répondant pas aux critères
              d'éligibilité.
            </p>
            <p class="text-ink/80">
              L'inscription suppose&nbsp;: (i) la fourniture d'un e-mail
              professionnel valide, (ii) la confirmation de cet e-mail, puis
              (iii) une validation manuelle par un Administrateur avant
              activation complète du compte. Tant que la Plateforme n'est pas
              ouverte au public, seules les pré-inscriptions sont possibles.
            </p>
            <p class="text-ink/80">
              Chaque Utilisateur garantit l'exactitude des informations
              fournies et s'engage à les maintenir à jour. L'usage de
              plusieurs comptes par une même personne ou entité est interdit
              sans accord préalable de l'éditeur.
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              5. Description des services
            </h2>
            <p class="text-ink/80">La Plateforme permet, en V1&nbsp;:</p>
            <ul class="list-disc space-y-2 pl-6 text-ink/80">
              <li>
                aux Producteurs, de présenter leur catalogue, leurs stocks
                disponibles, leurs prix et leurs conditions de vente&nbsp;;
              </li>
              <li>
                aux Commerçants, de rechercher des Producteurs par
                géolocalisation approximative, catégorie ou texte libre&nbsp;;
              </li>
              <li>
                de transmettre des pré-commandes et d'en suivre les statuts
                (proposée, acceptée, refusée, alternative proposée, confirmée,
                honorée, non honorée, annulée)&nbsp;;
              </li>
              <li>
                d'échanger via une messagerie 1-à-1 limitée à 2 000
                caractères par message&nbsp;;
              </li>
              <li>
                de noter une transaction effectivement honorée et de signaler
                un comportement contraire aux CGU.
              </li>
            </ul>
            <p class="text-ink/80">
              <strong>Aucun paiement n'est traité par la Plateforme</strong>.
              Les modalités de règlement, de livraison, de facturation et de
              TVA sont convenues directement entre le Producteur et le
              Commerçant et relèvent de leur entière responsabilité.
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              6. Obligations des Utilisateurs
            </h2>
            <p class="text-ink/80">Chaque Utilisateur s'engage à&nbsp;:</p>
            <ul class="list-disc space-y-2 pl-6 text-ink/80">
              <li>
                utiliser la Plateforme conformément à sa destination
                professionnelle et au cadre légal applicable (notamment règles
                d'hygiène, étiquetage et sécurité alimentaire)&nbsp;;
              </li>
              <li>
                publier des informations exactes (description, photos, prix,
                quantités, dates de disponibilité) et actualiser ses stocks et
                catalogue dans un délai raisonnable&nbsp;;
              </li>
              <li>
                respecter ses engagements de pré-commande une fois ces
                derniers acceptés et confirmés&nbsp;;
              </li>
              <li>
                préserver la confidentialité de ses identifiants et
                signaler sans délai toute utilisation non autorisée&nbsp;;
              </li>
              <li>
                s'abstenir de tout comportement abusif&nbsp;: dénigrement,
                propos discriminatoires, contenus illicites, démarchage
                commercial étranger à la Plateforme, contournement de la
                Plateforme pour des transactions amorcées via celle-ci, etc.
              </li>
            </ul>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              7. Pré-commandes
            </h2>
            <p class="text-ink/80">
              La Plateforme assure la traçabilité des pré-commandes via des
              statuts horodatés. Une pré-commande engage les parties dès lors
              que le Producteur l'a explicitement acceptée. Le Commerçant
              dispose alors d'une adresse exacte de retrait communiquée par le
              Producteur. Les annulations restent possibles selon les règles
              indiquées dans l'application&nbsp;; elles n'entraînent pas de
              recrédit automatique des stocks. Le respect des engagements pris
              influe sur le score de fiabilité affiché.
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              8. Données personnelles &amp; RGPD
            </h2>
            <p class="text-ink/80">
              Le traitement des données personnelles est régi par le règlement
              (UE) 2016/679 (RGPD) et la loi Informatique et Libertés. Les
              données collectées (e-mail, SIRET, raison sociale, téléphone,
              localisation approximative, contenus produits, échanges, avis,
              signalements) sont nécessaires à l'exécution du service et à la
              modération.
            </p>
            <p class="text-ink/80">
              L'hébergement est réalisé au sein de l'Union européenne. Les
              durées de conservation, finalités, sous-traitants et droits des
              personnes (accès, rectification, opposition, effacement,
              portabilité, limitation) sont détaillés dans la{' '}
              <span class="rounded bg-cream-dark/60 px-1 font-mono text-xs">
                [Politique de confidentialité — à publier]
              </span>
              . Toute demande peut être adressée à&nbsp;:{' '}
              <span class="rounded bg-cream-dark/60 px-1 font-mono text-xs">
                [À COMPLÉTER : adresse e-mail DPO/contact]
              </span>
              .
            </p>
            <p class="text-ink/80">
              La position GPS exacte d'un Producteur n'est jamais exposée
              publiquement&nbsp;: la Plateforme n'affiche qu'une localisation
              approximative tant qu'aucune pré-commande n'a été confirmée
              entre les deux parties.
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              9. Notations et signalements
            </h2>
            <p class="text-ink/80">
              Seules les pré-commandes effectivement honorées peuvent donner
              lieu à une note (une note unique par commande et par partie). Les
              notes doivent être loyales, factuelles et conformes à la loi. La
              Plateforme se réserve le droit de retirer une note ou un
              signalement manifestement abusif et d'en informer son auteur.
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              10. Propriété intellectuelle
            </h2>
            <p class="text-ink/80">
              Les éléments de la Plateforme (marques, logos, design, code,
              bases de données) sont la propriété de l'éditeur ou de ses
              partenaires et sont protégés par le droit de la propriété
              intellectuelle. Toute reproduction ou exploitation non autorisée
              est interdite.
            </p>
            <p class="text-ink/80">
              En publiant des contenus (textes, photos, descriptions), chaque
              Utilisateur concède à l'éditeur une licence non exclusive,
              gratuite et limitée à l'exploitation de la Plateforme et à sa
              promotion, pour la durée légale de protection.
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              11. Responsabilité
            </h2>
            <p class="text-ink/80">
              La Plateforme est un service de mise en relation. L'éditeur
              n'est partie à aucune transaction conclue entre Producteurs et
              Commerçants et ne peut être tenu responsable de la qualité, de
              la conformité, de la livraison, du paiement ou de la fiscalité
              afférents aux produits échangés.
            </p>
            <p class="text-ink/80">
              L'éditeur met en œuvre des mesures techniques et
              organisationnelles raisonnables pour assurer la disponibilité du
              service, sans pour autant garantir une absence totale
              d'interruption. Sa responsabilité ne saurait être engagée en cas
              de force majeure, de défaillance d'un opérateur tiers ou d'usage
              non conforme par un Utilisateur.
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              12. Suspension et résiliation
            </h2>
            <p class="text-ink/80">
              L'éditeur peut suspendre ou clôturer un compte qui contrevient
              aux présentes CGU, à la loi, ou qui présente un risque pour les
              autres Utilisateurs (informations frauduleuses, comportements
              abusifs, signalements répétés et fondés). L'Utilisateur peut à
              tout moment fermer son compte&nbsp;; un délai de purge des
              données peut s'appliquer pour préserver les pièces nécessaires
              au respect des obligations légales et à la lutte contre la
              fraude.
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              13. Évolution des CGU
            </h2>
            <p class="text-ink/80">
              Les CGU peuvent évoluer pour tenir compte des évolutions du
              service ou du cadre légal. Les Utilisateurs sont informés des
              modifications substantielles avant leur entrée en vigueur. La
              poursuite de l'utilisation après cette date vaut acceptation de
              la nouvelle version.
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              14. Droit applicable et juridiction
            </h2>
            <p class="text-ink/80">
              Les présentes CGU sont régies par le droit français. À défaut de
              résolution amiable, tout litige relatif à leur interprétation ou
              à leur exécution sera soumis aux juridictions compétentes du
              ressort du siège de l'éditeur.
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="font-display text-xl font-semibold text-ink">
              15. Contact
            </h2>
            <p class="text-ink/80">
              Pour toute question relative aux présentes CGU&nbsp;:{' '}
              <span class="rounded bg-cream-dark/60 px-1 font-mono text-xs">
                [À COMPLÉTER : adresse e-mail de contact]
              </span>
              .
            </p>
          </section>

          <div class="border-t border-cream-dark/60 pt-6 text-sm text-ink/60">
            <p>
              Vous pouvez également consulter notre{' '}
              <A href="/pre-inscription" class="font-medium text-moss hover:underline">
                page de pré-inscription
              </A>{' '}
              ou revenir à l'
              <A href="/" class="font-medium text-moss hover:underline">
                accueil
              </A>
              .
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
