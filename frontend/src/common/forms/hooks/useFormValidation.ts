import { useState } from 'react';
import { ValidationRules } from '../types/validation-rules.type';
import { checkFieldValidation } from '../utils/check-field-validation';

export type FieldsValidations = Record<string, ValidationRules>;
export type FieldErrors = Record<string, string[]>;
export type TouchedFields = Record<string, boolean>;

export const useFormValidation = (validations: FieldsValidations) => {
	const [errors, setErrors] = useState<FieldErrors>({});
	const [touched, setTouched] = useState<TouchedFields>({});

	const validateField = (field: string, value: any, markTouched = false): boolean => {
		const schema = validations[field];
		if (!schema) return true;

		if (markTouched) {
			setTouched((prev) => ({ ...prev, [field]: true }));
		}

		const newErrors = checkFieldValidation(schema, value);
		setErrors((prev) => ({ ...prev, [field]: newErrors }));

		return newErrors.length === 0;
	};

	const validateForm = (formData: Record<string, any>): boolean => {
		let isValid = true;
		const newErrors: FieldErrors = {};
		const newTouched: TouchedFields = {};

		for (const field in validations) {
			const value = formData[field];
			const schema = validations[field];
			const fieldErrors = checkFieldValidation(schema, value);

			if (fieldErrors.length > 0) {
				isValid = false;
			}

			newErrors[field] = fieldErrors;
			newTouched[field] = true;
		}

		setErrors(newErrors);
		setTouched(newTouched);
		return isValid;
	};

	return {
		errors,
		touched,
		validateField,
		validateForm,
	};
};
