/**
 * Enhanced form field component with immediate validation feedback
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  FormControl,
  FormLabel,
  FormHelperText,
  InputAdornment,
  IconButton,
  Box,
  Chip,
  Fade,
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error,
  Warning,
  Info,
  Clear,
} from '@mui/icons-material';

export interface ValidationRule {
  test: (value: string) => boolean | Promise<boolean>;
  message: string;
  level?: 'error' | 'warning' | 'info';
}

export interface FormFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  validationRules?: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showValidationIcon?: boolean;
  showCharacterCount?: boolean;
  clearable?: boolean;
  helperText?: string;
  autoComplete?: string;
  debounceMs?: number;
}

interface ValidationState {
  isValid: boolean;
  isValidating: boolean;
  messages: Array<{ message: string; level: 'error' | 'warning' | 'info' }>;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  multiline = false,
  rows = 4,
  maxLength,
  validationRules = [],
  validateOnChange = true,
  validateOnBlur = true,
  showValidationIcon = true,
  showCharacterCount = false,
  clearable = false,
  helperText,
  autoComplete,
  debounceMs = 300,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    isValidating: false,
    messages: [],
  });

  // Debounced validation
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  const validateField = useCallback(async (valueToValidate: string) => {
    if (!validationRules.length) {
      setValidationState({
        isValid: true,
        isValidating: false,
        messages: [],
      });
      return;
    }

    setValidationState(prev => ({ ...prev, isValidating: true }));

    const messages: Array<{ message: string; level: 'error' | 'warning' | 'info' }> = [];
    let isValid = true;

    // Required field validation
    if (required && !valueToValidate.trim()) {
      messages.push({ message: `${label} is required`, level: 'error' });
      isValid = false;
    }

    // Custom validation rules
    if (valueToValidate.trim() || required) {
      for (const rule of validationRules) {
        try {
          const result = await rule.test(valueToValidate);
          if (!result) {
            messages.push({
              message: rule.message,
              level: rule.level || 'error',
            });
            if (rule.level !== 'warning' && rule.level !== 'info') {
              isValid = false;
            }
          }
        } catch (error) {
          messages.push({
            message: 'Validation error occurred',
            level: 'error',
          });
          isValid = false;
        }
      }
    }

    setValidationState({
      isValid,
      isValidating: false,
      messages,
    });
  }, [validationRules, required, label]);

  // Validate on value change
  useEffect(() => {
    if (validateOnChange && debouncedValue !== value) {
      validateField(debouncedValue);
    }
  }, [debouncedValue, validateOnChange, validateField, value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // Apply max length constraint
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    onChange(newValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (validateOnBlur) {
      validateField(value);
    }
    if (onBlur) {
      onBlur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleClear = () => {
    onChange('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determine field state
  const hasError = validationState.messages.some(msg => msg.level === 'error');
  const hasWarning = validationState.messages.some(msg => msg.level === 'warning');
  const hasInfo = validationState.messages.some(msg => msg.level === 'info');

  // Get validation icon
  const getValidationIcon = () => {
    if (validationState.isValidating) {
      return null; // Will show progress indicator
    }
    if (hasError) {
      return <Error color="error" />;
    }
    if (hasWarning) {
      return <Warning color="warning" />;
    }
    if (hasInfo) {
      return <Info color="info" />;
    }
    if (value && validationState.isValid && validationRules.length > 0) {
      return <CheckCircle color="success" />;
    }
    return null;
  };

  // Build input adornments
  const endAdornment = (
    <InputAdornment position="end">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Validation icon */}
        {showValidationIcon && getValidationIcon()}
        
        {/* Clear button */}
        {clearable && value && !disabled && (
          <IconButton
            size="small"
            onClick={handleClear}
            edge="end"
            aria-label="clear"
          >
            <Clear />
          </IconButton>
        )}
        
        {/* Password visibility toggle */}
        {type === 'password' && (
          <IconButton
            size="small"
            onClick={togglePasswordVisibility}
            edge="end"
            aria-label={showPassword ? 'hide password' : 'show password'}
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        )}
      </Box>
    </InputAdornment>
  );

  // Build helper text
  const buildHelperText = () => {
    const parts: React.ReactNode[] = [];
    
    // Validation messages
    if (validationState.messages.length > 0) {
      validationState.messages.forEach((msg, index) => (
        parts.push(
          <Box key={index} component="span" sx={{ display: 'block' }}>
            {msg.message}
          </Box>
        )
      ));
    } else if (helperText) {
      parts.push(helperText);
    }
    
    // Character count
    if (showCharacterCount && maxLength) {
      const countText = `${value.length}/${maxLength}`;
      const isNearLimit = value.length > maxLength * 0.8;
      
      parts.push(
        <Box
          key="char-count"
          component="span"
          sx={{
            display: 'block',
            textAlign: 'right',
            color: isNearLimit ? 'warning.main' : 'text.secondary',
            fontSize: '0.75rem',
          }}
        >
          {countText}
        </Box>
      );
    }
    
    return parts.length > 0 ? <>{parts}</> : undefined;
  };

  return (
    <FormControl fullWidth error={hasError} disabled={disabled}>
      <TextField
        name={name}
        label={label}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        multiline={multiline}
        rows={multiline ? rows : undefined}
        autoComplete={autoComplete}
        error={hasError}
        helperText={buildHelperText()}
        InputProps={{
          endAdornment,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: hasError
                ? 'error.main'
                : hasWarning
                ? 'warning.main'
                : hasInfo
                ? 'info.main'
                : validationState.isValid && value && validationRules.length > 0
                ? 'success.main'
                : undefined,
            },
          },
        }}
      />
      
      {/* Validation progress indicator */}
      {validationState.isValidating && (
        <Fade in={true}>
          <LinearProgress
            size="small"
            sx={{
              mt: 0.5,
              height: 2,
              borderRadius: 1,
            }}
          />
        </Fade>
      )}
      
      {/* Validation chips for multiple messages */}
      {isFocused && validationState.messages.length > 1 && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {validationState.messages.map((msg, index) => (
            <Chip
              key={index}
              label={msg.message}
              size="small"
              color={msg.level === 'error' ? 'error' : msg.level === 'warning' ? 'warning' : 'info'}
              variant="outlined"
            />
          ))}
        </Box>
      )}
    </FormControl>
  );
};

export default FormField;