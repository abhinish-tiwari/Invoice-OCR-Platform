import { ValidationRules } from "../types/validation-rules.type";

export function checkFieldValidation(validation: ValidationRules, value: any): string[] {
	const newErrors: string[] = [];

	if (validation.required && (!value || value?.toString().trim() === '')) {
		newErrors.push(validation.required.message);
	}

	if (validation.pattern && value && !validation.pattern.value?.test(value)) {
		newErrors.push(validation.pattern.message);
	}

	if (validation.minLength && value && value?.length < validation.minLength.value) {
		newErrors.push(validation.minLength.message);
	}

	if (validation.maxLength && value && value?.length > validation.maxLength.value) {
		newErrors.push(validation.maxLength.message);
	}

	if (validation.custom && value) {
		const validationResult = validation.custom.validate(value);
		if (typeof validationResult === 'boolean') {
			if (!validationResult) {
				newErrors.push(validation.custom.message || '');
			}
		} else {
			if (!validationResult.isValid) {
				newErrors.push(validationResult.message || validation.custom.message || '');
			}
		}
	}

	return newErrors;
}