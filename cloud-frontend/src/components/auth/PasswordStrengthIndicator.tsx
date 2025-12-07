import React from "react";
import { Check } from "lucide-react";
import { PasswordCriterion } from "@/app/hooks/usePasswordValidation";

interface Props {
  criteria: PasswordCriterion[];
}

export const PasswordStrengthIndicator = ({ criteria }: Props) => {
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {criteria.map((item, index) => (
        <div
          key={index}
          className={`text-xs flex items-center gap-1.5 transition-colors duration-200 ${
            item.valid ? "text-green-600 font-medium" : "text-slate-400"
          }`}
        >
          {item.valid ? (
            <Check size={12} strokeWidth={3} />
          ) : (
            <div className="w-3 h-3 rounded-full border border-slate-300" />
          )}
          {item.label}
        </div>
      ))}
    </div>
  );
};