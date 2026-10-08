"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProfileFields } from "@/components/store/profile-fields";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { safeNext, withNext } from "@/lib/navigation";
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

type AccountErrors = { email?: string; password?: string };

export function RegisterForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { register, status } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<ProfileForm>(() => toProfileForm());
  const [errors, setErrors] = useState<ProfileErrors & AccountErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (including straight after registering): carry on to wherever they were headed.
  useEffect(() => {
    if (status === "authenticated") router.replace(next ?? "/");
  }, [status, next, router]);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const nextErrors: ProfileErrors & AccountErrors = validateProfile(profile);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Please provide a valid email address";
    if (password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setFormError("Please check the highlighted fields.");
      focusFirstInvalid();
      return;
    }

    setSubmitting(true);
    try {
      await register({ email: email.trim(), password, ...toProfilePayload(profile) });
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError) {
        setErrors({
          ...mapApiProfileErrors(err.details),
          email: err.details?.email,
          password: err.details?.password,
        });
        setFormError(err.message);
        focusFirstInvalid();
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-6">
      <ProfileFields
        form={profile}
        errors={errors}
        onChange={updateField}
        contactExtra={
          <>
            <Field label="Work email" htmlFor="register-email" error={errors.email} required>
              <Input
                id="register-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                aria-invalid={errors.email ? true : undefined}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((current) => ({ ...current, email: undefined }));
                }}
              />
            </Field>
            <Field
              label="Password"
              htmlFor="register-password"
              error={errors.password}
              hint="At least 8 characters."
              required
            >
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                value={password}
                aria-invalid={errors.password ? true : undefined}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({ ...current, password: undefined }));
                }}
              />
            </Field>
          </>
        }
      />

      {formError && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      )}

      <div className="flex flex-col-reverse items-center gap-4 border-t border-line pt-6 sm:flex-row sm:justify-between">
        <p className="text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href={withNext("/login", next)} className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
        <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
          Create account
        </Button>
      </div>
    </form>
  );
}
