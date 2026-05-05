import { A, useParams } from '@solidjs/router';
import { Show, createResource, createSignal } from 'solid-js';
import { adminService } from '../../services/admin.service';
import { AdminButton, AdminCard, StatusBadge } from '../../components/admin/ui';

type ResolveStatus = 'reviewed' | 'resolved' | 'dismissed';

export function AdminReportDetailPage() {
  const params = useParams<{ id: string }>();
  const [report, { mutate }] = createResource(
    () => params.id,
    (id) => adminService.reports.get(id),
  );

  const [status, setStatus] = createSignal<ResolveStatus>('reviewed');
  const [notes, setNotes] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);
  const [pending, setPending] = createSignal(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      const updated = await adminService.reports.resolve(params.id, {
        status: status(),
        adminNotes: notes() || undefined,
      });
      mutate(updated);
      setSuccess('Signalement mis à jour');
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Action impossible');
    } finally {
      setPending(false);
    }
  }

  async function suspendTarget(targetUserId: string) {
    const reason = window.prompt(
      'Motif de suspension du compte signalé ?',
      `Suite au signalement #${params.id}`,
    );
    if (!reason) return;
    try {
      await adminService.users.suspend(targetUserId, reason);
      setSuccess('Compte signalé suspendu');
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Action impossible');
    }
  }

  return (
    <div class="space-y-6">
      <header>
        <A href="/admin/reports" class="text-xs text-cream/55 hover:text-cream">
          ← Liste signalements
        </A>
        <h1 class="mt-1 font-display text-2xl font-semibold text-cream">
          Signalement
        </h1>
      </header>

      <Show when={report.loading}>
        <p class="text-sm text-cream/60">Chargement…</p>
      </Show>

      <Show when={report()}>
        {(r) => (
          <div class="space-y-6">
            <AdminCard
              title={r().category}
              actions={<StatusBadge value={r().status} />}
            >
              <p class="whitespace-pre-line text-sm text-cream/85">{r().description}</p>
              <dl class="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div>
                  <dt class="font-mono text-[10px] uppercase tracking-wider text-cream/50">
                    Auteur
                  </dt>
                  <dd class="mt-0.5 text-cream/80">
                    {r().reporterEmail ?? r().reporterId}
                  </dd>
                </div>
                <div>
                  <dt class="font-mono text-[10px] uppercase tracking-wider text-cream/50">
                    Reçu le
                  </dt>
                  <dd class="mt-0.5 font-mono text-cream/75">
                    {new Date(r().createdAt).toLocaleString('fr-FR')}
                  </dd>
                </div>
                <Show when={r().targetUserId}>
                  <div>
                    <dt class="font-mono text-[10px] uppercase tracking-wider text-cream/50">
                      Utilisateur ciblé
                    </dt>
                    <dd class="mt-0.5 text-cream/85">
                      {r().targetUserEmail ?? r().targetUserId}
                      {' '}·{' '}
                      <A
                        href={`/admin/users/${r().targetUserId}`}
                        class="text-xs text-moss-light hover:underline"
                      >
                        Voir la fiche
                      </A>
                    </dd>
                  </div>
                </Show>
                <Show when={r().targetMessageId}>
                  <div>
                    <dt class="font-mono text-[10px] uppercase tracking-wider text-cream/50">
                      Message ciblé
                    </dt>
                    <dd class="mt-0.5 text-cream/85">
                      <span class="font-mono text-xs">{r().targetMessageId}</span>
                    </dd>
                  </div>
                </Show>
              </dl>
              <Show when={r().targetMessageContent}>
                <div class="mt-4 rounded-md border border-cream/10 bg-ink/40 p-3 text-sm text-cream/80">
                  <p class="font-mono text-[10px] uppercase tracking-wider text-cream/50">
                    Contenu du message
                  </p>
                  <p class="mt-1 whitespace-pre-line">{r().targetMessageContent}</p>
                </div>
              </Show>
            </AdminCard>

            <AdminCard title="Mettre à jour le statut">
              <Show when={success()}>
                <p class="mb-3 rounded-md border border-moss/30 bg-moss/10 px-3 py-2 text-sm text-moss-light">
                  {success()}
                </p>
              </Show>
              <Show when={error()}>
                <p class="mb-3 rounded-md border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust">
                  {error()}
                </p>
              </Show>

              <form class="space-y-4" onSubmit={submit}>
                <label class="block text-sm">
                  <span class="text-cream/60">Statut</span>
                  <select
                    class="mt-1 w-full rounded-md border border-cream/15 bg-ink px-3 py-2 text-sm text-cream focus:border-moss-light focus:outline-none"
                    value={status()}
                    onChange={(e) =>
                      setStatus(e.currentTarget.value as ResolveStatus)
                    }
                  >
                    <option value="reviewed">En cours d'examen</option>
                    <option value="resolved">Résolu</option>
                    <option value="dismissed">Rejeté</option>
                  </select>
                </label>
                <label class="block text-sm">
                  <span class="text-cream/60">
                    Notes admin (obligatoire pour clore le signalement)
                  </span>
                  <textarea
                    rows={4}
                    class="mt-1 w-full rounded-md border border-cream/15 bg-ink px-3 py-2 text-sm text-cream focus:border-moss-light focus:outline-none"
                    value={notes()}
                    onInput={(e) => setNotes(e.currentTarget.value)}
                  />
                </label>
                <Show when={r().adminNotes}>
                  <p class="rounded-md border border-cream/10 bg-cream/5 px-3 py-2 text-xs text-cream/70">
                    Note actuelle : <span class="text-cream/85">{r().adminNotes}</span>
                  </p>
                </Show>
                <div class="flex flex-wrap gap-2">
                  <AdminButton type="submit" disabled={pending()}>
                    Enregistrer
                  </AdminButton>
                  <Show when={r().targetUserId}>
                    <AdminButton
                      variant="danger"
                      onClick={() => suspendTarget(r().targetUserId as string)}
                    >
                      Suspendre l'utilisateur ciblé…
                    </AdminButton>
                  </Show>
                </div>
              </form>
            </AdminCard>
          </div>
        )}
      </Show>
    </div>
  );
}
