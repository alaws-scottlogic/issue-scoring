import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "danger";
  className?: string;
}

export const Button = ({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
}: ButtonProps) => {
  const baseStyle =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    secondary:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:bg-slate-50",
    outline: "border border-slate-300 text-slate-600 hover:bg-slate-50",
    danger:
      "bg-red-50 text-red-600 hover:bg-red-100 disabled:bg-slate-50 disabled:text-slate-400",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};