import { useState } from "react";
import { ValidationRules } from "../types/validation-rules.type";
import { checkFieldValidation } from "../utils/check-field-validation";


export const useFieldValidation = (fieldValidations: ValidationRules) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isTouched, setTouched] = useState<boolean>(false);

  const validateField = (value: any, markTouched = false): boolean => {
    if (!fieldValidations) return true;

    if (markTouched) {
      setTouched(() => true);
    }

    const newErrors = checkFieldValidation(fieldValidations, value) || [];
    setErrors(newErrors);

    return newErrors?.length === 0;
  };

  return { errors, isTouched, validateField };
};
