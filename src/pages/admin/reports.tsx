import { A, useSearchParams } from '@solidjs/router';
import { For, Show, createResource, createSignal } from 'solid-js';
import {
  adminService,
  type ReportCategory,
  type ReportStatus,
} from '../../services/admin.service';
import {
  AdminCard,
  EmptyState,
  Pagination,
  StatusBadge,
} from '../../components/admin/ui';

export function AdminReports() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = createSignal(Number(params.page ?? 1));
  const [status, setStatus] = createSignal<ReportStatus | ''>(
    ((Array.isArray(params.status) ? params.status[0] : params.status) ?? '') as
      | ReportStatus
      | '',
  );
  const [category, setCategory] = createSignal<ReportCategory | ''>(
    ((Array.isArray(params.category) ? params.category[0] : params.category) ?? '') as
      | ReportCategory
      | '',
  );
  const pageSize = 20;

  const [list, { refetch }] = createResource(
    () => ({
      page: page(),
      status: status() || undefined,
      category: category() || undefined,
    }),
    (filters) =>
      adminService.reports.list({
        page: filters.page,
        pageSize,
        status: filters.status as ReportStatus | undefined,
        category: filters.category as ReportCategory | undefined,
      }),
  );

  function syncParams() {
    setParams({
      status: status() || undefined,
      category: category() || undefined,
      page: String(page()),
    });
  }

  return (
    <div class="space-y-6">
      <header>
        <h1 class="font-display text-2xl font-semibold text-cream">Signalements</h1>
        <p class="mt-1 text-sm text-cream/65">
          Modération des contenus et comportements signalés par les utilisateurs.
        </p>
      </header>

      <AdminCard title="Filtres">
        <div class="grid gap-3 md:grid-cols-3">
          <label class="block text-sm">
            <span class="text-cream/60">Statut</span>
            <select
              value={status()}
              onChange={(e) => {
                setStatus(e.currentTarget.value as ReportStatus | '');
                setPage(1);
                syncParams();
                void refetch();
              }}
              class="mt-1 w-full rounded-md border border-cream/15 bg-ink px-3 py-2 text-sm text-cream focus:border-moss-light focus:outline-none"
            >
              <option value="">Tous</option>
              <option value="open">Ouvert</option>
              <option value="reviewed">En cours</option>
              <option value="resolved">Résolu</option>
              <option value="dismissed">Rejeté</option>
            </select>
          </label>
          <label class="block text-sm">
            <span class="text-cream/60">Catégorie</span>
            <select
              value={category()}
              onChange={(e) => {
                setCategory(e.currentTarget.value as ReportCategory | '');
                setPage(1);
                syncParams();
                void refetch();
              }}
              class="mt-1 w-full rounded-md border border-cream/15 bg-ink px-3 py-2 text-sm text-cream focus:border-moss-light focus:outline-none"
            >
              <option value="">Toutes</option>
              <option value="fake_profile">Faux profil</option>
              <option value="inappropriate_content">Contenu inapproprié</option>
              <option value="scam">Arnaque</option>
              <option value="harassment">Harcèlement</option>
              <option value="other">Autre</option>
            </select>
          </label>
        </div>
      </AdminCard>

      <AdminCard>
        <Show when={list.loading}>
          <p class="text-sm text-cream/60">Chargement…</p>
        </Show>
        <Show when={list()}>
          {(res) => (
            <Show
              when={res().items.length > 0}
              fallback={<EmptyState title="Aucun signalement" />}
            >
              <div class="overflow-x-auto">
                <table class="min-w-full text-left text-sm">
                  <thead class="border-b border-cream/10 text-xs uppercase tracking-wider text-cream/50">
                    <tr>
                      <th class="px-2 py-2">Catégorie</th>
                      <th class="px-2 py-2">Description</th>
                      <th class="px-2 py-2">Cible</th>
                      <th class="px-2 py-2">Statut</th>
                      <th class="px-2 py-2">Reçu le</th>
                      <th class="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={res().items}>
                      {(r) => (
                        <tr class="border-b border-cream/5 align-top">
                          <td class="px-2 py-2">
                            <StatusBadge value={r.category} />
                          </td>
                          <td class="px-2 py-2 max-w-md text-cream/85">
                            <p class="line-clamp-2">{r.description}</p>
                          </td>
                          <td class="px-2 py-2 text-cream/75">
                            {r.targetUserEmail ? (
                              <span>👤 {r.targetUserEmail}</span>
                            ) : r.targetMessageId ? (
                              <span class="font-mono text-xs">
                                💬 {r.targetMessageId.slice(0, 8)}…
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td class="px-2 py-2">
                            <StatusBadge value={r.status} />
                          </td>
                          <td class="px-2 py-2 font-mono text-xs text-cream/55">
                            {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td class="px-2 py-2">
                            <A
                              href={`/admin/reports/${r.id}`}
                              class="text-xs text-moss-light hover:underline"
                            >
                              Détail
                            </A>
                          </td>
                        </tr>
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
