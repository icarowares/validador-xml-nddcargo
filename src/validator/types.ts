export interface ValidationError {
  path: string;
  message: string;
  lineNumber?: number;
  link?: { url: string; label: string };
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  parseError?: string;
  otCount: number;
  warnings?: string[];
}
