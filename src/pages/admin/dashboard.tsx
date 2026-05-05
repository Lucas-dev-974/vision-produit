import { Show, createResource, For } from 'solid-js';
import { adminService } from '../../services/admin.service';
import { AdminCard, EmptyState, StatCard } from '../../components/admin/ui';

export function AdminDashboard() {
  const [stats] = createResource(() => adminService.stats());

  const formatPct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div class="space-y-8">
      <header>
        <h1 class="font-display text-2xl font-semibold text-cream">Vue d'ensemble</h1>
        <p class="mt-1 text-sm text-cream/65">
          État global de la plateforme — phases d'inscription, modération, activité
          commerciale.
        </p>
      </header>

      <Show when={stats.loading}>
        <p class="text-sm text-cream/60">Chargement des statistiques…</p>
      </Show>

      <Show when={stats.error}>
        <p class="rounded-md border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust">
          Impossible de charger les statistiques.
        </p>
      </Show>

      <Show when={stats()}>
        {(s) => (
          <div class="space-y-8">
            <AdminCard
              title="Pré-inscriptions"
              hint="File d'attente de la phase pré-lancement."
            >
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                <StatCard
                  label="Total"
                  value={s().preRegistrations.total}
                  href="/admin/pre-inscriptions"
                />
                <StatCard
                  label="Email à confirmer"
                  value={s().preRegistrations.pending_email}
                  href="/admin/pre-inscriptions?status=pending_email"
                  tone="warning"
                />
                <StatCard
                  label="À examiner"
                  value={s().preRegistrations.pending_review}
                  href="/admin/pre-inscriptions?status=pending_review"
                  tone="warning"
                />
                <StatCard
                  label="Contactés"
                  value={s().preRegistrations.contacted}
                  href="/admin/pre-inscriptions?status=contacted"
                />
                <StatCard
                  label="Invités"
                  value={s().preRegistrations.invited}
                  href="/admin/pre-inscriptions?status=invited"
                />
                <StatCard
                  label="Approuvés"
                  value={s().preRegistrations.approved}
                  href="/admin/pre-inscriptions?status=approved"
                  tone="success"
                />
                <StatCard
                  label="Refusés"
                  value={s().preRegistrations.rejected}
                  href="/admin/pre-inscriptions?status=rejected"
                  tone="danger"
                />
              </div>
            </AdminCard>

            <AdminCard title="Utilisateurs">
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                <StatCard
                  label="Total"
                  value={s().users.total}
                  href="/admin/users"
                />
                <StatCard
                  label="Actifs"
                  value={s().users.active}
                  href="/admin/users?status=active"
                  tone="success"
                />
                <StatCard
                  label="À approuver"
                  value={s().users.pendingAdmin}
                  href="/admin/users/pending"
                  tone="warning"
                />
                <StatCard
                  label="Email à confirmer"
                  value={s().users.pendingEmail}
                  href="/admin/users?status=pending_email"
                />
                <StatCard
                  label="Suspendus"
                  value={s().users.suspended}
                  href="/admin/users?status=suspended"
                  tone="danger"
                />
                <StatCard
                  label="Supprimés"
                  value={s().users.deleted}
                  href="/admin/users?status=deleted"
                />
              </div>
              <div class="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-cream/70">
                <div class="rounded-md border border-cream/15 px-3 py-2">
                  <span class="block font-mono uppercase text-[10px] tracking-wider text-cream/50">
                    Producteurs
                  </span>
                  <span class="font-display text-lg text-cream">
                    {s().users.byRole.producer}
                  </span>
                </div>
                <div class="rounded-md border border-cream/15 px-3 py-2">
                  <span class="block font-mono uppercase text-[10px] tracking-wider text-cream/50">
                    Commerçants
                  </span>
                  <span class="font-display text-lg text-cream">
                    {s().users.byRole.buyer}
                  </span>
                </div>
                <div class="rounded-md border border-cream/15 px-3 py-2">
                  <span class="block font-mono uppercase text-[10px] tracking-wider text-cream/50">
                    Admins
                  </span>
                  <span class="font-display text-lg text-cream">
                    {s().users.byRole.admin}
                  </span>
                </div>
              </div>
            </AdminCard>

            <AdminCard
              title="Activité commerciale (30j)"
              hint={`Acceptation : ${formatPct(s().orders.acceptanceRate30d)} · Honoration : ${formatPct(s().orders.honorRate30d)}`}
            >
              <Show
                when={
                  Object.values(s().orders.last30d).reduce((a, b) => a + b, 0) > 0
                }
                fallback={<EmptyState title="Aucune commande sur 30 jours" />}
              >
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
                  <For each={Object.entries(s().orders.last30d)}>
                    {([status, count]) => (
                      <StatCard label={status} value={count} />
                    )}
                  </For>
                </div>
              </Show>
            </AdminCard>

            <AdminCard title="Modération">
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  label="Ouverts"
                  value={s().reports.open}
                  href="/admin/reports?status=open"
                  tone="danger"
                />
                <StatCard
                  label="En cours"
                  value={s().reports.reviewed}
                  href="/admin/reports?status=reviewed"
                  tone="warning"
                />
                <StatCard
                  label="Résolus"
                  value={s().reports.resolved}
                  href="/admin/reports?status=resolved"
                  tone="success"
                />
                <StatCard
                  label="Rejetés"
                  value={s().reports.dismissed}
                  href="/admin/reports?status=dismissed"
                />
              </div>
            </AdminCard>

            <AdminCard title="Qualité">
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-2">
                <StatCard
                  label="Note moyenne"
                  value={s().quality.averageRating.toFixed(2)}
                  hint="Sur l'ensemble des producteurs"
                />
                <StatCard
                  label="Fiabilité moyenne"
                  value={`${s().quality.averageReliability.toFixed(0)}%`}
                  hint="Score producteur"
                />
              </div>
            </AdminCard>
          </div>
        )}
      </Show>
    </div>
  );
}
