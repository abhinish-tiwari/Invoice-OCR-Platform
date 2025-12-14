import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { InputField } from '../../common/forms/components/InputField';
import { useFormSection } from '../../common/forms/hooks/useFormSection';
import Button from '../../common/components/Button';
import Form from '../../common/components/Form';
import { AuthService } from '../services/auth.service';
import { RegexPatterns } from '../../common/constants/regex-patterns';

interface RegisterFormData {
  fullName: string;
  email: string;
  companyName: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [termsError, setTermsError] = useState<string>('');
  const [generalError, setGeneralError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    formData,
    handleChange,
    handleValidationChange,
    isAllFieldsValid,
    shouldValidate,
    setShouldValidate,
  } = useFormSection<RegisterFormData>({
    fields: ['fullName', 'email', 'companyName', 'password', 'confirmPassword'],
    requiredFields: ['fullName', 'email', 'companyName', 'password', 'confirmPassword'],
  });

  const handleSubmit = async () => {
    setGeneralError('');
    setTermsError('');
    setShouldValidate(true);

    if (!agreeToTerms) {
      setTermsError('You must agree to the terms and conditions');
      return;
    }

    if (!isAllFieldsValid()) {
      return;
    }

    setIsLoading(true);

    const result = await AuthService.register({
      ...formData,
      agreeToTerms,
    });

    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setGeneralError(result.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4 py-6">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 animate-slideUp">
        {/* Left Side - Branding */}
        <div className="hidden md:flex bg-gradient-to-br from-purple-600 to-indigo-700 p-8 text-white flex-col justify-center items-center text-center">
          <div className="text-6xl mb-4 animate-float">🧾</div>
          <h1 className="text-3xl font-bold mb-3">Join Us Today!</h1>
          <p className="text-sm opacity-90 leading-relaxed mb-6">
            Start automating your invoice processing and unlock powerful insights for your business.
          </p>

          <div className="text-left w-full max-w-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span className="text-sm">AI-Powered OCR</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="text-sm">Fast Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span className="text-sm">Real-time Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span className="text-sm">Secure & Compliant</span>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="p-6 md:p-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Create Account</h2>
            <p className="text-gray-600 text-sm">Fill in your details to get started</p>
          </div>

          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {generalError}
            </div>
          )}

          <Form onSubmit={handleSubmit}>
            <div className="space-y-2">
              <InputField
                fieldName="fullName"
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                onValidationChange={handleValidationChange('fullName')}
                validationRules={{
                  required: { message: 'Full name is required' },
                  minLength: { value: 2, message: 'Must be at least 2 characters' }
                }}
                shouldValidate={shouldValidate}
              />

              <InputField
                fieldName="email"
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                onValidationChange={handleValidationChange('email')}
                validationRules={{
                  required: { message: 'Email is required' },
                  pattern: { value: RegexPatterns.EMAIL, message: 'Please enter a valid email address' }
                }}
                shouldValidate={shouldValidate}
              />

              <InputField
                fieldName="companyName"
                label="Company Name"
                type="text"
                placeholder="Enter your company name"
                value={formData.companyName}
                onChange={handleChange}
                onValidationChange={handleValidationChange('companyName')}
                validationRules={{
                  required: { message: 'Company name is required' },
                  minLength: { value: 2, message: 'Must be at least 2 characters' }
                }}
                shouldValidate={shouldValidate}
              />

              <InputField
                fieldName="password"
                label="Password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                onValidationChange={handleValidationChange('password')}
                validationRules={{
                  required: { message: 'Password is required' },
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  pattern: { value: RegexPatterns.PASSWORD, message: 'Password must contain uppercase, lowercase, and number' }
                }}
                shouldValidate={shouldValidate}
              />

              <InputField
                fieldName="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onValidationChange={handleValidationChange('confirmPassword')}
                validationRules={{
                  required: { message: 'Please confirm your password' },
                  custom: {
                    validate: (value: string) => value === formData.password,
                    message: 'Passwords do not match'
                  }
                }}
                shouldValidate={shouldValidate}
              />
            </div>

            <div className="mt-3 mb-3">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => {
                    setAgreeToTerms(e.target.checked);
                    if (e.target.checked) setTermsError('');
                  }}
                  className="w-4 h-4 mt-0.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-xs text-gray-700 leading-tight">
                  I agree to the{' '}
                  <Link to="/terms" className="text-purple-600 hover:text-purple-700 font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-purple-600 hover:text-purple-700 font-medium">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {termsError && (
                <p className="mt-1 text-xs text-red-600">{termsError}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Form>

          <div className="mt-4 text-center">
            <p className="text-gray-600 text-xs">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

