import React from 'react';
import { ValidationRules } from './validation-rules.type';

/**
* Base interface for all form field components
*/
export interface BaseFieldProps {
	fieldName: string;
	value: string;
	label?: string;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
	labelClassName?: string;
	error?: string;
	id?: string;
	validationRules?: ValidationRules;
	onValidationChange?: (isValid: boolean) => void;
	shouldValidate?: boolean;
}

/**
* Props for InputField component
*/
export interface InputFieldProps extends BaseFieldProps {
	onChange?: (fieldName: string, value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
	onKeyUp?: (fieldName: string, value: string, event: React.KeyboardEvent<HTMLInputElement>) => void;
	onBlur?: (fieldName: string, value: string, event: React.FocusEvent<HTMLInputElement>) => void;
	onInput?: (fieldName: string, value: string, event: React.FormEvent<HTMLInputElement>) => void;
	type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
	inputClassName?: string;
}

/**
* Props for TextAreaField component
*/
export interface TextAreaFieldProps extends BaseFieldProps {
	onChange?: (fieldName: string, value: string, event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onKeyUp?: (fieldName: string, value: string, event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
	onBlur?: (fieldName: string, value: string, event: React.FocusEvent<HTMLTextAreaElement>) => void;
	onInput?: (fieldName: string, value: string, event: React.FormEvent<HTMLTextAreaElement>) => void;
	textAreaClassName?: string;
	rows?: number;
	cols?: number;
	maxLength?: number;
	minLength?: number;
	resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

/**
* Phone input value structure
*/
export interface PhoneInputValues {
	countryCode: string;
	phoneNumber: string;
}

/**
* Props for PhoneInput component
*/
export interface PhoneInputProps extends Omit<BaseFieldProps, 'value'> {
	value: PhoneInputValues;
	onChange?: (fieldName: string, value: PhoneInputValues) => void;
	onBlur?: (fieldName: string, value: PhoneInputValues) => void;
	inputClassName?: string;
}

/**
* Select option structure
*/
export interface SelectOption {
	value: string;
	label: string;
}

/**
* Props for SelectField component
*/
export interface SelectFieldProps extends BaseFieldProps {
	onChange?: (fieldName: string, value: string) => void;
	options: SelectOption[];
	selectClassName?: string;
	selectFirstValue?: boolean;
	searchPlaceholder?: string;
}