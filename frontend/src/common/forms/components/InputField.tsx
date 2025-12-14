import React, { useEffect } from "react";
import { useFieldValidation } from "../hooks/useFieldValidation";
import { InputFieldProps } from "../types/fields.type";
import { getValidationRules } from "../utils/get-validations-rules";

export const InputField: React.FC<InputFieldProps> = ({
	fieldName,
	value,
	onChange,
	onKeyUp,
	onBlur,
	onInput,
	type = "text",
	placeholder = "Type here",
	label,
	required = false,
	disabled = false,
	className = "",
	inputClassName = "",
	labelClassName = "",
	error,
	id,
	validationRules,
	onValidationChange,
	shouldValidate = false,
}) => {
	const inputId = id || fieldName;
	const finalValidationRules = getValidationRules({
		isRequired: required,
		validationRules,
	});
	const hasValidation = Object.keys(finalValidationRules).length > 0;
	const { errors, isTouched, validateField } = useFieldValidation(
		finalValidationRules || {}
	);

	const displayError =
		(isTouched || shouldValidate) && errors.length > 0 ? errors[0] : error;

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

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.value;
		if (hasValidation) {
			validateField(newValue, false);
		}

		if (onChange) {
			onChange(fieldName, newValue, event);
		}
	};

	const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
		const newValue = event.currentTarget.value;
		if (onKeyUp) {
			onKeyUp(fieldName, newValue, event);
		}
	};

	const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
		const newValue = event.target.value;

		if (hasValidation) {
			validateField(newValue, true);
		}

		if (onBlur) {
			onBlur(fieldName, newValue, event);
		}
	};

	const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
		const newValue = event.currentTarget.value;
		if (onInput) {
			onInput(fieldName, newValue, event);
		}
	};

	const baseInputClasses = `mt-1 block w-full px-3 py-2 text-sm border rounded-lg shadow-sm
		transition-all duration-200
		focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
		${displayError
			? "border-red-400 bg-red-50 focus:ring-red-500"
			: "border-gray-300 bg-white hover:border-gray-400"
		}
		${disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}
		placeholder:text-gray-400`;

	return (
		<div className={className}>

			{label && (
				<label
					htmlFor={inputId}
					className={`block text-xs font-semibold text-gray-700 mb-0.5 ${labelClassName}`}
				>
					{label}
					{required && <span className="text-red-500 ml-1">*</span>}
				</label>
			)}

			<input
				id={inputId}
				name={fieldName}
				type={type}
				value={value}
				onChange={handleChange}
				onKeyUp={handleKeyUp}
				onBlur={handleBlur}
				onInput={handleInput}
				placeholder={placeholder}
				required={required}
				disabled={disabled}
				className={`${baseInputClasses} ${inputClassName}`}
			/>

			{displayError && (
				<p className="mt-1 text-xs text-red-600 flex items-center gap-1">
					<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
					</svg>
					{displayError}
				</p>
			)}
		</div>
	);
};
