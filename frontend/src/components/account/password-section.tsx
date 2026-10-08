"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";

type Errors = { currentPassword?: string; newPassword?: string; confirm?: string };

export function PasswordSection({ email }: { email: string }) {
  const { changePassword } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Errors = {};
    if (!values.currentPassword) nextErrors.currentPassword = "Enter your current password";
    if (values.newPassword.length < 8) nextErrors.newPassword = "Password must be at least 8 characters";
    else if (values.newPassword === values.currentPassword) nextErrors.newPassword = "Choose a different password";
    if (values.confirm !== values.newPassword) nextErrors.confirm = "Passwords don't match";
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);

    setSaving(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      setValues({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed. Other devices have been signed out.");
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      else toast.error(err instanceof ApiError ? err.message : "Couldn't change your password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Password" description="Changing it signs you out everywhere else.">
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-3 sm:items-start">
        {/* Lets password managers associate the new password with this account. */}
        <input type="text" name="username" autoComplete="username" value={email} hidden readOnly />
        <Field label="Current password" htmlFor="current-password" error={errors.currentPassword}>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={set("currentPassword")}
            aria-invalid={errors.currentPassword ? true : undefined}
          />
        </Field>
        <Field label="New password" htmlFor="new-password" error={errors.newPassword} hint="At least 8 characters.">
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={values.newPassword}
            onChange={set("newPassword")}
            aria-invalid={errors.newPassword ? true : undefined}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm-password" error={errors.confirm}>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={values.confirm}
            onChange={set("confirm")}
            aria-invalid={errors.confirm ? true : undefined}
          />
        </Field>
        <div className="flex justify-end sm:col-span-3">
          <Button type="submit" variant="secondary" loading={saving}>
            Change password
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
