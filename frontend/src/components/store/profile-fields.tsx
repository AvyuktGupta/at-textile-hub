"use client";

import { useId } from "react";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { BUSINESS_TYPES, INDIAN_STATES, type ProfileErrors, type ProfileForm } from "@/lib/profile-form";

interface ProfileFieldsProps {
  form: ProfileForm;
  errors: ProfileErrors;
  onChange: (field: keyof ProfileForm, value: string) => void;
  /** Leading content for the "Contact" group, e.g. email and password on the register form. */
  contactExtra?: React.ReactNode;
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const headingId = useId();
  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className="grid gap-4 border-t border-line pt-6 first:border-t-0 first:pt-0 sm:grid-cols-[11rem_1fr] sm:gap-8"
    >
      <div>
        <h2 id={headingId} className="font-sans text-sm font-semibold tracking-normal text-ink">
          {title}
        </h2>
        {description && <p className="mt-1 text-[13px] leading-snug text-ink-muted">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function ProfileFields({ form, errors, onChange, contactExtra }: ProfileFieldsProps) {
  const input = (field: keyof ProfileForm) => ({
    id: `profile-${field}`,
    value: form[field],
    "aria-invalid": errors[field] ? true : undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(field, event.target.value),
  });

  return (
    <>
      <FormSection title="Contact" description="Who we should call about orders.">
        {contactExtra}
        <Field label="Full name" htmlFor="profile-name" error={errors.name} required>
          <Input {...input("name")} autoComplete="name" maxLength={120} />
        </Field>
        <Field label="Phone" htmlFor="profile-phone" error={errors.phone} hint="Include the country code for non-Indian numbers." required>
          <Input {...input("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" maxLength={20} />
        </Field>
      </FormSection>

      <FormSection title="Business" description="Shown on your orders and invoices.">
        <Field label="Company name" htmlFor="profile-companyName" error={errors.companyName} className="sm:col-span-2" required>
          <Input {...input("companyName")} autoComplete="organization" maxLength={160} />
        </Field>
        <Field label="Business type" htmlFor="profile-businessType" error={errors.businessType}>
          <Select {...input("businessType")}>
            <option value="">Select…</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </Select>
        </Field>
        <Field label="GSTIN" htmlFor="profile-gstin" error={errors.gstin} hint="Optional, for GST invoices.">
          <Input
            {...input("gstin")}
            className="uppercase placeholder:normal-case"
            placeholder="27ABCDE1234F1Z5"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={15}
          />
        </Field>
      </FormSection>

      <FormSection title="Shipping address" description="Where orders are delivered.">
        <Field label="Address" htmlFor="profile-line1" error={errors.line1} className="sm:col-span-2" required>
          <Input {...input("line1")} autoComplete="address-line1" placeholder="Building, street" maxLength={200} />
        </Field>
        <Field label="Address line 2" htmlFor="profile-line2" error={errors.line2} className="sm:col-span-2">
          <Input {...input("line2")} autoComplete="address-line2" placeholder="Area, landmark (optional)" maxLength={200} />
        </Field>
        <Field label="City" htmlFor="profile-city" error={errors.city} required>
          <Input {...input("city")} autoComplete="address-level2" maxLength={100} />
        </Field>
        <Field label="State" htmlFor="profile-state" error={errors.state} required>
          <Input {...input("state")} autoComplete="address-level1" list="indian-states" maxLength={100} />
          <datalist id="indian-states">
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state} />
            ))}
          </datalist>
        </Field>
        <Field label="PIN code" htmlFor="profile-postalCode" error={errors.postalCode} required>
          <Input {...input("postalCode")} autoComplete="postal-code" inputMode="numeric" maxLength={20} />
        </Field>
        <Field label="Country" htmlFor="profile-country" error={errors.country}>
          <Input {...input("country")} autoComplete="country-name" maxLength={100} />
        </Field>
      </FormSection>
    </>
  );
}
