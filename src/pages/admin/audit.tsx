import { useSearchParams } from '@solidjs/router';
import { For, Show, createResource, createSignal } from 'solid-js';
import {
  adminService,
  type AuditTargetType,
} from '../../services/admin.service';
import {
  AdminCard,
  EmptyState,
  Pagination,
  StatusBadge,
} from '../../components/admin/ui';

export function AdminAudit() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = createSignal(Number(params.page ?? 1));
  const [targetType, setTargetType] = createSignal<AuditTargetType | ''>(
    ((Array.isArray(params.targetType) ? params.targetType[0] : params.targetType) ?? '') as
      | AuditTargetType
      | '',
  );
  const [action, setAction] = createSignal<string>(
    (Array.isArray(params.action) ? params.action[0] : params.action) ?? '',
  );

  const pageSize = 50;

  const [list, { refetch }] = createResource(
    () => ({
      page: page(),
      targetType: targetType() || undefined,
      action: action() || undefined,
    }),
    (filters) =>
      adminService.audit.list({
        page: filters.page,
        pageSize,
        targetType: filters.targetType as AuditTargetType | undefined,
        action: filters.action,
      }),
  );

  function syncParams() {
    setParams({
      targetType: targetType() || undefined,
      action: action() || undefined,
      page: String(page()),
    });
  }

  return (
    <div class="space-y-6">
      <header>
        <h1 class="font-display text-2xl font-semibold text-cream">
          Journal d'actions
        </h1>
        <p class="mt-1 text-sm text-cream/65">
          Toutes les actions sensibles effectuées depuis le back-office (lecture seule).
        </p>
      </header>

      <AdminCard title="Filtres">
        <div class="grid gap-3 md:grid-cols-3">
          <label class="block text-sm">
            <span class="text-cream/60">Type de cible</span>
            <select
              value={targetType()}
              onChange={(e) => {
                setTargetType(e.currentTarget.value as AuditTargetType | '');
                setPage(1);
                syncParams();
                void refetch();
              }}
              class="mt-1 w-full rounded-md border border-cream/15 bg-ink px-3 py-2 text-sm text-cream focus:border-moss-light focus:outline-none"
            >
              <option value="">Tous</option>
              <option value="user">Utilisateur</option>
              <option value="pre_registration">Pré-inscription</option>
              <option value="report">Signalement</option>
              <option value="system">Système</option>
            </select>
          </label>
          <label class="block text-sm">
            <span class="text-cream/60">Action (ex. user.approve)</span>
            <input
              value={action()}
              onInput={(e) => setAction(e.currentTarget.value)}
              class="mt-1 w-full rounded-md border border-cream/15 bg-ink px-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-moss-light focus:outline-none"
              placeholder="user.approve, report.resolve, …"
            />
          </label>
          <div class="flex items-end">
            <button
              type="button"
              class="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-cream hover:bg-moss-light"
              onClick={() => {
                setPage(1);
                syncParams();
                void refetch();
              }}
            >
              Appliquer
            </button>
          </div>
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
              fallback={<EmptyState title="Aucune entrée d'audit" />}
            >
              <div class="overflow-x-auto">
                <table class="min-w-full text-left text-sm">
                  <thead class="border-b border-cream/10 text-xs uppercase tracking-wider text-cream/50">
                    <tr>
                      <th class="px-2 py-2">Date</th>
                      <th class="px-2 py-2">Admin</th>
                      <th class="px-2 py-2">Action</th>
                      <th class="px-2 py-2">Cible</th>
                      <th class="px-2 py-2">Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={res().items}>
                      {(a) => (
                        <tr class="border-b border-cream/5 align-top">
                          <td class="px-2 py-2 font-mono text-xs text-cream/65">
                            {new Date(a.createdAt).toLocaleString('fr-FR')}
                          </td>
                          <td class="px-2 py-2 text-cream/85">
                            {a.adminEmail ?? '—'}
                          </td>
                          <td class="px-2 py-2">
                            <span class="rounded bg-cream/10 px-2 py-0.5 font-mono text-[11px] text-cream">
                              {a.action}
                            </span>
                          </td>
                          <td class="px-2 py-2">
                            <StatusBadge value={a.targetType} />
                            <Show when={a.targetId}>
                              <p class="mt-1 font-mono text-[10px] text-cream/50">
                                {a.targetId?.slice(0, 8)}…
                              </p>
                            </Show>
                          </td>
                          <td class="px-2 py-2 text-xs text-cream/70">
                            <Show when={a.payload}>
                              <pre class="max-w-md overflow-x-auto whitespace-pre-wrap font-mono text-[10px] text-cream/55">
                                {JSON.stringify(a.payload, null, 2)}
                              </pre>
                            </Show>
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
