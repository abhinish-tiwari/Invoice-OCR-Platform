import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useFieldValidation } from "../hooks/useFieldValidation";
import { SelectFieldProps } from "../types/fields.type";
import { getValidationRules } from "../utils/get-validations-rules";
import SvgIcon from "@/common/components/SvgIcon";

export const SelectField: React.FC<SelectFieldProps> = ({
	fieldName,
	value,
	label,
	placeholder = "-Select-",
	required = false,
	disabled = false,
	className = "",
	selectClassName = "",
	labelClassName = "",
	error,
	id,
	validationRules,
	onChange,
	onValidationChange,
	shouldValidate = false,
	options = [],
	selectFirstValue = false,
	searchPlaceholder = "Search...",
}) => {
	// ==================== State ====================
	const [searchTerm, setSearchTerm] = useState("");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [dropdownPosition, setDropdownPosition] = useState<{
		top: number;
		left: number;
		width: number;
		openAbove: boolean;
	} | null>(null);

	// ==================== Refs ====================
	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const selectedItemRef = useRef<HTMLLIElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// ==================== Validation ====================
	const selectId = id || fieldName;
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

	// ==================== Computed Values ====================
	const optionsWithBlank = !(required || validationRules?.required)
		? [{ value: "", label: placeholder || "-Select-" }, ...options]
		: options;

	const filteredOptions = searchTerm
		? optionsWithBlank.filter((option) =>
			option.label.toLowerCase().includes(searchTerm.toLowerCase())
		)
		: optionsWithBlank;

	const selectedOption = optionsWithBlank.find(
		(option) => option.value === value
	);
	const showSearch = options.length > 3;
	const maxHeightClass = options.length > 6 ? "max-h-64" : "";

	// ==================== Effects: Validation ====================

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

	useEffect(() => {
		if (selectFirstValue && !value && options.length > 0 && onChange) {
			onChange(fieldName, options[0].value);
		}
	}, [selectFirstValue, value, options, onChange, fieldName]);

	// ==================== Effects: Dropdown Position ====================

	useEffect(() => {
		if (!isDropdownOpen || !containerRef.current) {
			setDropdownPosition(null);
			return;
		}

		const calculatePosition = () => {
			if (!containerRef.current) return;

			const containerRect = containerRef.current.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			const viewportWidth = window.innerWidth;
			const dropdownHeight = dropdownRef.current?.offsetHeight || 320;
			const spaceBelow = viewportHeight - containerRect.bottom;
			const spaceAbove = containerRect.top;
			const shouldOpenAbove =
				spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
			const scrollTop =
				window.pageYOffset ||
				document.documentElement.scrollTop ||
				document.body.scrollTop ||
				0;
			const scrollLeft =
				window.pageXOffset ||
				document.documentElement.scrollLeft ||
				document.body.scrollLeft ||
				0;

			let top = shouldOpenAbove
				? containerRect.top + scrollTop - dropdownHeight - 4
				: containerRect.bottom + scrollTop + 4;

			const padding = 8;
			const minTop = scrollTop + padding;
			const maxTop = scrollTop + viewportHeight - dropdownHeight - padding;
			if (top < minTop) top = minTop;
			if (top > maxTop) top = maxTop;

			let left = containerRect.left + scrollLeft;
			let width = containerRect.width;

			const horizontalPadding = 12;
			const maxWidth = viewportWidth - horizontalPadding * 2;
			if (width > maxWidth) {
				width = maxWidth;
				left = horizontalPadding + scrollLeft;
			} else {
				if (left + width > viewportWidth - horizontalPadding + scrollLeft) {
					left = viewportWidth - width - horizontalPadding + scrollLeft;
				}
				if (left < horizontalPadding + scrollLeft) {
					left = horizontalPadding + scrollLeft;
				}
			}

			setDropdownPosition({
				top,
				left,
				width,
				openAbove: shouldOpenAbove,
			});
		};

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				calculatePosition();
			});
		});

		window.addEventListener("scroll", calculatePosition, true);
		window.addEventListener("resize", calculatePosition);

		return () => {
			window.removeEventListener("scroll", calculatePosition, true);
			window.removeEventListener("resize", calculatePosition);
		};
	}, [isDropdownOpen, options.length, filteredOptions.length]);

	// ==================== Effects: Auto-scroll & Focus ====================

	useEffect(() => {
		if (isDropdownOpen && selectedItemRef.current && dropdownRef.current) {
			selectedItemRef.current.scrollIntoView({
				behavior: "auto",
				block: "center",
			});
		}
	}, [isDropdownOpen]);

	useEffect(() => {
		if (isDropdownOpen && showSearch && dropdownPosition) {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					if (searchInputRef.current) {
						searchInputRef.current.focus();
					}
				});
			});
		}
	}, [isDropdownOpen, showSearch, dropdownPosition]);

	// ==================== Effects: Click Outside ====================

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node) &&
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
				setSearchTerm("");
				if (hasValidation) {
					validateField(value, true);
				}
			}
		};

		if (isDropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isDropdownOpen, hasValidation, value]);

	// ==================== Event Handlers ====================
	const handleToggleDropdown = () => {
		if (!disabled) {
			if (isDropdownOpen && hasValidation) {
				validateField(value, true);
			}
			setIsDropdownOpen(!isDropdownOpen);
			setSearchTerm("");
		}
	};

	const handleSelectChange = (selectedValue: string) => {
		setIsDropdownOpen(false);
		setSearchTerm("");

		if (hasValidation) {
			validateField(selectedValue, false);
		}

		if (onChange) {
			onChange(fieldName, selectedValue);
		}
	};

	// ==================== Render Helpers ====================
	const renderLabel = () => {
		if (!label) return null;
		return (
			<label
				htmlFor={selectId}
				className={`block text-sm font-medium text-gray-700 ${labelClassName}`}
			>
				{label}
				{required && <span className="text-red-500 ml-1">*</span>}
			</label>
		);
	};

	const renderSelectButton = () => (
		<button
			type="button"
			id={selectId}
			disabled={disabled}
			className={`mt-1 w-full h-[42px] flex items-center justify-between px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${displayError ? "border-red-500" : "border-gray-300"
				} ${disabled ? "bg-gray-100 cursor-not-allowed opacity-50" : "hover:bg-gray-50 cursor-pointer bg-white"} ${selectClassName}`}
			onClick={handleToggleDropdown}
		>
			<span
				className={`text-sm ${selectedOption ? "text-gray-900" : "text-gray-400"}`}
			>
				{selectedOption ? selectedOption.label : placeholder}
			</span>
			<SvgIcon
				name="chevron-down-icon"
				className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
				svgStyle={{
					width: "16px",
					height: "16px",
					stroke: "currentColor",
					fill: "none",
				}}
			/>
		</button>
	);

	const renderError = () => {
		if (!displayError) return null;
		return <p className="mt-1 text-sm text-red-600">{displayError}</p>;
	};

	const renderSearchInput = () => {
		if (!showSearch) return null;
		return (
			<div className="sticky top-0 bg-white border-b border-gray-200 p-2">
				<div className="relative">
					<SvgIcon
						name="search-icon"
						className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
						svgStyle={{
							width: "16px",
							height: "16px",
							stroke: "currentColor",
							fill: "none",
						}}
					/>
					<input
						ref={searchInputRef}
						type="text"
						className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder={searchPlaceholder}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onClick={(e) => e?.stopPropagation()}
					/>
				</div>
			</div>
		);
	};

	const renderOptionsList = () => (
		<ul className={`overflow-y-auto ${maxHeightClass}`}>
			{filteredOptions.map((option) => {
				const isSelected = option.value === value;
				return (
					<li
						key={option.value}
						ref={isSelected ? selectedItemRef : null}
						className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""
							}`}
						onClick={() => handleSelectChange(option.value)}
					>
						<span className="text-sm text-gray-700">{option.label}</span>
						{isSelected && (
							<SvgIcon
								name="check-icon"
								className="w-5 h-5 text-blue-600 flex-shrink-0"
								svgStyle={{
									width: "20px",
									height: "20px",
									fill: "currentColor",
								}}
							/>
						)}
					</li>
				);
			})}
			{filteredOptions.length === 0 && (
				<li className="px-3 py-4 text-sm text-center text-gray-500">
					No results found
				</li>
			)}
		</ul>
	);

	const renderDropdown = () => {
		if (!isDropdownOpen || !dropdownPosition) return null;

		const viewportHeight = window.innerHeight;
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const availableSpaceBelow =
			viewportHeight - (dropdownPosition.top - scrollTop);
		const availableSpaceAbove = dropdownPosition.top - scrollTop;
		const maxAvailableSpace =
			Math.max(availableSpaceBelow, availableSpaceAbove) - 16;
		const maxDropdownHeight = Math.min(320, maxAvailableSpace);

		return createPortal(
			<div
				ref={dropdownRef}
				className="absolute z-[9999] bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden flex flex-col"
				style={{
					top: `${dropdownPosition.top}px`,
					left: `${dropdownPosition.left}px`,
					width: `${dropdownPosition.width}px`,
					maxHeight: `${maxDropdownHeight}px`,
				}}
				onClick={(e) => e.stopPropagation()}
				onMouseDown={(e) => e.stopPropagation()}
			>
				{renderSearchInput()}
				{renderOptionsList()}
			</div>,
			document.body
		);
	};

	// ==================== Main Render ====================
	return (
		<div className={className}>
			{renderLabel()}
			<div className="relative" ref={containerRef}>
				{renderSelectButton()}
			</div>
			{renderError()}
			{renderDropdown()}
		</div>
	);
};

export default SelectField;
