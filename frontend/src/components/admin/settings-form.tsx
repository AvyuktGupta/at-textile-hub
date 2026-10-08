"use client";

import { useEffect, useId, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Mail, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/admin-shell";
import { ImageManager } from "@/components/admin/image-manager";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { MediaImage } from "@/components/ui/media-image";
import { Switch } from "@/components/ui/switch";
import { adminApi, type ScrollInput, type SettingsInput, type TagCount } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { formatTag, normalizeTag } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import type { SiteSettings } from "@/types";

const MAX_SECTIONS = 12;

type ScrollDraft = ScrollInput & { key: string };
type FormState = Omit<SettingsInput, "homepageScrolls"> & { homepageScrolls: ScrollDraft[] };

let draftCounter = 0;
const newKey = () => `draft-${++draftCounter}`;

function toFormState(settings: SiteSettings): FormState {
  return {
    headerImageUrl: settings.headerImageUrl,
    headerTitle: settings.headerTitle,
    headerSubtitle: settings.headerSubtitle,
    orderDestinationEmail: settings.orderDestinationEmail,
    homepageScrolls: [...settings.homepageScrolls]
      .sort((a, b) => a.order - b.order)
      .map(({ _id, title, filterTag, limit, isActive }) => ({ key: _id, _id, title, filterTag, limit, isActive })),
  };
}

export function SettingsForm() {
  const { token } = useAuth();
  const toast = useToast();
  const tagListId = useId();

  const [form, setForm] = useState<FormState | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const [tags, setTags] = useState<TagCount[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) return;
    Promise.all([adminApi.getSettings(token), adminApi.listTags(token)])
      .then(([settingsRes, tagsRes]) => {
        const state = toFormState(settingsRes.data);
        setForm(state);
        setSavedSnapshot(JSON.stringify(state));
        setTags(tagsRes.data);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load settings"));
  }, [token]);

  const dirty = form !== null && JSON.stringify(form) !== savedSnapshot;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (loadError) {
    return (
      <>
        <PageHeader title="Site settings" />
        <p className="text-ink-muted">{loadError}</p>
      </>
    );
  }

  if (!form) return <SettingsSkeleton />;

  const update = (patch: Partial<FormState>) => setForm((current) => (current ? { ...current, ...patch } : current));

  const updateScroll = (index: number, patch: Partial<ScrollDraft>) => {
    const key = form.homepageScrolls[index].key;
    update({
      homepageScrolls: form.homepageScrolls.map((scroll, i) => (i === index ? { ...scroll, ...patch } : scroll)),
    });
    const stale = Object.keys(patch).map((field) => `${key}.${field}`).filter((errorKey) => errors[errorKey]);
    if (stale.length) {
      setErrors((current) => Object.fromEntries(Object.entries(current).filter(([k]) => !stale.includes(k))));
    }
  };

  const moveScroll = (index: number, delta: number) => {
    const next = [...form.homepageScrolls];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    update({ homepageScrolls: next });
  };

  const addScroll = () =>
    update({
      homepageScrolls: [...form.homepageScrolls, { key: newKey(), title: "", filterTag: "", limit: 12, isActive: true }],
    });

  const tagCount = (tag: string) => tags.find((t) => t.tag === normalizeTag(tag))?.count ?? 0;

  function validate(state: FormState) {
    const next: Record<string, string> = {};
    if (state.orderDestinationEmail && !/^\S+@\S+\.\S+$/.test(state.orderDestinationEmail)) {
      next.orderDestinationEmail = "Enter a valid email address";
    }
    if (!state.orderDestinationEmail) next.orderDestinationEmail = "Orders can't be delivered without this address";
    state.homepageScrolls.forEach((scroll) => {
      if (!scroll.title.trim()) next[`${scroll.key}.title`] = "Section title is required";
      if (!normalizeTag(scroll.filterTag)) next[`${scroll.key}.filterTag`] = "Pick a tag";
    });
    return next;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !form) return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const res = await adminApi.updateSettings(token, {
        headerImageUrl: form.headerImageUrl.trim(),
        headerTitle: form.headerTitle.trim(),
        headerSubtitle: form.headerSubtitle.trim(),
        orderDestinationEmail: form.orderDestinationEmail.trim(),
        homepageScrolls: form.homepageScrolls.map(({ _id, title, filterTag, limit, isActive }) => ({
          _id,
          title: title.trim(),
          filterTag: normalizeTag(filterTag),
          limit,
          isActive,
        })),
      });
      const state = toFormState(res.data);
      setForm(state);
      setSavedSnapshot(JSON.stringify(state));
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-24 lg:pb-0">
      <PageHeader
        title="Site settings"
        description="Control the homepage banner, product sections and where orders are sent."
        actions={
          <div className="hidden items-center gap-3 lg:flex">
            {dirty && <span className="text-sm text-ink-muted">Unsaved changes</span>}
            <Button type="submit" loading={saving} disabled={!dirty}>
              Save settings
            </Button>
          </div>
        }
      />

      <div className="flex max-w-4xl flex-col gap-5">
        <SectionCard title="Homepage banner" description="The hero shown at the top of the storefront.">
          <div className="flex flex-col gap-5">
            <div className="relative overflow-hidden rounded-xl border border-line bg-sunken">
              <MediaImage src={form.headerImageUrl} alt="Banner preview" className="aspect-[16/9] w-full sm:aspect-[21/8]" />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/70 via-ink/20 to-transparent p-4 sm:p-6">
                <p className="font-display text-xl leading-tight text-white sm:text-3xl">
                  {form.headerTitle || "Banner title"}
                </p>
                {form.headerSubtitle && (
                  <p className="mt-1 line-clamp-2 max-w-lg text-[13px] text-white/85 sm:text-sm">{form.headerSubtitle}</p>
                )}
              </div>
              <span className="absolute top-3 right-3 rounded-md bg-surface/90 px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                Preview
              </span>
            </div>

            <ImageManager
              single
              value={form.headerImageUrl ? [{ url: form.headerImageUrl }] : []}
              onChange={(images) => update({ headerImageUrl: images[0]?.url ?? "" })}
            />

            <Field label="Headline" htmlFor="headerTitle">
              <Input
                id="headerTitle"
                value={form.headerTitle}
                onChange={(event) => update({ headerTitle: event.target.value })}
                maxLength={120}
              />
            </Field>
            <Field label="Supporting text" htmlFor="headerSubtitle">
              <Textarea
                id="headerSubtitle"
                value={form.headerSubtitle}
                onChange={(event) => update({ headerSubtitle: event.target.value })}
                rows={2}
                maxLength={240}
                className="min-h-20"
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title="Homepage sections"
          description="Horizontal product rows shown below the banner, in this order. Each row shows products with its tag."
          action={
            <span className="text-[13px] text-ink-muted tabular-nums">
              {form.homepageScrolls.length}/{MAX_SECTIONS}
            </span>
          }
        >
          <datalist id={tagListId}>
            {tags.map((t) => (
              <option key={t.tag} value={t.tag}>
                {formatTag(t.tag)} ({t.count})
              </option>
            ))}
          </datalist>

          {form.homepageScrolls.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-strong bg-canvas px-4 py-8 text-center text-sm text-ink-muted">
              No sections yet. The homepage will only show the banner and recently viewed products.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {form.homepageScrolls.map((scroll, index) => {
                const count = tagCount(scroll.filterTag);
                const titleError = errors[`${scroll.key}.title`];
                const tagError = errors[`${scroll.key}.filterTag`];
                return (
                  <li
                    key={scroll.key}
                    className={cn(
                      "rounded-xl border bg-surface p-3 sm:p-4",
                      scroll.isActive ? "border-line" : "border-dashed border-line-strong bg-canvas"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="flex size-7 items-center justify-center rounded-md bg-sunken text-xs font-semibold text-ink-muted tabular-nums">
                          {index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9"
                          disabled={index === 0}
                          onClick={() => moveScroll(index, -1)}
                          aria-label={`Move ${scroll.title || "section"} up`}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9"
                          disabled={index === form.homepageScrolls.length - 1}
                          onClick={() => moveScroll(index, 1)}
                          aria-label={`Move ${scroll.title || "section"} down`}
                        >
                          <ArrowDown />
                        </Button>
                      </div>

                      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                        <Field label="Section title" htmlFor={`${scroll.key}-title`} error={titleError}>
                          <Input
                            id={`${scroll.key}-title`}
                            value={scroll.title}
                            onChange={(event) => updateScroll(index, { title: event.target.value })}
                            placeholder="Most Popular"
                            aria-invalid={Boolean(titleError)}
                            maxLength={80}
                          />
                        </Field>
                        <Field
                          label="Products tagged"
                          htmlFor={`${scroll.key}-tag`}
                          error={tagError}
                          hint={
                            scroll.filterTag ? (
                              count > 0 ? (
                                `${count} product${count === 1 ? "" : "s"} tagged`
                              ) : (
                                <span className="inline-flex items-center gap-1 text-warning">
                                  <AlertTriangle className="size-3.5" aria-hidden /> No products have this tag yet
                                </span>
                              )
                            ) : undefined
                          }
                        >
                          <Input
                            id={`${scroll.key}-tag`}
                            list={tagListId}
                            value={scroll.filterTag}
                            onChange={(event) => updateScroll(index, { filterTag: event.target.value })}
                            onBlur={(event) => updateScroll(index, { filterTag: normalizeTag(event.target.value) })}
                            placeholder="popular"
                            aria-invalid={Boolean(tagError)}
                            autoCapitalize="none"
                          />
                        </Field>

                        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                          <div className="flex items-center gap-4">
                            <Switch
                              id={`${scroll.key}-active`}
                              checked={scroll.isActive}
                              onCheckedChange={(isActive) => updateScroll(index, { isActive })}
                              label={scroll.isActive ? "Visible" : "Hidden"}
                            />
                            <label className="flex items-center gap-2 text-sm text-ink-muted">
                              Show up to
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={48}
                                value={scroll.limit}
                                onChange={(event) =>
                                  updateScroll(index, {
                                    limit: Math.min(Math.max(Number(event.target.value) || 1, 1), 48),
                                  })
                                }
                                className="h-9 w-16 px-2 text-center tabular-nums"
                              />
                            </label>
                          </div>
                          <Button
                            variant="danger-ghost"
                            size="sm"
                            onClick={() =>
                              update({ homepageScrolls: form.homepageScrolls.filter((_, i) => i !== index) })
                            }
                          >
                            <Trash2 /> Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <Button
            variant="secondary"
            className="mt-4 w-full sm:w-auto"
            onClick={addScroll}
            disabled={form.homepageScrolls.length >= MAX_SECTIONS}
          >
            <Plus /> Add section
          </Button>
        </SectionCard>

        <SectionCard title="Order notifications" description="Every submitted order is emailed here with full buyer and cart details.">
          <Field
            label="Send orders to"
            htmlFor="orderDestinationEmail"
            required
            error={errors.orderDestinationEmail}
            hint="Buyers also receive their own confirmation copy."
          >
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
              <Input
                id="orderDestinationEmail"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.orderDestinationEmail}
                onChange={(event) => {
                  update({ orderDestinationEmail: event.target.value });
                  setErrors((current) => ({ ...current, orderDestinationEmail: "" }));
                }}
                placeholder="orders@yourcompany.com"
                aria-invalid={Boolean(errors.orderDestinationEmail)}
                className="pl-9"
              />
            </div>
          </Field>
        </SectionCard>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        {dirty && <span className="text-sm text-ink-muted">Unsaved</span>}
        <Button type="submit" loading={saving} disabled={!dirty} className="flex-1">
          Save settings
        </Button>
      </div>
    </form>
  );
}

function SettingsSkeleton() {
  return (
    <div aria-busy="true" className="flex max-w-4xl flex-col gap-5">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-sunken" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-56 animate-pulse rounded-card border border-line bg-surface" />
      ))}
    </div>
  );
}
