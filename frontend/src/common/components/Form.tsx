import React, { FormEvent } from 'react';

interface FormProps {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Form wrapper component with consistent styling and behavior
 */
const Form: React.FC<FormProps> = ({ onSubmit, children, className = '', id }) => {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className={className} id={id} noValidate>
      {children}
    </form>
  );
};

export default Form;

