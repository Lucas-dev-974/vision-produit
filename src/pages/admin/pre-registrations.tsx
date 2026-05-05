import { useSearchParams } from '@solidjs/router';
import { For, Show, createResource, createSignal } from 'solid-js';
import {
  adminService,
  type AdminPreRegistration,
  type PreRegistrationStatus,
} from '../../services/admin.service';
import {
  AdminButton,
  AdminCard,
  EmptyState,
  Pagination,
  StatusBadge,
} from '../../components/admin/ui';

export function AdminPreRegistrations() {
  const [params, setParams] = useSearchParams();
  const initialStatus = (Array.isArray(params.status) ? params.status[0] : params.status) ?? '';

  const [page, setPage] = createSignal(Number(params.page ?? 1));
  const [status, setStatus] = createSignal<PreRegistrationStatus | ''>(
    initialStatus as PreRegistrationStatus | '',
  );
  const pageSize = 20;

  const [list, { refetch }] = createResource(
    () => ({ page: page(), status: status() || undefined }),
    (filters) =>
      adminService.preRegistrations.list({
        page: filters.page,
        pageSize,
        status: filters.status as PreRegistrationStatus | undefined,
      }),
  );

  const [actionMsg, setActionMsg] = createSignal<string | null>(null);

  function syncParams() {
    setParams({
      status: status() || undefined,
      page: String(page()),
    });
  }

  async function setStatusOf(item: AdminPreRegistration, next: PreRegistrationStatus) {
    setActionMsg(null);
    try {
      await adminService.preRegistrations.updateStatus(item.id, next);
      setActionMsg(`Statut mis à jour : ${item.email} → ${next}`);
      void refetch();
    } catch (err) {
      setActionMsg(
        `Échec : ${(err as { message?: string }).message ?? 'erreur inconnue'}`,
      );
    }
  }

  async function invite(item: AdminPreRegistration) {
    const message = window.prompt(
      `Message personnalisé (optionnel) pour ${item.email} :`,
      '',
    );
    if (message === null) return; // annulation
    try {
      await adminService.preRegistrations.invite(item.id, message || undefined);
      setActionMsg(`Invitation envoyée à ${item.email}`);
      void refetch();
    } catch (err) {
      setActionMsg(
        `Échec invitation : ${(err as { message?: string }).message ?? 'erreur inconnue'}`,
      );
    }
  }

  return (
    <div class="space-y-6">
      <header>
        <h1 class="font-display text-2xl font-semibold text-cream">Pré-inscriptions</h1>
        <p class="mt-1 text-sm text-cream/65">
          File d'attente des futurs utilisateurs. Vous pouvez les contacter, leur
          envoyer une invitation à créer un compte ou refuser.
        </p>
      </header>

      <AdminCard title="Filtre">
        <div class="flex flex-wrap items-end gap-3">
          <label class="block text-sm">
            <span class="text-cream/60">Statut</span>
            <select
              value={status()}
              onChange={(e) => {
                setStatus(e.currentTarget.value as PreRegistrationStatus | '');
                setPage(1);
                syncParams();
                void refetch();
              }}
              class="mt-1 w-56 rounded-md border border-cream/15 bg-ink px-3 py-2 text-sm text-cream focus:border-moss-light focus:outline-none"
            >
              <option value="">Tous</option>
              <option value="pending_email">Email à confirmer</option>
              <option value="pending_review">À examiner</option>
              <option value="contacted">Contactés</option>
              <option value="invited">Invités</option>
              <option value="approved">Approuvés (compte créé)</option>
              <option value="rejected">Refusés</option>
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
              fallback={<EmptyState title="Aucune pré-inscription" />}
            >
              <div class="overflow-x-auto">
                <table class="min-w-full text-left text-sm">
                  <thead class="border-b border-cream/10 text-xs uppercase tracking-wider text-cream/50">
                    <tr>
                      <th class="px-2 py-2">Email</th>
                      <th class="px-2 py-2">Rôle</th>
                      <th class="px-2 py-2">Entreprise</th>
                      <th class="px-2 py-2">Statut</th>
                      <th class="px-2 py-2">Soumis le</th>
                      <th class="px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={res().items}>
                      {(p) => (
                        <tr class="border-b border-cream/5 align-top">
                          <td class="px-2 py-2">
                            <p class="text-cream">{p.email}</p>
                            <Show when={p.message}>
                              <p class="mt-1 line-clamp-2 max-w-md text-xs text-cream/55">
                                {p.message}
                              </p>
                            </Show>
                          </td>
                          <td class="px-2 py-2">
                            <StatusBadge value={p.role} />
                          </td>
                          <td class="px-2 py-2 text-cream/75">
                            <p>{p.companyName ?? '—'}</p>
                            <p class="text-xs text-cream/50">
                              {[p.city, p.postalCode].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </td>
                          <td class="px-2 py-2">
                            <StatusBadge value={p.status} />
                          </td>
                          <td class="px-2 py-2 font-mono text-xs text-cream/55">
                            {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td class="px-2 py-2">
                            <div class="flex flex-wrap gap-1">
                              <Show when={p.status === 'pending_review'}>
                                <AdminButton
                                  variant="ghost"
                                  onClick={() => setStatusOf(p, 'contacted')}
                                >
                                  Contacté
                                </AdminButton>
                              </Show>
                              <Show
                                when={
                                  p.status === 'pending_review' ||
                                  p.status === 'contacted'
                                }
                              >
                                <AdminButton onClick={() => invite(p)}>
                                  Inviter
                                </AdminButton>
                              </Show>
                              <Show when={p.status === 'invited'}>
                                <AdminButton onClick={() => invite(p)}>
                                  Renvoyer invitation
                                </AdminButton>
                              </Show>
                              <Show when={p.status !== 'rejected' && p.status !== 'approved'}>
                                <AdminButton
                                  variant="danger"
                                  onClick={() => setStatusOf(p, 'rejected')}
                                >
                                  Refuser
                                </AdminButton>
                              </Show>
                            </div>
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
