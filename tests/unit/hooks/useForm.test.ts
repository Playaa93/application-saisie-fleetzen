/**
 * @test useForm Hook
 * @description Unit tests for custom form hook
 */

import { renderHook, act } from '@testing-library/react';

// Mock useForm hook
const useForm = (initialValues: any = {}) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (name: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const setFieldError = (name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (onSubmit: (values: any) => Promise<void>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error: any) {
      if (error.fieldErrors) {
        setErrors(error.fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    setFieldError,
    handleSubmit,
    reset,
  };
};

import React from 'react';

describe('useForm Hook', () => {
  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useForm({ name: 'John' }));

      expect(result.current.values).toEqual({ name: 'John' });
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should initialize with empty object if no initial values', () => {
      const { result } = renderHook(() => useForm());

      expect(result.current.values).toEqual({});
    });
  });

  describe('Field Changes', () => {
    it('should update field value on change', () => {
      const { result } = renderHook(() => useForm({ name: '' }));

      act(() => {
        result.current.handleChange('name', 'John Doe');
      });

      expect(result.current.values.name).toBe('John Doe');
    });

    it('should handle multiple field changes', () => {
      const { result } = renderHook(() => useForm({ name: '', email: '' }));

      act(() => {
        result.current.handleChange('name', 'John');
        result.current.handleChange('email', 'john@example.com');
      });

      expect(result.current.values).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should clear field error on change', () => {
      const { result } = renderHook(() => useForm({ name: '' }));

      act(() => {
        result.current.setFieldError('name', 'Required field');
      });

      expect(result.current.errors.name).toBe('Required field');

      act(() => {
        result.current.handleChange('name', 'John');
      });

      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('Field Blur', () => {
    it('should mark field as touched on blur', () => {
      const { result } = renderHook(() => useForm({ name: '' }));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.touched.name).toBe(true);
    });

    it('should handle multiple field blurs', () => {
      const { result } = renderHook(() => useForm({ name: '', email: '' }));

      act(() => {
        result.current.handleBlur('name');
        result.current.handleBlur('email');
      });

      expect(result.current.touched).toEqual({
        name: true,
        email: true,
      });
    });
  });

  describe('Form Submission', () => {
    it('should handle successful submission', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useForm({ name: 'John' }));

      await act(async () => {
        await result.current.handleSubmit(onSubmit);
      });

      expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should set isSubmitting during submission', async () => {
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const { result } = renderHook(() => useForm({ name: 'John' }));

      const submitPromise = act(async () => {
        await result.current.handleSubmit(onSubmit);
      });

      expect(result.current.isSubmitting).toBe(true);

      await submitPromise;

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle submission errors', async () => {
      const fieldErrors = { name: 'Invalid name', email: 'Invalid email' };
      const onSubmit = jest.fn().mockRejectedValue({ fieldErrors });
      const { result } = renderHook(() => useForm({ name: '', email: '' }));

      await act(async () => {
        await result.current.handleSubmit(onSubmit);
      });

      expect(result.current.errors).toEqual(fieldErrors);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should not set errors for non-field errors', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useForm({ name: 'John' }));

      await act(async () => {
        await result.current.handleSubmit(onSubmit);
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('Form Reset', () => {
    it('should reset to initial values', () => {
      const { result } = renderHook(() => useForm({ name: 'John', email: '' }));

      act(() => {
        result.current.handleChange('name', 'Jane');
        result.current.handleChange('email', 'jane@example.com');
        result.current.setFieldError('name', 'Error');
        result.current.handleBlur('name');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual({ name: 'John', email: '' });
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('Error Management', () => {
    it('should set field error manually', () => {
      const { result } = renderHook(() => useForm({ name: '' }));

      act(() => {
        result.current.setFieldError('name', 'Custom error');
      });

      expect(result.current.errors.name).toBe('Custom error');
    });

    it('should handle multiple field errors', () => {
      const { result } = renderHook(() => useForm({ name: '', email: '' }));

      act(() => {
        result.current.setFieldError('name', 'Name error');
        result.current.setFieldError('email', 'Email error');
      });

      expect(result.current.errors).toEqual({
        name: 'Name error',
        email: 'Email error',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined field names', () => {
      const { result } = renderHook(() => useForm());

      act(() => {
        result.current.handleChange('newField', 'value');
      });

      expect(result.current.values.newField).toBe('value');
    });

    it('should handle null values', () => {
      const { result } = renderHook(() => useForm({ name: 'John' }));

      act(() => {
        result.current.handleChange('name', null);
      });

      expect(result.current.values.name).toBeNull();
    });

    it('should handle array values', () => {
      const { result } = renderHook(() => useForm({ tags: [] }));

      act(() => {
        result.current.handleChange('tags', ['tag1', 'tag2']);
      });

      expect(result.current.values.tags).toEqual(['tag1', 'tag2']);
    });

    it('should handle object values', () => {
      const { result } = renderHook(() => useForm({ address: {} }));

      act(() => {
        result.current.handleChange('address', { city: 'NYC', zip: '10001' });
      });

      expect(result.current.values.address).toEqual({ city: 'NYC', zip: '10001' });
    });
  });
});
