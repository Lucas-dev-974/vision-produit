import { Show, For, createSignal, createEffect, onCleanup } from 'solid-js';
import { createStore, reconcile, unwrap } from 'solid-js/store';
import { Portal } from 'solid-js/web';
import { Button } from '../ui/button';
import {
  surveyService,
  type SurveyAnswers,
  type SurveyRespondentRole,
} from '../../services/survey.service';
import {
  ROLE_OPTIONS,
  SIZE_OPTIONS,
  SURVEY_SECTIONS,
  ZONE_OPTIONS,
  type SurveyQuestion,
} from '../../config/survey-questions';
import type { ApiError } from '../../services/http-client';

export interface SurveyModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  role: SurveyRespondentRole | '';
  activityType: string;
  zones: string[];
  sizeBracket: string;
  consentRgpd: boolean;
  consentRecontact: boolean;
}

const EMPTY_FORM: FormState = {
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  role: '',
  activityType: '',
  zones: [],
  sizeBracket: '',
  consentRgpd: false,
  consentRecontact: true,
};

export function SurveyModal(props: SurveyModalProps) {
  const [form, setForm] = createStore<FormState>({ ...EMPTY_FORM });
  const [answers, setAnswers] = createStore<SurveyAnswers>({});

  const [error, setError] = createSignal<string | null>(null);
  const [pending, setPending] = createSignal(false);
  const [submitted, setSubmitted] = createSignal(false);

  createEffect(() => {
    if (props.open) {
      setError(null);
      setSubmitted(false);
    }
  });

  createEffect(() => {
    if (props.open && typeof document !== 'undefined') {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      onCleanup(() => {
        document.body.style.overflow = previous;
      });
    }
  });

  function toggleGeoZone(code: string) {
    if (code === 'all') {
      setForm('zones', ['all']);
      return;
    }
    const withoutAll = form.zones.filter((z) => z !== 'all');
    const exists = withoutAll.includes(code);
    const next = exists
      ? withoutAll.filter((z) => z !== code)
      : [...withoutAll, code];
    setForm('zones', next);
  }

  function setSingle(key: keyof SurveyAnswers, value: string) {
    setAnswers(key, value as SurveyAnswers[typeof key]);
  }

  function toggleMulti(key: keyof SurveyAnswers, code: string, max?: number) {
    const rowKey = key as keyof SurveyAnswers;
    const prev = (answers[rowKey] as string[] | undefined) ?? [];
    const exists = prev.includes(code);
    if (exists) {
      setAnswers(rowKey, prev.filter((c) => c !== code) as SurveyAnswers[typeof rowKey]);
      return;
    }
    if (max && prev.length >= max) return;
    setAnswers(rowKey, [...prev, code] as SurveyAnswers[typeof rowKey]);
  }

  function setText(key: keyof SurveyAnswers, value: string) {
    setAnswers(key, value as SurveyAnswers[typeof key]);
  }

  function reset() {
    setForm(reconcile({ ...EMPTY_FORM }));
    setAnswers(reconcile({}));
  }

  function close() {
    if (pending()) return;
    props.onClose();
    if (submitted()) reset();
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);

    if (!form.role) {
      setError('Merci d’indiquer si vous êtes producteur, commerçant ou les deux.');
      return;
    }
    if (!form.contactEmail.trim()) {
      setError('Merci de renseigner votre e-mail.');
      return;
    }
    if (!form.contactPhone.trim()) {
      setError('Merci de renseigner votre numéro de téléphone.');
      return;
    }
    if (!form.consentRgpd) {
      setError(
        'Vous devez accepter le traitement de vos réponses pour envoyer le questionnaire.',
      );
      return;
    }

    setPending(true);
    try {
      await surveyService.create({
        contactName: form.contactName.trim() || undefined,
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        role: form.role,
        activityType: form.activityType.trim() || undefined,
        zone: form.zones.length > 0 ? form.zones : undefined,
        sizeBracket: form.sizeBracket || undefined,
        answers: unwrap(answers) as SurveyAnswers,
        consentRgpd: true,
        consentRecontact: form.consentRecontact,
        source: 'landing_modal',
      });
      setSubmitted(true);
    } catch (err) {
      const api = err as ApiError;
      setError(api.message ?? 'Envoi impossible. Réessayez plus tard.');
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-cream-dark bg-white px-3 py-2 text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss';

  return (
    <Show when={props.open}>
      <Portal>
        {/* Pas de backdrop-blur : coûteux GPU avec un long formulaire */}
        <div
          class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/70 px-4 py-6 md:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="survey-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div class="w-full max-w-3xl rounded-2xl border border-cream-dark bg-cream shadow-xl">
            <header class="flex items-start justify-between gap-3 border-b border-cream-dark/60 px-6 py-4">
              <div>
                <h2
                  id="survey-modal-title"
                  class="font-display text-xl font-semibold text-ink"
                >
                  Questionnaire — votre activité aujourd’hui
                </h2>
                <p class="mt-1 text-sm text-ink/65">
                  Quelques minutes pour nous aider à mieux comprendre vos enjeux
                  et calibrer la plateforme.
                </p>
              </div>
              <button
                type="button"
                aria-label="Fermer"
                class="rounded-md p-2 text-ink/60 transition hover:bg-cream-dark/60 hover:text-ink"
                onClick={close}
              >
                <span aria-hidden class="block text-lg leading-none">
                  ×
                </span>
              </button>
            </header>

            <Show
              when={!submitted()}
              fallback={
                <SuccessState
                  email={form.contactEmail}
                  onClose={() => {
                    props.onClose();
                    reset();
                  }}
                />
              }
            >
              <form
                class="max-h-[75vh] space-y-8 overflow-y-auto overscroll-contain px-6 py-6"
                onSubmit={onSubmit}
                novalidate
              >
                <section class="space-y-4 [content-visibility:auto]">
                  <SectionTitle title="Vous êtes" />
                  <div class="grid gap-2 sm:grid-cols-3">
                    <For each={ROLE_OPTIONS}>
                      {(opt) => (
                        <RadioCard
                          name="role"
                          value={opt.code}
                          selected={form.role === opt.code}
                          onSelect={() =>
                            setForm('role', opt.code as SurveyRespondentRole)
                          }
                          label={opt.label}
                        />
                      )}
                    </For>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <Field label="Type d’activité (optionnel)" htmlFor="activityType">
                      <input
                        id="activityType"
                        type="text"
                        maxlength={120}
                        placeholder="Maraîchage, élevage, restaurant…"
                        class={inputClass}
                        value={form.activityType}
                        onInput={(e) => setForm('activityType', e.currentTarget.value)}
                      />
                    </Field>
                    <Field label="Taille de l’activité (optionnel)" htmlFor="sizeBracket">
                      <select
                        id="sizeBracket"
                        class={inputClass}
                        value={form.sizeBracket}
                        onChange={(e) => setForm('sizeBracket', e.currentTarget.value)}
                      >
                        <option value="">—</option>
                        <For each={SIZE_OPTIONS}>
                          {(o) => <option value={o.code}>{o.label}</option>}
                        </For>
                      </select>
                    </Field>
                  </div>

                  <Field
                    label="Zone géographique (optionnel)"
                    htmlFor="geo-zones"
                    hint="Plusieurs choix possibles. « Toute La Réunion » seul désactive les autres zones."
                  >
                    <div id="geo-zones" class="flex flex-wrap gap-2" role="group">
                      <For each={ZONE_OPTIONS}>
                        {(opt) => (
                          <Chip
                            selected={form.zones.includes(opt.code)}
                            onClick={() => toggleGeoZone(opt.code)}
                          >
                            {opt.label}
                          </Chip>
                        )}
                      </For>
                    </div>
                  </Field>
                </section>

                <For each={SURVEY_SECTIONS}>
                  {(section) => (
                    <section class="space-y-4 [content-visibility:auto]">
                      <SectionTitle
                        title={section.title}
                        description={section.description}
                      />
                      <For each={section.questions}>
                        {(q) => (
                          <QuestionField
                            question={q}
                            getValue={() =>
                              answers[q.key as keyof SurveyAnswers] as unknown
                            }
                            onSetSingle={(v) =>
                              setSingle(q.key as keyof SurveyAnswers, v)
                            }
                            onToggleMulti={(code) =>
                              toggleMulti(
                                q.key as keyof SurveyAnswers,
                                code,
                                q.maxMulti,
                              )
                            }
                            onSetText={(v) =>
                              setText(q.key as keyof SurveyAnswers, v)
                            }
                            inputClass={inputClass}
                          />
                        )}
                      </For>
                    </section>
                  )}
                </For>

                <section class="space-y-4 [content-visibility:auto]">
                  <SectionTitle
                    title="Vos coordonnées"
                    description="Nécessaires pour vous recontacter et tester la plateforme en avant-première."
                  />
                  <Field label="Nom (optionnel)" htmlFor="contactName">
                    <input
                      id="contactName"
                      type="text"
                      autocomplete="name"
                      maxlength={120}
                      class={inputClass}
                      value={form.contactName}
                      onInput={(e) => setForm('contactName', e.currentTarget.value)}
                    />
                  </Field>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <Field label="E-mail" htmlFor="contactEmail" required>
                      <input
                        id="contactEmail"
                        type="email"
                        autocomplete="email"
                        required
                        maxlength={255}
                        class={inputClass}
                        value={form.contactEmail}
                        onInput={(e) =>
                          setForm('contactEmail', e.currentTarget.value)
                        }
                      />
                    </Field>
                    <Field label="Téléphone" htmlFor="contactPhone" required>
                      <input
                        id="contactPhone"
                        type="tel"
                        autocomplete="tel"
                        required
                        maxlength={30}
                        class={inputClass}
                        value={form.contactPhone}
                        onInput={(e) =>
                          setForm('contactPhone', e.currentTarget.value)
                        }
                      />
                    </Field>
                  </div>
                  <label class="flex items-start gap-3 rounded-xl border border-cream-dark bg-cream/60 p-3">
                    <input
                      type="checkbox"
                      class="mt-1 h-4 w-4 rounded border-cream-dark text-moss focus:ring-moss"
                      checked={form.consentRecontact}
                      onChange={(e) =>
                        setForm('consentRecontact', e.currentTarget.checked)
                      }
                    />
                    <span class="text-sm text-ink/80">
                      J’accepte d’être recontacté·e pour échanger sur mes besoins
                      et tester la plateforme en avant-première.
                    </span>
                  </label>
                  <label class="flex items-start gap-3 rounded-xl border border-cream-dark bg-cream/60 p-3">
                    <input
                      type="checkbox"
                      class="mt-1 h-4 w-4 rounded border-cream-dark text-moss focus:ring-moss"
                      checked={form.consentRgpd}
                      onChange={(e) =>
                        setForm('consentRgpd', e.currentTarget.checked)
                      }
                      required
                    />
                    <span class="text-sm text-ink/80">
                      J’accepte que mes réponses soient conservées et utilisées
                      pour analyser les besoins du marché. Je peux demander leur
                      suppression à tout moment.
                    </span>
                  </label>
                </section>

                <Show when={error()}>
                  <p
                    class="rounded-md bg-rust/10 px-3 py-2 text-sm text-rust"
                    role="alert"
                  >
                    {error()}
                  </p>
                </Show>

                <div class="flex flex-wrap items-center justify-end gap-3 border-t border-cream-dark/60 pt-4">
                  <Button variant="ghost" type="button" onClick={close}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={pending()}>
                    {pending() ? 'Envoi…' : 'Envoyer mes réponses'}
                  </Button>
                </div>
              </form>
            </Show>
          </div>
        </div>
      </Portal>
    </Show>
  );
}

function SectionTitle(props: { title: string; description?: string }) {
  return (
    <div>
      <h3 class="font-display text-base font-semibold text-ink">{props.title}</h3>
      <Show when={props.description}>
        <p class="mt-0.5 text-xs text-ink/55">{props.description}</p>
      </Show>
    </div>
  );
}

function Field(props: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: any;
}) {
  return (
    <div>
      <label class="block text-sm font-medium text-ink" for={props.htmlFor}>
        {props.label}
        {props.required ? <span class="ml-1 text-rust">*</span> : null}
      </label>
      {props.children}
      {props.hint ? <p class="mt-1 text-xs text-ink/55">{props.hint}</p> : null}
    </div>
  );
}

