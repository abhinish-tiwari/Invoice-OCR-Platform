export type ValidationRule = {
	value?: any;
	message: string;
};

export type CustomValidationRule = {
	validate: (value: any) => boolean | { isValid: boolean; message?: string };
	message?: string;
};

export type ValidationRules = {
	required?: ValidationRule;
	pattern?: ValidationRule;
	minLength?: ValidationRule;
	maxLength?: ValidationRule;
	custom?: CustomValidationRule;
	min?: ValidationRule;
	max?: ValidationRule;
};