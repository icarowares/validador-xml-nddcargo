export interface ValidationError {
  path: string;
  message: string;
  lineNumber?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  parseError?: string;
  otCount: number;
}
