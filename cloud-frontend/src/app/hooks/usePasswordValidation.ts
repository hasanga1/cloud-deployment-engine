import { useMemo } from "react";

export interface PasswordCriterion {
  label: string;
  valid: boolean;
}

export function usePasswordValidation(password: string) {
  const criteria = useMemo(() => {
    return [
      { 
        label: "At least 8 characters", 
        valid: /.{8,}/.test(password) 
      },
      { 
        label: "Uppercase letter", 
        valid: /[A-Z]/.test(password) 
      },
      { 
        label: "Number", 
        valid: /[0-9]/.test(password) 
      },
      { 
        label: "Special symbol (!@#$)", 
        valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) 
      },
    ];
  }, [password]);

  const isValid = criteria.every((c) => c.valid);

  return { criteria, isValid };
}