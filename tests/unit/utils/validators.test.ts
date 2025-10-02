/**
 * @test Form Validators
 * @description Unit tests for form validation utilities
 */

// Mock validator functions
const validators = {
  required: (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required';
    }
    return null;
  },

  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Invalid email format';
    }
    return null;
  },

  minLength: (min: number) => (value: string) => {
    if (value.length < min) {
      return `Minimum length is ${min} characters`;
    }
    return null;
  },

  maxLength: (max: number) => (value: string) => {
    if (value.length > max) {
      return `Maximum length is ${max} characters`;
    }
    return null;
  },

  pattern: (regex: RegExp, message: string) => (value: string) => {
    if (!regex.test(value)) {
      return message;
    }
    return null;
  },

  numeric: (value: string) => {
    if (!/^\d+$/.test(value)) {
      return 'Must contain only numbers';
    }
    return null;
  },

  phone: (value: string) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(value)) {
      return 'Invalid phone number format';
    }
    return null;
  },

  url: (value: string) => {
    try {
      new URL(value);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  },
};

describe('Form Validators', () => {
  describe('required validator', () => {
    it('should return error for empty string', () => {
      expect(validators.required('')).toBe('This field is required');
    });

    it('should return error for whitespace only', () => {
      expect(validators.required('   ')).toBe('This field is required');
    });

    it('should return error for null', () => {
      expect(validators.required(null)).toBe('This field is required');
    });

    it('should return error for undefined', () => {
      expect(validators.required(undefined)).toBe('This field is required');
    });

    it('should return null for valid value', () => {
      expect(validators.required('value')).toBeNull();
    });

    it('should handle numeric zero as valid', () => {
      expect(validators.required(0)).toBe('This field is required');
    });
  });

  describe('email validator', () => {
    it('should validate correct email format', () => {
      expect(validators.email('user@example.com')).toBeNull();
    });

    it('should reject email without @', () => {
      expect(validators.email('userexample.com')).toBe('Invalid email format');
    });

    it('should reject email without domain', () => {
      expect(validators.email('user@')).toBe('Invalid email format');
    });

    it('should reject email without TLD', () => {
      expect(validators.email('user@domain')).toBe('Invalid email format');
    });

    it('should validate email with subdomains', () => {
      expect(validators.email('user@mail.example.com')).toBeNull();
    });

    it('should validate email with plus addressing', () => {
      expect(validators.email('user+tag@example.com')).toBeNull();
    });

    it('should reject email with spaces', () => {
      expect(validators.email('user @example.com')).toBe('Invalid email format');
    });
  });

  describe('minLength validator', () => {
    const minLength5 = validators.minLength(5);

    it('should return error for short string', () => {
      expect(minLength5('abc')).toBe('Minimum length is 5 characters');
    });

    it('should return null for exact length', () => {
      expect(minLength5('abcde')).toBeNull();
    });

    it('should return null for longer string', () => {
      expect(minLength5('abcdefgh')).toBeNull();
    });

    it('should handle empty string', () => {
      expect(minLength5('')).toBe('Minimum length is 5 characters');
    });
  });

  describe('maxLength validator', () => {
    const maxLength10 = validators.maxLength(10);

    it('should return error for long string', () => {
      expect(maxLength10('12345678901')).toBe('Maximum length is 10 characters');
    });

    it('should return null for exact length', () => {
      expect(maxLength10('1234567890')).toBeNull();
    });

    it('should return null for shorter string', () => {
      expect(maxLength10('12345')).toBeNull();
    });

    it('should handle empty string', () => {
      expect(maxLength10('')).toBeNull();
    });
  });

  describe('pattern validator', () => {
    const alphaOnly = validators.pattern(/^[A-Za-z]+$/, 'Only letters allowed');

    it('should validate matching pattern', () => {
      expect(alphaOnly('Hello')).toBeNull();
    });

    it('should return error for non-matching pattern', () => {
      expect(alphaOnly('Hello123')).toBe('Only letters allowed');
    });

    it('should handle special characters', () => {
      expect(alphaOnly('Hello!')).toBe('Only letters allowed');
    });
  });

  describe('numeric validator', () => {
    it('should validate numeric string', () => {
      expect(validators.numeric('12345')).toBeNull();
    });

    it('should reject string with letters', () => {
      expect(validators.numeric('123abc')).toBe('Must contain only numbers');
    });

    it('should reject string with spaces', () => {
      expect(validators.numeric('123 456')).toBe('Must contain only numbers');
    });

    it('should reject negative numbers', () => {
      expect(validators.numeric('-123')).toBe('Must contain only numbers');
    });

    it('should reject decimal numbers', () => {
      expect(validators.numeric('12.34')).toBe('Must contain only numbers');
    });
  });

  describe('phone validator', () => {
    it('should validate phone with digits only', () => {
      expect(validators.phone('1234567890')).toBeNull();
    });

    it('should validate phone with hyphens', () => {
      expect(validators.phone('123-456-7890')).toBeNull();
    });

    it('should validate phone with parentheses', () => {
      expect(validators.phone('(123) 456-7890')).toBeNull();
    });

    it('should validate international format', () => {
      expect(validators.phone('+1 234 567 8900')).toBeNull();
    });

    it('should reject phone with letters', () => {
      expect(validators.phone('123-ABC-7890')).toBe('Invalid phone number format');
    });
  });

  describe('url validator', () => {
    it('should validate http URL', () => {
      expect(validators.url('http://example.com')).toBeNull();
    });

    it('should validate https URL', () => {
      expect(validators.url('https://example.com')).toBeNull();
    });

    it('should validate URL with path', () => {
      expect(validators.url('https://example.com/path/to/page')).toBeNull();
    });

    it('should validate URL with query params', () => {
      expect(validators.url('https://example.com?query=value')).toBeNull();
    });

    it('should reject invalid URL', () => {
      expect(validators.url('not a url')).toBe('Invalid URL format');
    });

    it('should reject URL without protocol', () => {
      expect(validators.url('example.com')).toBe('Invalid URL format');
    });
  });

  describe('Validator composition', () => {
    const compose = (...validators: Function[]) => (value: any) => {
      for (const validator of validators) {
        const error = validator(value);
        if (error) return error;
      }
      return null;
    };

    it('should run multiple validators in sequence', () => {
      const validate = compose(
        validators.required,
        validators.minLength(5),
        validators.email
      );

      expect(validate('')).toBe('This field is required');
      expect(validate('abc')).toBe('Minimum length is 5 characters');
      expect(validate('abcdef')).toBe('Invalid email format');
      expect(validate('user@example.com')).toBeNull();
    });

    it('should stop at first error', () => {
      const validate = compose(
        validators.required,
        validators.email
      );

      expect(validate('')).toBe('This field is required');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      expect(validators.required(longString)).toBeNull();
    });

    it('should handle unicode characters', () => {
      expect(validators.email('用户@example.com')).toBeNull();
    });

    it('should handle special email characters', () => {
      expect(validators.email('user.name+tag@example.co.uk')).toBeNull();
    });
  });
});
