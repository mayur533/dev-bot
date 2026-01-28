/**
 * Configuration Validator Utility
 * Validates configuration objects and provides error reporting
 */

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class ConfigValidator {
  private static instance: ConfigValidator;

  private constructor() {}

  public static getInstance(): ConfigValidator {
    if (!ConfigValidator.instance) {
      ConfigValidator.instance = new ConfigValidator();
    }
    return ConfigValidator.instance;
  }

  public validate(config: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [field, rule] of Object.entries(schema)) {
      const value = config[field];
      const fieldErrors = this.validateField(field, value, rule);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateField(field: string, value: any, rule: ValidationRule): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check if required
    if (rule.required && (value === undefined || value === null)) {
      errors.push({
        field,
        message: `${field} is required`,
        value
      });
      return errors; // Skip other validations if required field is missing
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) {
      return errors;
    }

    // Type validation
    if (rule.type && !this.validateType(value, rule.type)) {
      errors.push({
        field,
        message: `${field} must be of type ${rule.type}`,
        value
      });
    }

    // Number range validation
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field,
          message: `${field} must be at least ${rule.min}`,
          value
        });
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field,
          message: `${field} must be at most ${rule.max}`,
          value
        });
      }
    }

    // String pattern validation
    if (typeof value === 'string' && rule.pattern && !rule.pattern.test(value)) {
      errors.push({
        field,
        message: `${field} does not match required pattern`,
        value
      });
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field,
        message: `${field} must be one of: ${rule.enum.join(', ')}`,
        value
      });
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        errors.push({
          field,
          message: typeof customResult === 'string' ? customResult : `${field} failed custom validation`,
          value
        });
      }
    }

    return errors;
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  public createSchema(definition: ValidationSchema): ValidationSchema {
    return definition;
  }
}

export const configValidator = ConfigValidator.getInstance();
