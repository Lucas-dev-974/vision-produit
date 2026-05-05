import { A, useNavigate, useParams } from '@solidjs/router';
import { Show, createResource, createSignal } from 'solid-js';
import { adminService } from '../../services/admin.service';
import { AdminButton, AdminCard, StatusBadge } from '../../components/admin/ui';

export function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, { refetch, mutate }] = createResource(
    () => params.id,
    (id) => adminService.users.get(id),
  );

  const [actionMsg, setActionMsg] = createSignal<string | null>(null);
  const [actionErr, setActionErr] = createSignal<string | null>(null);
  const [pending, setPending] = createSignal(false);

  async function withAction<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
    setActionMsg(null);
    setActionErr(null);
    setPending(true);
    try {
      const out = await fn();
      setActionMsg(label);
      return out;
    } catch (err) {
      const m = (err as { message?: string }).message ?? 'Action impossible';
      setActionErr(m);
    } finally {
      setPending(false);
    }
    return undefined;
  }

  async function approve() {
    const u = await withAction('Compte approuvé', () =>
      adminService.users.approve(params.id),
    );
    if (u) mutate(u);
  }
  async function reactivate() {
    const u = await withAction('Compte réactivé', () =>
      adminService.users.reactivate(params.id),
    );
    if (u) mutate(u);
  }
  async function reject() {
    const reason = window.prompt('Motif de refus ?');
    if (!reason) return;
    const u = await withAction('Compte refusé', () =>
      adminService.users.reject(params.id, reason),
    );
    if (u) mutate(u);
  }
  async function suspend() {
    const reason = window.prompt('Motif de suspension ?');
    if (!reason) return;
    const u = await withAction('Compte suspendu', () =>
      adminService.users.suspend(params.id, reason),
    );
    if (u) mutate(u);
  }
  async function softDelete() {
    if (!window.confirm('Supprimer (soft delete) ce compte ?')) return;
    await withAction('Compte supprimé', () =>
      adminService.users.softDelete(params.id),
    );
    void refetch();
  }

  return (
    <div class="space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <A href="/admin/users" class="text-xs text-cream/55 hover:text-cream">
            ← Liste utilisateurs
          </A>
          <h1 class="mt-1 font-display text-2xl font-semibold text-cream">
            Fiche utilisateur
          </h1>
        </div>
      </header>

      <Show when={user.loading}>
        <p class="text-sm text-cream/60">Chargement…</p>
      </Show>

      <Show when={user.error}>
        <p class="rounded-md border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust">
          Utilisateur introuvable.
        </p>
      </Show>

      <Show when={user()}>
        {(u) => (
          <div class="space-y-6">
            <AdminCard
              title={u().companyName ?? u().email}
              hint={u().email}
              actions={
                <>
                  <StatusBadge value={u().role} />
                  <StatusBadge value={u().status} />
                </>
              }
            >
              <dl class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <Field label="SIRET" value={u().siret ?? '—'} mono />
                <Field label="NAF" value={u().nafCode ?? '—'} mono />
                <Field label="Téléphone" value={u().phone ?? '—'} />
                <Field label="Photo de profil" value={u().profilePhotoUrl ?? '—'} mono />
                <Field
                  label="Adresse"
                  value={[u().addressLine, u().city, u().postalCode]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                />
                <Field
                  label="Coordonnées GPS (privées)"
                  value={
                    u().locationLat != null && u().locationLng != null
                      ? `${u().locationLat?.toFixed(4)}, ${u().locationLng?.toFixed(4)}`
                      : '—'
                  }
                  mono
                />
                <Field
                  label="Inscrit le"
                  value={new Date(u().createdAt).toLocaleString('fr-FR')}
                  mono
                />
                <Field
                  label="Mis à jour le"
                  value={new Date(u().updatedAt).toLocaleString('fr-FR')}
                  mono
                />
                <Show when={u().deletedAt}>
                  <Field
                    label="Supprimé le"
                    value={new Date(u().deletedAt as string).toLocaleString('fr-FR')}
                    mono
                  />
                </Show>
              </dl>
              <Show when={u().description}>
                <p class="mt-4 whitespace-pre-line rounded-md border border-cream/10 bg-ink/40 p-3 text-sm text-cream/80">
                  {u().description}
                </p>
              </Show>
            </AdminCard>

            <Show when={u().producerProfile}>
              {(p) => (
                <AdminCard title="Profil producteur">
                  <dl class="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <Field
                      label="Note moyenne"
                      value={p().averageRating.toFixed(2)}
                      mono
                    />
                    <Field label="Nb avis" value={String(p().totalRatings)} mono />
                    <Field
                      label="Fiabilité"
                      value={`${p().reliabilityScore.toFixed(0)} %`}
                      mono
                    />
                    <Field label="Commandes" value={String(p().totalOrders)} mono />
                  </dl>
                </AdminCard>
              )}
            </Show>

            <AdminCard title="Activité commerciale">
              <dl class="grid grid-cols-2 gap-3 text-sm">
                <Field
                  label="Commandes en tant qu'acheteur"
                  value={String(u().ordersSummary.asBuyer)}
                  mono
                />
                <Field
                  label="Commandes en tant que producteur"
                  value={String(u().ordersSummary.asProducer)}
                  mono
                />
              </dl>
            </AdminCard>

            <AdminCard title="Actions de modération">
              <Show when={actionMsg()}>
                <p class="mb-3 rounded-md border border-moss/30 bg-moss/10 px-3 py-2 text-sm text-moss-light">
                  {actionMsg()}
                </p>
              </Show>
              <Show when={actionErr()}>
                <p class="mb-3 rounded-md border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust">
                  {actionErr()}
                </p>
              </Show>

              <div class="flex flex-wrap gap-2">
                <Show when={u().status === 'pending_admin' || u().status === 'pending_email'}>
                  <AdminButton onClick={approve} disabled={pending()}>
                    Approuver
                  </AdminButton>
                  <AdminButton variant="danger" onClick={reject} disabled={pending()}>
                    Refuser…
                  </AdminButton>
                </Show>
                <Show when={u().status === 'active'}>
                  <AdminButton variant="danger" onClick={suspend} disabled={pending()}>
                    Suspendre…
                  </AdminButton>
                </Show>
                <Show when={u().status === 'suspended'}>
                  <AdminButton onClick={reactivate} disabled={pending()}>
                    Réactiver
                  </AdminButton>
                </Show>
                <Show when={u().role !== 'admin' && u().status !== 'deleted'}>
                  <AdminButton variant="ghost" onClick={softDelete} disabled={pending()}>
                    Supprimer (soft)
                  </AdminButton>
                </Show>
                <AdminButton variant="ghost" onClick={() => navigate('/admin/users')}>
                  Retour à la liste
                </AdminButton>
              </div>
              <Show when={u().role === 'admin'}>
                <p class="mt-3 text-xs text-cream/55">
                  Les comptes admin ne sont pas modifiables depuis ce panneau.
                </p>
              </Show>
            </AdminCard>
          </div>
        )}
      </Show>
    </div>
  );
}

function Field(props: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt class="font-mono text-[10px] uppercase tracking-wider text-cream/50">
        {props.label}
      </dt>
      <dd class={`mt-0.5 ${props.mono ? 'font-mono' : ''} text-cream/85`}>
        {props.value}
      </dd>
    </div>
  );
}

