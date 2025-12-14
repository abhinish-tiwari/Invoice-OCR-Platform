import { ValidationRules } from '../types/validation-rules.type';

export function getValidationRules(options: {
	isRequired?: boolean;
	minLength?: number;
	maxLength?: number;
	validationRules?: ValidationRules;
}): ValidationRules {
	const { isRequired, minLength, maxLength, validationRules } = options;
	const finalValidationRules: ValidationRules = { ...validationRules };

	if (isRequired && !validationRules?.required) {
		finalValidationRules['required'] = { message: 'This field is required' };
	}

	if (minLength && !validationRules?.minLength) {
		finalValidationRules['minLength'] = { value: minLength, message: `Should be minimum ${minLength} characters.` };
	}

	if (maxLength && !validationRules?.maxLength) {
		finalValidationRules['maxLength'] = { value: maxLength, message: `Should be maximum ${maxLength} characters.` };
	}

	return finalValidationRules;
}