function RadioCard(props: {
  name: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <label
      class={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-center text-sm transition ${
        props.selected
          ? 'border-moss bg-moss/5 font-medium text-moss ring-1 ring-moss'
          : 'border-cream-dark bg-white text-ink hover:border-moss/40'
      }`}
    >
      <input
        type="radio"
        name={props.name}
        value={props.value}
        checked={props.selected}
        onChange={() => props.onSelect()}
        class="sr-only"
      />
      {props.label}
    </label>
  );
}

function Chip(props: {
  selected: boolean;
  onClick: () => void;
  children: any;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`rounded-full border px-3 py-1 text-xs transition ${
        props.selected
          ? 'border-moss bg-moss/10 font-medium text-moss'
          : 'border-cream-dark bg-white text-ink/75 hover:border-moss/40'
      }`}
    >
      {props.children}
    </button>
  );
}

/** Une ligne de question : lit uniquement sa clé dans le store via getValue(). */
function QuestionField(props: {
  question: SurveyQuestion;
  getValue: () => unknown;
  onSetSingle: (code: string) => void;
  onToggleMulti: (code: string) => void;
  onSetText: (value: string) => void;
  inputClass: string;
}) {
  const q = () => props.question;
  return (
    <div class="space-y-2 rounded-xl bg-cream/60 p-3">
      <div class="text-sm font-medium text-ink">{q().label}</div>
      <Show when={q().hint}>
        <p class="text-xs text-ink/55">{q().hint}</p>
      </Show>

      <Show when={q().type === 'single' && q().options}>
        <div class="flex flex-wrap gap-2">
          <For each={q().options}>
            {(opt) => (
              <Chip
                selected={(() => (props.getValue() as string) === opt.code)()}
                onClick={() => props.onSetSingle(opt.code)}
              >
                {opt.label}
              </Chip>
            )}
          </For>
        </div>
      </Show>

      <Show when={q().type === 'multi' && q().options}>
        <div class="flex flex-wrap gap-2">
          <For each={q().options}>
            {(opt) => (
              <Chip
                selected={(() => {
                  const v = props.getValue();
                  return Array.isArray(v) && v.includes(opt.code);
                })()}
                onClick={() => props.onToggleMulti(opt.code)}
              >
                {opt.label}
              </Chip>
            )}
          </For>
        </div>
      </Show>

      <Show when={q().type === 'text'}>
        <textarea
          rows={3}
          maxlength={2000}
          class={props.inputClass}
          value={(props.getValue() as string) ?? ''}
          onInput={(e) => props.onSetText(e.currentTarget.value)}
        />
      </Show>
    </div>
  );
}

function SuccessState(props: { email: string; onClose: () => void }) {
  return (
    <div class="px-6 py-10 text-center">
      <div class="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-moss/15 text-moss">
        ✓
      </div>
      <h3 class="font-display text-xl font-semibold text-ink">
        Merci pour vos réponses !
      </h3>
      <p class="mt-2 text-sm text-ink/70">
        Nous avons bien reçu votre questionnaire
        <Show when={props.email}>
          {' '}
          (<span class="font-medium">{props.email}</span>)
        </Show>
        . Nous vous recontacterons rapidement.
      </p>
      <div class="mt-6">
        <Button onClick={props.onClose}>Fermer</Button>
      </div>
    </div>
  );
}
