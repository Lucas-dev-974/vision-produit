import { useSearchParams } from '@solidjs/router';
import { For, Show, createResource, createSignal } from 'solid-js';
import {
  adminService,
  type AdminSurveyResponse,
  type SurveyLeadTier,
  type SurveyResponseStatus,
  type SurveyRespondentRole,
} from '../../services/admin.service';
import {
  AdminButton,
  AdminCard,
  EmptyState,
  Pagination,
  StatusBadge,
} from '../../components/admin/ui';
import {
  ROLE_OPTIONS,
  SIZE_OPTIONS,
  SURVEY_QUESTIONS_INDEX,
  SURVEY_SECTIONS,
  formatZoneLabelsCsv,
  findOptionLabel,
  type SurveyOption,
} from '../../config/survey-questions';

export function AdminSurveys() {
  const [params, setParams] = useSearchParams();
  const initialStatus = (Array.isArray(params.status) ? params.status[0] : params.status) ?? '';
  const initialRole = (Array.isArray(params.role) ? params.role[0] : params.role) ?? '';
  const initialLeadTier =
    (Array.isArray(params.leadTier) ? params.leadTier[0] : params.leadTier) ?? '';

  const [page, setPage] = createSignal(Number(params.page ?? 1));
  const [status, setStatus] = createSignal<SurveyResponseStatus | ''>(
    initialStatus as SurveyResponseStatus | '',
  );
  const [role, setRole] = createSignal<SurveyRespondentRole | ''>(
    initialRole as SurveyRespondentRole | '',
  );
  const [leadTier, setLeadTier] = createSignal<SurveyLeadTier | ''>(
    initialLeadTier as SurveyLeadTier | '',
  );
  const [expanded, setExpanded] = createSignal<string | null>(null);
  const [actionMsg, setActionMsg] = createSignal<string | null>(null);

  const pageSize = 20;

  const [list, { refetch }] = createResource(
    () => ({ page: page(), status: status(), role: role(), leadTier: leadTier() }),
    (filters) =>
      adminService.surveys.list({
        page: filters.page,
        pageSize,
        status: (filters.status || undefined) as SurveyResponseStatus | undefined,
        role: (filters.role || undefined) as SurveyRespondentRole | undefined,
        leadTier: (filters.leadTier || undefined) as SurveyLeadTier | undefined,
      }),
  );

  function syncParams() {
    setParams({
      status: status() || undefined,
      role: role() || undefined,
      leadTier: leadTier() || undefined,
      page: String(page()),
    });
  }

  async function setStatusOf(item: AdminSurveyResponse, next: SurveyResponseStatus) {
    setActionMsg(null);
    try {
      await adminService.surveys.updateStatus(item.id, next);
      setActionMsg(`Statut mis à jour : ${item.contactEmail} → ${next}`);
      void refetch();
    } catch (err) {
      setActionMsg(
        `Échec : ${(err as { message?: string }).message ?? 'erreur inconnue'}`,
      );
    }
  }

  async function deleteItem(item: AdminSurveyResponse) {
    if (!window.confirm(`Supprimer définitivement la réponse de ${item.contactEmail} ?`)) {
      return;
    }
    setActionMsg(null);
    try {
      await adminService.surveys.delete(item.id);
      setActionMsg(`Supprimé : ${item.contactEmail}`);
      void refetch();
    } catch (err) {
      setActionMsg(
        `Échec suppression : ${(err as { message?: string }).message ?? 'erreur inconnue'}`,
      );
    }
  }

  return (
    <div class="space-y-6">
      <header>
        <h1 class="font-display text-2xl font-semibold text-cream">Questionnaires</h1>
        <p class="mt-1 text-sm text-cream/65">
          Réponses au questionnaire « pitch » envoyé depuis la page d’accueil.
          Cliquez sur une ligne pour voir le détail des réponses.
        </p>
      </header>

      <AdminCard title="Filtres">
        <div class="flex flex-wrap items-end gap-3">
          <label class="block text-sm">
            <span class="text-cream/60">Statut</span>
            <select
              value={status()}
              onChange={(e) => {
                setStatus(e.currentTarget.value as SurveyResponseStatus | '');
                setPage(1);
                syncParams();
                void refetch();
              }}
              class="mt-1 w-48 rounded-md border border-cream/15 bg-ink px-3 py-2 text-sm text-cream focus:border-moss-light focus:outline-none"
            >
              <option value="">Tous</option>
              <option value="new">Nouveau</option>
              <option value="reviewed">Examiné</option>
              <option value="archived">Archivé</option>
            </select>
          </label>
          <label class="block text-sm">
            <span class="text-cream/60">Profil</span>
            <select
              value={role()}
              onChange={(e) => {
                setRole(e.currentTarget.value as SurveyRespondentRole | '');
                setPage(1);
                syncParams();
                void refetch();
              }}
              class="mt-1 w-48 rounded-md border border-cream/15 bg-ink px-3 py-2 text-sm text-cream focus:border-moss-light focus:outline-none"
            >
              <option value="">Tous</option>
              <option value="producer">Producteur</option>
              <option value="merchant">Commerçant</option>
              <option value="both">Les deux</option>
            </select>
          </label>
          <label class="block text-sm">
            <span class="text-cream/60">Palier</span>
            <select
              value={leadTier()}
              onChange={(e) => {
                setLeadTier(e.currentTarget.value as SurveyLeadTier | '');
                setPage(1);
                syncParams();
                void refetch();
              }}
              class="mt-1 w-48 rounded-md border border-cream/15 bg-ink px-3 py-2 text-sm text-cream focus:border-moss-light focus:outline-none"
            >
              <option value="">Tous</option>
              <option value="hot">Chaud</option>
              <option value="warm">Tiède</option>
              <option value="cold">Froid</option>
              <option value="out">Non intéressé</option>
            </select>
          </label>
        </div>
      </AdminCard>

      <Show when={actionMsg()}>
        <p class="rounded-md border border-cream/15 bg-cream/5 px-3 py-2 text-xs text-cream/80">
          {actionMsg()}
        </p>
      </Show>

      <AdminCard>
        <Show when={list.loading}>
          <p class="text-sm text-cream/60">Chargement…</p>
        </Show>
        <Show when={list()}>
          {(res) => (
            <Show
              when={res().items.length > 0}
              fallback={<EmptyState title="Aucun questionnaire reçu" />}
            >
              <div class="overflow-x-auto">
                <table class="min-w-full text-left text-sm">
                  <thead class="border-b border-cream/10 text-xs uppercase tracking-wider text-cream/50">
                    <tr>
                      <th class="px-2 py-2">Contact</th>
                      <th class="px-2 py-2">Profil</th>
                      <th class="px-2 py-2">Activité / Zone</th>
                      <th class="px-2 py-2">Palier</th>
                      <th class="px-2 py-2">Statut</th>
                      <th class="px-2 py-2">Reçu le</th>
                      <th class="px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={res().items}>
                      {(s) => (
                        <>
                          <tr
                            class="cursor-pointer border-b border-cream/5 align-top transition hover:bg-cream/5"
                            onClick={() =>
                              setExpanded(expanded() === s.id ? null : s.id)
                            }
                          >
                            <td class="px-2 py-2">
                              <p class="text-cream">{s.contactName ?? '—'}</p>
                              <p class="text-xs text-cream/65">{s.contactEmail}</p>
                              <p class="font-mono text-xs text-cream/50">
                                {s.contactPhone}
                              </p>
                            </td>
                            <td class="px-2 py-2">
                              <StatusBadge value={s.role} />
                              <Show when={s.consentRecontact}>
                                <p class="mt-1 text-[10px] uppercase tracking-wide text-moss-light">
                                  À recontacter
                                </p>
                              </Show>
                            </td>
                            <td class="px-2 py-2 text-cream/75">
                              <p>{s.activityType ?? '—'}</p>
                              <p class="text-xs text-cream/55">
                                {[
                                  s.zone ? formatZoneLabelsCsv(s.zone) : null,
                                  s.sizeBracket
                                    ? findOptionLabel(SIZE_OPTIONS, s.sizeBracket)
                                    : null,
                                ]
                                  .filter((x) => x && x !== '—')
                                  .join(' · ') || '—'}
                              </p>
                            </td>
                            <td class="px-2 py-2">
                              <LeadTierBadge tier={s.leadTier} />
                            </td>
                            <td class="px-2 py-2">
                              <StatusBadge value={s.status} />
                            </td>
                            <td class="px-2 py-2 font-mono text-xs text-cream/55">
                              {new Date(s.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td class="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                              <div class="flex flex-wrap gap-1">
                                <Show when={s.status === 'new'}>
                                  <AdminButton
                                    variant="ghost"
                                    onClick={() => setStatusOf(s, 'reviewed')}
                                  >
                                    Examiné
                                  </AdminButton>
                                </Show>
                                <Show when={s.status !== 'archived'}>
                                  <AdminButton
                                    variant="ghost"
                                    onClick={() => setStatusOf(s, 'archived')}
                                  >
                                    Archiver
                                  </AdminButton>
                                </Show>
                                <Show when={s.status === 'archived'}>
                                  <AdminButton
                                    variant="ghost"
                                    onClick={() => setStatusOf(s, 'new')}
                                  >
                                    Restaurer
                                  </AdminButton>
                                </Show>
                                <AdminButton
                                  variant="danger"
                                  onClick={() => deleteItem(s)}
                                >
                                  Supprimer
                                </AdminButton>
                              </div>
                            </td>
                          </tr>
                          <Show when={expanded() === s.id}>
                            <tr class="border-b border-cream/10 bg-ink/40">
                              <td colspan={7} class="px-4 py-4">
                                <SurveyAnswersDetail item={s} />
                              </td>
                            </tr>
                          </Show>
                        </>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page()}
                pageSize={pageSize}
                total={res().pagination.total}
                onChange={(n) => {
                  setPage(n);
                  syncParams();
                  void refetch();
                }}
              />
            </Show>
          )}
        </Show>
      </AdminCard>
    </div>
  );
}

function SurveyAnswersDetail(props: { item: AdminSurveyResponse }) {
  return (
    <div class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DetailCell label="Profil" value={findOptionLabel(ROLE_OPTIONS, props.item.role)} />
        <DetailCell
          label="Zone"
          value={formatZoneLabelsCsv(props.item.zone)}
        />
        <DetailCell
          label="Taille"
          value={
            props.item.sizeBracket
              ? findOptionLabel(SIZE_OPTIONS, props.item.sizeBracket)
              : '—'
          }
        />
        <DetailCell label="Palier" value={leadTierLabel(props.item.leadTier)} />
      </div>

      <For each={SURVEY_SECTIONS}>
        {(section) => (
          <div class="rounded-lg border border-cream/10 bg-ink/30 p-3">
            <p class="font-mono text-[10px] uppercase tracking-wider text-cream/50">
              {section.title}
            </p>
            <dl class="mt-2 space-y-2 text-sm">
              <For each={section.questions}>
                {(q) => {
                  const raw = (props.item.answers as Record<string, unknown>)[q.key];
                  const display = formatAnswer(q.key, raw);
                  return (
                    <div class="grid gap-1 sm:grid-cols-3">
                      <dt class="text-xs text-cream/60 sm:col-span-1">{q.label}</dt>
                      <dd class="text-cream sm:col-span-2">
                        <Show when={display} fallback={<span class="text-cream/40">—</span>}>
                          {display}
                        </Show>
                      </dd>
                    </div>
                  );
                }}
              </For>
            </dl>
          </div>
        )}
      </For>
    </div>
  );
}

function DetailCell(props: { label: string; value: string }) {
  return (
    <div class="rounded-lg border border-cream/10 bg-ink/30 p-3">
      <p class="font-mono text-[10px] uppercase tracking-wider text-cream/50">
        {props.label}
      </p>
      <p class="mt-1 text-sm text-cream">{props.value}</p>
    </div>
  );
}

function leadTierLabel(tier: SurveyLeadTier): string {
  const labels: Record<SurveyLeadTier, string> = {
    hot: 'Chaud',
    warm: 'Tiède',
    cold: 'Froid',
    out: 'Non intéressé',
  };
  return labels[tier];
}

function LeadTierBadge(props: { tier: SurveyLeadTier }) {
  const tones: Record<SurveyLeadTier, string> = {
    hot: 'bg-moss/25 text-moss-light',
    warm: 'bg-ochre/20 text-ochre',
    cold: 'bg-cream/10 text-cream/55',
    out: 'bg-cream/10 text-cream/45',
  };
  return (
    <span
      class={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ${tones[props.tier]}`}
    >
      {leadTierLabel(props.tier)}
    </span>
  );
}

function formatAnswer(key: string, raw: unknown): string {
  const q = SURVEY_QUESTIONS_INDEX[key];
  if (!q) {
    if (Array.isArray(raw)) return raw.join(', ');
    return raw == null || raw === '' ? '' : String(raw);
  }
  if (q.type === 'text') {
    return typeof raw === 'string' ? raw : '';
  }
  const opts: SurveyOption[] = q.options ?? [];
  if (q.type === 'multi') {
    if (!Array.isArray(raw) || raw.length === 0) return '';
    return raw
      .filter((v): v is string => typeof v === 'string')
      .map((code) => findOptionLabel(opts, code))
      .join(', ');
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return findOptionLabel(opts, raw);
  }
  return '';
}
