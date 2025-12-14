import { useState, useCallback, useMemo, useEffect, useRef } from "react";

interface UseFormSectionOptions<T> {
  initialData?: Partial<T>;
  fields: (keyof T)[];
  requiredFields?: (keyof T)[]; // Fields that have validation (required or rules)
}

interface UseFormSectionReturn<T> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  fieldValidationState: Record<string, boolean>;
  shouldValidate: boolean;
  handleChange: (fieldName: string, value: any) => void;
  handleValidationChange: (fieldName: string) => (isValid: boolean) => void;
  isAllFieldsValid: () => boolean;
  setShouldValidate: (value: boolean) => void;
  resetForm: () => void;
}

export function useFormSection<T extends Record<string, any>>({
  initialData,
  fields,
  requiredFields = [],
}: UseFormSectionOptions<T>): UseFormSectionReturn<T> {
  // Memoize initial form data to avoid recalculation on every render
  const initialFormData = useMemo((): T => {
    const data: any = {};
    fields.forEach((field) => {
      data[field] = initialData?.[field] ?? "";
    });
    return data as T;
  }, [fields, initialData]); // Memoize initial validation state - initialize required fields as false (invalid)

  const initialValidationState = useMemo((): Record<string, boolean> => {
    const state: Record<string, boolean> = {};
    requiredFields.forEach((field) => {
      state[field as string] = false;
    });
    return state;
  }, [requiredFields]); // State management

  const [formData, setFormData] = useState<T>(initialFormData); // Track validation state for fields that have validation
  const [fieldValidationState, setFieldValidationState] = useState<
    Record<string, boolean>
  >(initialValidationState);
  const [shouldValidate, setShouldValidate] = useState(false);
  const prevInitialDataRef = useRef<Partial<T> | undefined>(initialData);

  useEffect(() => {
    if (prevInitialDataRef.current !== initialData) {
      prevInitialDataRef.current = initialData;
      setFormData(initialFormData);
      setFieldValidationState(initialValidationState);
      setShouldValidate(false);
    }
  }, [initialData, initialFormData, initialValidationState]); // Handle field value changes

  const handleChange = useCallback((fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []); // Handle validation state changes from InputField components
  // Only fields with validation (required=true or validationRules) will call this

  const handleValidationChange = useCallback(
    (fieldName: string) => (isValid: boolean) => {
      setFieldValidationState((prev) => {
        // Only update if the validation state actually changed
        if (prev[fieldName] === isValid) {
          return prev;
        }
        return {
          ...prev,
          [fieldName]: isValid,
        };
      });
    },
    []
  ); // Check if all fields with validation are valid

  const isAllFieldsValid = useCallback((): boolean => {
    const validationStates = Object.values(fieldValidationState); // If no fields have validation, consider form valid
    if (validationStates.length === 0) {
      return true;
    }
    return validationStates.every((isValid) => isValid);
  }, [fieldValidationState]); // Reset form to initial state

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setFieldValidationState(initialValidationState);
    setShouldValidate(false);
  }, [initialFormData, initialValidationState]);

  return {
    formData,
    setFormData,
    fieldValidationState,
    shouldValidate,
    handleChange,
    handleValidationChange,
    isAllFieldsValid,
    setShouldValidate,
    resetForm,
  };
}
