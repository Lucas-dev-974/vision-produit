import { A, useSearchParams } from '@solidjs/router';
import { For, Show, createResource, createSignal } from 'solid-js';
import {
  adminService,
  type UserRole,
  type UserStatus,
} from '../../services/admin.service';
import {
  AdminCard,
  EmptyState,
  Pagination,
  StatusBadge,
} from '../../components/admin/ui';

export function AdminUsers(props: { mode?: 'all' | 'pending' }) {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = createSignal(Number(params.page ?? 1));
  const pageSize = 20;

  const initialStatus = (() => {
    if (props.mode === 'pending') return 'pending_admin' as UserStatus;
    return ((Array.isArray(params.status) ? params.status[0] : params.status) ?? '') as
      | UserStatus
      | '';
  })();
  const initialRole = (() => {
    return ((Array.isArray(params.role) ? params.role[0] : params.role) ?? '') as
      | UserRole
      | '';
  })();
  const initialQ = (() => {
    return (Array.isArray(params.q) ? params.q[0] : params.q) ?? '';
  })();

  const [status, setStatus] = createSignal<UserStatus | ''>(initialStatus);
  const [role, setRole] = createSignal<UserRole | ''>(initialRole);
  const [q, setQ] = createSignal<string>(initialQ);

  const [list, { refetch }] = createResource(
    () => ({
      page: page(),
      status: status() || undefined,
      role: role() || undefined,
      q: q() || undefined,
    }),
    (filters) =>
      adminService.users.list({
        page: filters.page,
        pageSize,
        status: filters.status as UserStatus | undefined,
        role: filters.role as UserRole | undefined,
        q: filters.q,
      }),
  );

  function applyParams() {
    setParams({
      status: status() || undefined,
      role: role() || undefined,
      q: q() || undefined,
      page: String(page()),
    });
  }

  return (
    <div class="space-y-6">
      <header>
        <h1 class="font-display text-2xl font-semibold text-cream">
          {props.mode === 'pending' ? 'Comptes à approuver' : 'Utilisateurs'}
        </h1>
        <p class="mt-1 text-sm text-cream/65">
          {props.mode === 'pending'
            ? 'Validez ou refusez les nouveaux comptes après leur confirmation e-mail.'
            : "Recherche, filtre, modération et historique de l'ensemble des comptes."}
        </p>
      </header>

      <Show when={props.mode !== 'pending'}>
        <AdminCard title="Filtres">
          <div class="grid gap-3 md:grid-cols-4">
            <label class="block text-sm">
              <span class="text-cream/60">Recherche</span>
              <input
                value={q()}
                onInput={(e) => setQ(e.currentTarget.value)}
                placeholder="email / entreprise / SIRET"
                class="mt-1 w-full rounded-md border border-cream/15 bg-ink px-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-moss-light focus:outline-none"
              />
            </label>
            <label class="block text-sm">
              <span class="text-cream/60">Rôle</span>
              <select
                value={role()}
                onChange={(e) => setRole(e.currentTarget.value as UserRole | '')}
                class="mt-1 w-full rounded-md border border-cream/15 bg-ink px-3 py-2 text-sm text-cream focus:border-moss-light focus:outline-none"
              >
                <option value="">Tous</option>
                <option value="producer">Producteur</option>
                <option value="buyer">Commerçant</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label class="block text-sm">
              <span class="text-cream/60">Statut</span>
              <select
                value={status()}
                onChange={(e) =>
                  setStatus(e.currentTarget.value as UserStatus | '')
                }
                class="mt-1 w-full rounded-md border border-cream/15 bg-ink px-3 py-2 text-sm text-cream focus:border-moss-light focus:outline-none"
              >
                <option value="">Tous</option>
                <option value="active">Actif</option>
                <option value="pending_admin">À approuver</option>
                <option value="pending_email">Email à confirmer</option>
                <option value="suspended">Suspendu</option>
                <option value="deleted">Supprimé</option>
              </select>
            </label>
            <div class="flex items-end gap-2">
              <button
                type="button"
                class="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-cream hover:bg-moss-light"
                onClick={() => {
                  setPage(1);
                  applyParams();
                  void refetch();
                }}
              >
                Appliquer
              </button>
              <button
                type="button"
                class="rounded-md border border-cream/20 px-4 py-2 text-sm text-cream/80 hover:border-cream/50"
                onClick={() => {
                  setStatus('');
                  setRole('');
                  setQ('');
                  setPage(1);
                  applyParams();
                  void refetch();
                }}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </AdminCard>
      </Show>

      <AdminCard>
        <Show when={list.loading}>
          <p class="text-sm text-cream/60">Chargement…</p>
        </Show>
        <Show when={list.error}>
          <p class="rounded-md border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust">
            Impossible de charger la liste.
          </p>
        </Show>
        <Show when={list()}>
          {(res) => (
            <Show
              when={res().items.length > 0}
              fallback={<EmptyState title="Aucun utilisateur correspondant" />}
            >
              <div class="overflow-x-auto">
                <table class="min-w-full text-left text-sm">
                  <thead class="border-b border-cream/10 text-xs uppercase tracking-wider text-cream/50">
                    <tr>
                      <th class="px-2 py-2">Email / Entreprise</th>
                      <th class="px-2 py-2">Rôle</th>
                      <th class="px-2 py-2">Statut</th>
                      <th class="px-2 py-2">Ville</th>
                      <th class="px-2 py-2">Inscrit</th>
                      <th class="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={res().items}>
                      {(u) => (
                        <tr class="border-b border-cream/5 hover:bg-cream/5">
                          <td class="px-2 py-2">
                            <p class="text-cream">{u.email}</p>
                            <p class="text-xs text-cream/55">
                              {u.companyName ?? '—'}
                              {u.siret ? (
                                <>
                                  {' · '}
                                  <span class="font-mono">{u.siret}</span>
                                </>
                              ) : null}
                            </p>
                          </td>
                          <td class="px-2 py-2">
                            <StatusBadge value={u.role} />
                          </td>
                          <td class="px-2 py-2">
                            <StatusBadge value={u.status} />
                          </td>
                          <td class="px-2 py-2 text-cream/75">
                            {u.city ?? '—'}
                            {u.postalCode ? ` (${u.postalCode})` : ''}
                          </td>
                          <td class="px-2 py-2 font-mono text-xs text-cream/55">
                            {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td class="px-2 py-2">
                            <A
                              href={`/admin/users/${u.id}`}
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
                  applyParams();
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
