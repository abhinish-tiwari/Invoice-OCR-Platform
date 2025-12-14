import React, { useEffect } from 'react';
import { useFieldValidation } from '../hooks/useFieldValidation';
import { TextAreaFieldProps } from '../types/fields.type';
import { getValidationRules } from '../utils/get-validations-rules';


export const TextAreaField: React.FC<TextAreaFieldProps> = ({
	fieldName,
	value,
	onChange,
	onKeyUp,
	onBlur,
	onInput,
	placeholder,
	label,
	required = false,
	disabled = false,
	className = '',
	textAreaClassName = '',
	labelClassName = '',
	error,
	id,
	rows = 4,
	cols,
	maxLength,
	minLength,
	resize = 'vertical',
	validationRules,
	onValidationChange,
	shouldValidate = false
}) => {
	const textAreaId = id || fieldName;
	const finalValidationRules = getValidationRules({ isRequired: required, minLength, maxLength, validationRules });
	const hasValidation = Object.keys(finalValidationRules).length > 0;
	const { errors, isTouched, validateField } = useFieldValidation(finalValidationRules || {});

	const displayError = ((isTouched || shouldValidate) && errors.length > 0 ? errors[0] : error);

	useEffect(() => {
		if (hasValidation) {
			validateField(value, false);
		}
	}, []);

	useEffect(() => {
		if (hasValidation && onValidationChange) {
			onValidationChange(errors.length === 0);
		}
	}, [errors, hasValidation, onValidationChange]);

	useEffect(() => {
		if (shouldValidate && hasValidation) {
			validateField(value, true);
		}
	}, [shouldValidate]);

	const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = event.target.value;
		if (hasValidation) {
			validateField(newValue, false);
		}

		if (onChange) {
			onChange(fieldName, newValue, event);
		}
	};

	const handleKeyUp = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		const newValue = event.currentTarget.value;
		if (onKeyUp) {
			onKeyUp(fieldName, newValue, event);
		}
	};

	const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
		const newValue = event.target.value;

		if (hasValidation) {
			validateField(newValue, true);
		}

		if (onBlur) {
			onBlur(fieldName, newValue, event);
		}
	};

	const handleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
		const newValue = event.currentTarget.value;
		if (onInput) {
			onInput(fieldName, newValue, event);
		}
	};

	const resizeClass = {
		none: 'resize-none',
		both: 'resize',
		horizontal: 'resize-x',
		vertical: 'resize-y',
	}[resize];

	const baseTextAreaClasses = `mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${displayError ? 'border-red-500' : 'border-gray-300'
		} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${resizeClass}`;

	return (
		<div className={className}>
			{label && (
				<label htmlFor={textAreaId}
					className={`block text-sm font-medium text-gray-700 ${labelClassName}`}>
					{label}
					{required && <span className="text-red-500 ml-1">*</span>}
				</label>
			)}
			<textarea id={textAreaId}
				name={fieldName}
				value={value}
				onChange={handleChange}
				onKeyUp={handleKeyUp}
				onBlur={handleBlur}
				onInput={handleInput}
				placeholder={placeholder}
				required={required}
				disabled={disabled}
				rows={rows}
				cols={cols}
				maxLength={maxLength}
				minLength={minLength}
				className={`${baseTextAreaClasses} ${textAreaClassName}`} />
			{displayError && (
				<p className="mt-1 text-sm text-red-600">
					{displayError}
				</p>
			)}
		</div>
	);
};
