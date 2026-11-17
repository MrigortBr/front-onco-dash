"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";

export const inputClass = (hasError = false) =>
  `w-full rounded-app-sm border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-brand-green disabled:bg-slate-100 disabled:text-slate-500 ${
    hasError ? "border-red-400" : "border-slate-300"
  }`;

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  hint?: ReactNode;
  invalid?: boolean;
}

export function Field({ label, hint, invalid, className = "", ...props }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input {...props} className={`${inputClass(invalid)} ${className}`} />
      {hint && <span className="text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  );
}

export function PasswordField({ label, invalid, ...props }: Omit<FieldProps, "type">) {
  const [show, setShow] = useState(false);
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <span className="relative flex items-center">
        <input {...props} type={show ? "text" : "password"} className={`${inputClass(invalid)} pr-16`} />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 cursor-pointer text-xs font-semibold text-muted transition-colors hover:text-navy"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? "Ocultar" : "Ver"}
        </button>
      </span>
    </label>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-app-sm border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
      {children}
    </p>
  );
}

export function FormSuccess({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-app-sm border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
      {children}
    </p>
  );
}
