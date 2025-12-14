import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const HomePage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          🧾 Invoice OCR Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Automate invoice processing with AI-powered OCR
        </p>

        <div className="flex gap-4 justify-center mb-8">
          <Link to="/login">
            <Button className="px-8 py-3 text-lg">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="secondary" className="px-8 py-3 text-lg">
              Sign Up
            </Button>
          </Link>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Tech Stack
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <p className="text-sm text-gray-700">✅ React 18 + TypeScript</p>
              <p className="text-sm text-gray-700">✅ Vite (Fast Build Tool)</p>
              <p className="text-sm text-gray-700">✅ Tailwind CSS</p>
              <p className="text-sm text-gray-700">✅ React Router v6</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">✅ TanStack Query</p>
              <p className="text-sm text-gray-700">✅ React Hook Form</p>
              <p className="text-sm text-gray-700">✅ Zod Validation</p>
              <p className="text-sm text-gray-700">✅ Axios</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🚀 Ready to Build!
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Your frontend is set up and ready for development.
          </p>
          <div className="text-left space-y-2">
            <p className="text-xs text-blue-600">
              📖 Read: <code className="bg-blue-100 px-2 py-1 rounded">FEATURE_DEVELOPMENT_GUIDE.md</code>
            </p>
            <p className="text-xs text-blue-600">
              📋 Check: <code className="bg-blue-100 px-2 py-1 rounded">IMPLEMENTATION_CHECKLIST.md</code>
            </p>
            <p className="text-xs text-blue-600">
              🔧 Reference: <code className="bg-blue-100 px-2 py-1 rounded">DEVELOPER_CHEATSHEET.md</code>
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Start building by creating pages in <code className="bg-gray-100 px-2 py-1 rounded">src/pages/</code>
        </p>
      </div>
    </div>
  );
};

export default HomePage;

