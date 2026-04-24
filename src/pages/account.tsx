import { Show, createSignal, onMount } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { Button } from '../components/ui/button';
import { authStore } from '../stores/auth.store';
import { userService } from '../services/user.service';
import type { ApiError } from '../services/http-client';
import { formatIsoDate } from '../lib/formatters/date';
import type { User } from '../entities';
import {
  getNotificationState,
  requestSystemNotificationPermission,
} from '../lib/system-notifications';

function nullIfEmpty(s: string): string | null {
  const t = s.trim();
  return t === '' ? null : t;
}

function parseCoord(raw: string): number | null {
  const t = raw.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function AccountPage() {
  const navigate = useNavigate();
  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [saveError, setSaveError] = createSignal<string | null>(null);
  const [saveOk, setSaveOk] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [exporting, setExporting] = createSignal(false);
  const [deleting, setDeleting] = createSignal(false);

  const [phone, setPhone] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [profilePhotoUrl, setProfilePhotoUrl] = createSignal('');
  const [addressLine, setAddressLine] = createSignal('');
  const [city, setCity] = createSignal('');
  const [postalCode, setPostalCode] = createSignal('');
  const [locationLat, setLocationLat] = createSignal('');
  const [locationLng, setLocationLng] = createSignal('');
  const [notifPermission, setNotifPermission] = createSignal(getNotificationState());

  function hydrateFromUser(u: User) {
    setPhone(u.phone ?? '');
    setDescription(u.description ?? '');
    setProfilePhotoUrl(u.profilePhotoUrl ?? '');
    setAddressLine(u.addressLine ?? '');
    setCity(u.city ?? '');
    setPostalCode(u.postalCode ?? '');
    setLocationLat(u.locationLat != null ? String(u.locationLat) : '');
    setLocationLng(u.locationLng != null ? String(u.locationLng) : '');
  }

  onMount(async () => {
    setLoadError(null);
    try {
      if (!authStore.currentUser()) {
        await authStore.loadCurrentUser();
      }
      const u = authStore.currentUser();
      if (!u) {
        setLoadError('Session expirée ou indisponible.');
        return;
      }
      hydrateFromUser(u);
      setNotifPermission(getNotificationState());
    } catch {
      setLoadError('Impossible de charger votre profil.');
    }
  });

  async function onRequestNotifications() {
    await requestSystemNotificationPermission();
    setNotifPermission(getNotificationState());
  }

  async function onSubmitProfile(e: Event) {
    e.preventDefault();
    setSaveError(null);
    setSaveOk(false);

    const latRaw = locationLat().trim();
    const lngRaw = locationLng().trim();
    const hasLat = latRaw !== '';
    const hasLng = lngRaw !== '';
    if (hasLat !== hasLng) {
      setSaveError('Renseignez la latitude et la longitude ensemble, ou laissez les deux vides.');
      return;
    }

    let lat: number | undefined;
    let lng: number | undefined;
    if (hasLat && hasLng) {
      const parsedLat = parseCoord(latRaw);
      const parsedLng = parseCoord(lngRaw);
      if (parsedLat === null || parsedLng === null) {
        setSaveError('Coordonnées invalides.');
        return;
      }
      if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
        setSaveError('Latitude (−90…90) ou longitude (−180…180) hors plage.');
        return;
      }
      lat = parsedLat;
      lng = parsedLng;
    }

    const desc = description().trim();
    if (desc.length > 10000) {
      setSaveError('Description trop longue (10 000 caractères max).');
      return;
    }

    setSaving(true);
    try {
      const body: Parameters<typeof userService.patchMe>[0] = {
        phone: nullIfEmpty(phone()),
        description: nullIfEmpty(description()),
        profilePhotoUrl: nullIfEmpty(profilePhotoUrl()),
        addressLine: nullIfEmpty(addressLine()),
        city: nullIfEmpty(city()),
        postalCode: nullIfEmpty(postalCode()),
      };
      if (lat !== undefined && lng !== undefined) {
        body.locationLat = lat;
        body.locationLng = lng;
      }

      await userService.patchMe(body);
      setSaveOk(true);
      await authStore.loadCurrentUser();
      const fresh = authStore.currentUser();
      if (fresh) hydrateFromUser(fresh);
    } catch (err) {
      const api = err as ApiError;
      setSaveError(api.message ?? 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function onExport() {
    setSaveError(null);
    setExporting(true);
    try {
      const payload = await userService.exportMe();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monappli-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const api = err as ApiError;
      setSaveError(api.message ?? 'Export impossible.');
    } finally {
      setExporting(false);
    }
  }

  async function onDeleteAccount() {
    if (
      !window.confirm(
        'Fermer votre compte ? Votre profil sera marqué comme supprimé. Cette action est irréversible côté application.',
      )
    ) {
      return;
    }
    setDeleting(true);
    setSaveError(null);
    try {
      await userService.deleteMe();
      await authStore.logout();
      navigate('/', { replace: true });
    } catch (err) {
      const api = err as ApiError;
      setSaveError(api.message ?? 'Suppression impossible.');
    } finally {
      setDeleting(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss';

  return (
    <div class="space-y-10">
      <header>
        <h1 class="font-display text-3xl font-semibold text-ink">Compte</h1>
        <p class="mt-2 max-w-2xl text-ink/75">
          Informations de votre entreprise, coordonnées et données personnelles (export RGPD).
        </p>
      </header>

      <Show when={loadError()}>
        {(msg) => (
          <div class="rounded-xl border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust" role="alert">
            {msg()}
            <p class="mt-2">
              <A href="/login" class="font-medium underline underline-offset-2">
                Se connecter
              </A>
            </p>
          </div>
        )}
      </Show>

      <Show when={authStore.currentUser()}>
        {(u) => (
          <>
            <section class="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm">
              <h2 class="font-display text-lg font-semibold text-ink">Résumé</h2>
              <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt class="font-mono text-xs uppercase text-ink/45">E-mail</dt>
                  <dd class="mt-0.5 text-ink">{u().email}</dd>
                </div>
                <div>
                  <dt class="font-mono text-xs uppercase text-ink/45">Rôle</dt>
                  <dd class="mt-0.5 text-ink">{u().role}</dd>
                </div>
                <div>
                  <dt class="font-mono text-xs uppercase text-ink/45">Statut</dt>
                  <dd class="mt-0.5 text-ink">{u().status}</dd>
                </div>
                <div>
                  <dt class="font-mono text-xs uppercase text-ink/45">Entreprise</dt>
                  <dd class="mt-0.5 text-ink">{u().companyName ?? '—'}</dd>
                </div>
                <Show when={u().siret}>
                  <div>
                    <dt class="font-mono text-xs uppercase text-ink/45">SIRET</dt>
                    <dd class="mt-0.5 font-mono text-ink">{u().siret}</dd>
                  </div>
                </Show>
                <Show when={u().nafCode}>
                  <div>
                    <dt class="font-mono text-xs uppercase text-ink/45">NAF</dt>
                    <dd class="mt-0.5 font-mono text-ink">{u().nafCode}</dd>
                  </div>
                </Show>
                <div class="sm:col-span-2">
                  <dt class="font-mono text-xs uppercase text-ink/45">Compte créé le</dt>
                  <dd class="mt-0.5 text-ink">{formatIsoDate(u().createdAt)}</dd>
                </div>
              </dl>
              <p class="mt-4 text-xs text-ink/55">
                Le SIRET et le code NAF ne sont pas modifiables ici. Contactez le support pour toute
                correction.
              </p>
              <div class="mt-6 border-t border-cream-dark pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    void authStore.logout().then(() => navigate('/', { replace: true }));
                  }}
                >
                  Se déconnecter
                </Button>
              </div>
            </section>

            <Show when={u().role === 'buyer' || u().role === 'producer'}>
              <section class="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm">
                <h2 class="font-display text-lg font-semibold text-ink">Notifications système</h2>
                <p class="mt-2 text-sm text-ink/70">
                  Autorisez les alertes du navigateur pour être prévenu d’un nouveau message ou d’une
                  mise à jour de commande lorsque l’app est en arrière-plan (surtout utile sur Android /
                  Chrome et sur bureau). Sur iOS, les notifications Web restent limitées même avec la PWA
                  installée ; utilisez les réglages du site dans Safari si disponible.
                </p>
                <p class="mt-2 text-xs font-mono text-ink/55">
                  État navigateur : {notifPermission()}
                </p>
                <div class="mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      notifPermission() === 'granted' || notifPermission() === 'unsupported'
                    }
                    onClick={() => void onRequestNotifications()}
                  >
                    {notifPermission() === 'granted'
                      ? 'Notifications autorisées'
                      : 'Demander l’autorisation'}
                  </Button>
                </div>
              </section>
            </Show>

            <section class="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm">
              <h2 class="font-display text-lg font-semibold text-ink">Profil modifiable</h2>
              <Show when={u().role === 'producer'}>
                <p class="mt-2 text-sm text-ink/70">
                  En tant que producteur, si vous renseignez une <strong>position exacte</strong>, la
                  carte publique utilise des coordonnées <strong>floutées</strong> dérivées de celle-ci.
                </p>
              </Show>

              <form class="mt-6 space-y-4" onSubmit={onSubmitProfile}>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="text-sm font-medium text-ink" for="acc-phone">
                      Téléphone
                    </label>
                    <input
                      id="acc-phone"
                      type="tel"
                      class={inputClass}
                      maxlength={20}
                      value={phone()}
                      onInput={(e) => setPhone(e.currentTarget.value)}
                    />
                  </div>
                  <div>
                    <label class="text-sm font-medium text-ink" for="acc-photo">
                      URL photo de profil
                    </label>
                    <input
                      id="acc-photo"
                      type="url"
                      class={inputClass}
                      maxlength={500}
                      placeholder="https://…"
                      value={profilePhotoUrl()}
                      onInput={(e) => setProfilePhotoUrl(e.currentTarget.value)}
                    />
                  </div>
                </div>

                <div>
                  <label class="text-sm font-medium text-ink" for="acc-desc">
                    Description
                  </label>
                  <textarea
                    id="acc-desc"
                    class={`${inputClass} min-h-[100px]`}
                    maxlength={10000}
                    rows={4}
                    value={description()}
                    onInput={(e) => setDescription(e.currentTarget.value)}
                  />
                  <p class="mt-1 text-xs text-ink/45">{description().length} / 10 000</p>
                </div>

                <div>
                  <label class="text-sm font-medium text-ink" for="acc-address">
                    Adresse (ligne)
                  </label>
                  <input
                    id="acc-address"
                    class={inputClass}
                    maxlength={255}
                    value={addressLine()}
                    onInput={(e) => setAddressLine(e.currentTarget.value)}
                  />
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="text-sm font-medium text-ink" for="acc-city">
                      Ville
                    </label>
                    <input
                      id="acc-city"
                      class={inputClass}
                      maxlength={100}
                      value={city()}
                      onInput={(e) => setCity(e.currentTarget.value)}
                    />
                  </div>
                  <div>
                    <label class="text-sm font-medium text-ink" for="acc-postal">
                      Code postal
                    </label>
                    <input
                      id="acc-postal"
                      class={inputClass}
                      maxlength={10}
                      value={postalCode()}
                      onInput={(e) => setPostalCode(e.currentTarget.value)}
                    />
                  </div>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="text-sm font-medium text-ink" for="acc-lat">
                      Latitude (WGS84)
                    </label>
                    <input
                      id="acc-lat"
                      class={inputClass}
                      inputmode="decimal"
                      placeholder="ex. -20.8789"
                      value={locationLat()}
                      onInput={(e) => setLocationLat(e.currentTarget.value)}
                    />
                  </div>
                  <div>
                    <label class="text-sm font-medium text-ink" for="acc-lng">
                      Longitude (WGS84)
                    </label>
                    <input
                      id="acc-lng"
                      class={inputClass}
                      inputmode="decimal"
                      placeholder="ex. 55.4481"
                      value={locationLng()}
                      onInput={(e) => setLocationLng(e.currentTarget.value)}
                    />
                  </div>
                </div>

                <Show when={saveError()}>
                  {(msg) => (
                    <p class="rounded-md bg-rust/10 px-3 py-2 text-sm text-rust" role="alert">
                      {msg()}
                    </p>
                  )}
                </Show>
                <Show when={saveOk()}>
                  <p class="rounded-md bg-moss/10 px-3 py-2 text-sm text-moss" role="status">
                    Modifications enregistrées.
                  </p>
                </Show>

                <Button type="submit" disabled={saving()}>
                  {saving() ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
              </form>
            </section>

            <section class="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm">
              <h2 class="font-display text-lg font-semibold text-ink">Vos données (RGPD)</h2>
              <p class="mt-2 text-sm text-ink/70">
                Téléchargez une copie des informations que nous détenons sur votre compte (JSON).
              </p>
              <Button
                type="button"
                class="mt-4"
                variant="secondary"
                disabled={exporting()}
                onClick={() => void onExport()}
              >
                {exporting() ? 'Préparation…' : 'Télécharger l’export'}
              </Button>
            </section>

            <section class="rounded-2xl border border-rust/30 bg-rust/5 p-6">
              <h2 class="font-display text-lg font-semibold text-rust">Zone sensible</h2>
              <p class="mt-2 text-sm text-ink/75">
                Fermeture du compte : déconnexion immédiate et statut « supprimé » (traitement conforme
                à la politique produit).
              </p>
              <Button
                type="button"
                class="mt-4"
                variant="secondary"
                disabled={deleting()}
                onClick={() => void onDeleteAccount()}
              >
                {deleting() ? 'Traitement…' : 'Fermer mon compte'}
              </Button>
            </section>
          </>
        )}
      </Show>
    </div>
  );
}
