import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { InputField } from '../../common/forms/components/InputField';
import { useFormSection } from '../../common/forms/hooks/useFormSection';
import Button from '../../common/components/Button';
import Form from '../../common/components/Form';
import { AuthService } from '../services/auth.service';
import { RegexPatterns } from '../../common/constants/regex-patterns';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rememberMe, setRememberMe] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    formData,
    handleChange,
    handleValidationChange,
    isAllFieldsValid,
    shouldValidate,
    setShouldValidate,
  } = useFormSection<LoginFormData>({
    fields: ['email', 'password'],
    requiredFields: ['email', 'password'],
  });

  const handleSubmit = async () => {
    setGeneralError('');
    setShouldValidate(true);

    if (!isAllFieldsValid()) {
      return;
    }

    setIsLoading(true);

    const result = await AuthService.login(
      formData.email,
      formData.password,
      rememberMe
    );

    setIsLoading(false);

    if (result.success) {
      // Redirect to the page they were trying to access, or dashboard
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      setGeneralError(result.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full grid md:grid-cols-2 animate-slideUp">
        {/* Left Side - Branding */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-12 text-white flex flex-col justify-center items-center text-center">
          <div className="text-8xl mb-5 animate-float">🧾</div>
          <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
          <p className="text-lg opacity-90 leading-relaxed">
            Sign in to access your invoice processing dashboard and unlock powerful automation tools.
          </p>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-12">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h2>
            <p className="text-gray-600">Enter your credentials to continue</p>
          </div>

          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {generalError}
            </div>
          )}

          <Form onSubmit={handleSubmit}>
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
              className="mb-4"
            />

            <InputField
              fieldName="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              onValidationChange={handleValidationChange('password')}
              validationRules={{
                required: { message: 'Password is required' },
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              }}
              shouldValidate={shouldValidate}
              className="mb-4"
            />

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-purple-600 hover:text-purple-700 font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

