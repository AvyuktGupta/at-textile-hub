"use client";

import { useState } from "react";
import { ProfileFields } from "@/components/store/profile-fields";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import {
  focusFirstInvalid,
  mapApiProfileErrors,
  toProfileForm,
  toProfilePayload,
  validateProfile,
  type ProfileErrors,
  type ProfileForm,
} from "@/lib/profile-form";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import type { User } from "@/types";

export function ProfileSection({ user }: { user: User }) {
  const { updateProfile } = useAuth();
  const toast = useToast();
  // Edits are kept relative to the user they started from; a newer user (e.g. after saving) resets the form.
  const [draft, setDraft] = useState<{ base: User; form: ProfileForm } | null>(null);
  const form = draft?.base === user ? draft.form : toProfileForm(user);
  const dirty = draft?.base === user;
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setDraft({ base: user, form: { ...form, [field]: value } });
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateProfile(form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstInvalid();
      return;
    }
    setSaving(true);
    try {
      await updateProfile(toProfilePayload(form));
      setDraft(null);
      setErrors({});
      toast.success("Your details have been saved");
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(mapApiProfileErrors(err.details));
        focusFirstInvalid();
      }
      toast.error(err instanceof ApiError ? err.message : "Couldn't save your details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Business details" description={`Signed in as ${user.email}. Used on every order you submit.`}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <ProfileFields form={form} errors={errors} onChange={updateField} />
        <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
          {dirty && (
            <Button
              variant="ghost"
              onClick={() => {
                setDraft(null);
                setErrors({});
              }}
            >
              Discard changes
            </Button>
          )}
          <Button type="submit" loading={saving} disabled={!dirty}>
            Save details
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
