import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-green text-white hover:bg-brand-green-dark border border-brand-green",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:border-brand-green hover:text-brand-green",
  ghost: "bg-transparent text-slate-600 border border-transparent hover:bg-slate-100",
  danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  const sizing = size === "sm" ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm";
  return (
    <button
      {...props}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-app-pill font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${sizing} ${VARIANTS[variant]} ${className}`}
    />
  );
}
