"use client";

import * as Select from "@radix-ui/react-select";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import Image from "next/image";
import { forwardRef, type InputHTMLAttributes } from "react";
import { SelectContent, SelectItem } from "@/components/ui/select";
import { fieldBorder, fieldBox } from "./fields";

// "Contact no.*" with a country-code picker inside the field's left edge (the design has a plain
// field; the brief requires country-code handling, assumptions L4). Default +91.

const PREFERRED: CountryCode[] = ["IN", "US", "GB", "AE", "SG", "AU"];
const regionName = new Intl.DisplayNames(["en"], { type: "region" });

interface Country {
  code: CountryCode;
  name: string;
  dial: string;
  flag: string;
}

const toCountry = (code: CountryCode): Country => ({
  code,
  name: regionName.of(code) ?? code,
  dial: getCountryCallingCode(code),
  // Regional-indicator letters render as the flag emoji where supported.
  flag: String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))),
});

const preferred = PREFERRED.map(toCountry);
const others = getCountries()
  .filter((c) => !PREFERRED.includes(c))
  .map(toCountry)
  .sort((a, b) => a.name.localeCompare(b.name));
const byCode = new Map([...preferred, ...others].map((c) => [c.code, c]));

interface PhoneFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  country: CountryCode;
  onCountryChange: (code: CountryCode) => void;
  invalid: boolean;
  errorId: string;
}

export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(function PhoneField(
  { id, country, onCountryChange, invalid, errorId, disabled, ...inputProps },
  ref,
) {
  const selected = byCode.get(country);
  return (
    <div className={`${fieldBox} ${fieldBorder(invalid)} flex items-stretch`}>
      <Select.Root value={country} onValueChange={(v) => onCountryChange(v as CountryCode)} disabled={disabled}>
        <Select.Trigger
          aria-label={`Country code, ${selected?.name ?? country} +${selected?.dial ?? ""}`}
          className="group flex shrink-0 items-center gap-1 rounded-l-field border-r border-field-border pr-2.5 pl-4 text-base text-black outline-none sm:text-field focus-visible:bg-nublue-200"
        >
          <Select.Value>
            <span aria-hidden>{selected?.flag}</span> +{selected?.dial}
          </Select.Value>
          <Select.Icon asChild>
            <Image
              src="/icons/caret-down-field.svg"
              alt=""
              width={16}
              height={16}
              className="transition-transform duration-200 group-data-[state=open]:rotate-180"
            />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <SelectContent>
            {preferred.map((c) => (
              <CountryItem key={c.code} country={c} />
            ))}
            <Select.Separator className="my-1.5 h-px bg-slate-200" />
            {others.map((c) => (
              <CountryItem key={c.code} country={c} />
            ))}
          </SelectContent>
        </Select.Portal>
      </Select.Root>

      <label htmlFor={id} className="sr-only">
        Contact number
      </label>
      <input
        ref={ref}
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="Contact no.*"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        disabled={disabled}
        className="min-w-0 flex-1 rounded-r-field bg-transparent py-3 pr-5 pl-3 tracking-[-0.011em] placeholder:text-ink-body focus:outline-none"
        {...inputProps}
      />
    </div>
  );
});

function CountryItem({ country }: { country: Country }) {
  return (
    <SelectItem value={country.code} textValue={country.name}>
      <span aria-hidden className="mr-2">
        {country.flag}
      </span>
      {country.name} <span className="text-ink-muted">+{country.dial}</span>
    </SelectItem>
  );
}
