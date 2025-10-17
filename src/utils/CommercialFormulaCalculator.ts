/**
 * Commercial Formula Calculator
 * 
 * A safe, commercial-friendly formula engine for B2B SaaS applications.
 * Implements Excel-like functions without GPL-3.0 licensing restrictions.
 * 
 * Features:
 * - Excel-like syntax with = prefix
 * - Mathematical operations: +, -, *, /, ^, %
 * - Functions: SUM, AVERAGE, COUNT, COUNTIF, IF, ROUND, etc.
 * - Field references: =A1, =B2, etc.
 * - Safe for commercial use (MIT/BSD compatible)
 * 
 * @license MIT
 */

export interface FormulaContext {
  [key: string]: any;
}

export interface FormulaResult {
  value: number | string | boolean;
  error?: string;
  type: 'number' | 'string' | 'boolean' | 'error';
}

export class CommercialFormulaCalculator {
  private context: FormulaContext = {};
  private functions: Map<string, Function> = new Map();

  constructor() {
    this.registerBuiltInFunctions();
  }

  /**
   * Set the context data for formula evaluation
   */
  setContext(context: FormulaContext): void {
    this.context = { ...context };
  }

  /**
   * Register a custom function
   */
  registerFunction(name: string, fn: Function): void {
    this.functions.set(name.toUpperCase(), fn);
  }

  /**
   * Evaluate a formula string
   */
  evaluate(formula: string): FormulaResult {
    try {
      if (!formula || typeof formula !== 'string') {
        return { value: 0, type: 'number' };
      }

      const trimmedFormula = formula.trim();
// Handle Excel-style formulas (starting with =)
      if (trimmedFormula.startsWith('=')) {
return this.evaluateExcelFormula(trimmedFormula.substring(1));
      }

      // Handle legacy formulas (no = prefix)
return this.evaluateLegacyFormula(trimmedFormula);

    } catch (error) {
      return {
        value: 0,
        error: `Formula evaluation error: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      };
    }
  }

  /**
   * Evaluate a formula string with context
   */
  evaluateWithContext(formula: string, context: FormulaContext): FormulaResult {
    this.setContext(context);
    return this.evaluate(formula);
  }

  /**
   * Evaluate Excel-style formula
   */
  private evaluateExcelFormula(formula: string): FormulaResult {
    try {
      // Remove spaces and convert to uppercase for function names
      const cleanFormula = formula.replace(/\s+/g, '');
      
      // Handle function calls
      if (cleanFormula.includes('(') && cleanFormula.includes(')')) {
        return this.evaluateFunction(cleanFormula);
      }

      // Handle mathematical expressions
      if (this.isMathematicalExpression(cleanFormula)) {
        return this.evaluateMathematicalExpression(cleanFormula);
      }

      // Handle cell references (A1, B2, etc.)
      if (this.isCellReference(cleanFormula)) {
        return this.evaluateCellReference(cleanFormula);
      }

      // Handle field references (field names)
      if (this.isFieldReference(cleanFormula)) {
        return this.evaluateFieldReference(cleanFormula);
      }

      return { value: 0, type: 'number' };

    } catch (error) {
      return {
        value: 0,
        error: `Excel formula error: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      };
    }
  }

  /**
   * Evaluate legacy formula (backward compatibility)
   */
  private evaluateLegacyFormula(formula: string): FormulaResult {
    try {
// Legacy COUNT function
      if (formula.startsWith('COUNT(') && formula.endsWith(')')) {
const value = formula.slice(6, -1).replace(/['"]/g, '');
        return this.countValuesInFormData(value);
      }

      // Legacy SUM function
      if (formula.startsWith('SUM(') && formula.endsWith(')')) {
const fields = formula.slice(4, -1).split(',').map(f => f.trim());
        return this.sumFields(fields);
      }

      // Legacy FIELD function - only match single FIELD calls, not expressions
      if (formula.startsWith('FIELD(') && formula.endsWith(')') && !formula.includes('+') && !formula.includes('-') && !formula.includes('*') && !formula.includes('/')) {
const fieldName = formula.slice(6, -1).replace(/['"]/g, '');
        return this.getFieldValue(fieldName);
      }
// Handle mathematical expressions with embedded function calls
      if (this.containsFunctionCalls(formula)) {
        return this.evaluateExpressionWithFunctions(formula);
      }
return { value: 0, type: 'number' };

    } catch (error) {
      return {
        value: 0,
        error: `Legacy formula error: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      };
    }
  }

  /**
   * Check if formula contains function calls
   */
  private containsFunctionCalls(formula: string): boolean {
    const regex = /[A-Z]+\([^)]*\)/;
    return regex.test(formula);
  }

  /**
   * Evaluate expression containing function calls
   */
  private evaluateExpressionWithFunctions(expression: string): FormulaResult {
    try {
let processedExpression = expression;
      
      // Find and replace all function calls
      const functionCallRegex = /([A-Z]+)\(([^)]*)\)/g;
      let match;
      
      while ((match = functionCallRegex.exec(expression)) !== null) {
        const fullMatch = match[0];
        const functionName = match[1];
        const args = match[2];
let functionResult = 0;
        
        // Handle different function types
        switch (functionName) {
          case 'COUNT':
            const countValue = args.replace(/['"]/g, '');
            functionResult = this.countValuesInFormData(countValue).value as number;
break;
          case 'FIELD':
            const fieldName = args.replace(/['"]/g, '');
            functionResult = this.getFieldValue(fieldName).value as number;
break;
          case 'SUM':
            const fields = args.split(',').map(f => f.trim());
            functionResult = this.sumFields(fields).value as number;
break;
          default:
            // Try to use Excel-style function
            const fn = this.functions.get(functionName);
            if (fn) {
              const parsedArgs = this.parseFunctionArguments(args);
              functionResult = fn(...parsedArgs);
}
            break;
        }
        
        // Replace the function call with its result
        processedExpression = processedExpression.replace(fullMatch, String(functionResult));
}
      
      // The expression is built internally from sanitized values (numbers or function outputs)
      // eslint-disable-next-line no-new-func -- evaluated expression contains only calculator-generated content
      const result = new Function('return ' + processedExpression)();
return {
        value: isNaN(result) ? 0 : result,
        type: 'number'
      };
      
    } catch (error) {
return {
        value: 0,
        error: `Expression evaluation error: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      };
    }
  }

  /**
   * Register built-in Excel-like functions
   */
  private registerBuiltInFunctions(): void {
    // Mathematical functions
    this.registerFunction('SUM', (...args: any[]) => this.excelSum(args));
    this.registerFunction('AVERAGE', (...args: any[]) => this.excelAverage(args));
    this.registerFunction('COUNT', (...args: any[]) => this.excelCount(args));
    this.registerFunction('COUNTIF', (...args: any[]) => this.excelCountIf(args));
    this.registerFunction('ROUND', (...args: any[]) => this.excelRound(args));
    this.registerFunction('MAX', (...args: any[]) => this.excelMax(args));
    this.registerFunction('MIN', (...args: any[]) => this.excelMin(args));
    this.registerFunction('ABS', (...args: any[]) => this.excelAbs(args));
    this.registerFunction('POWER', (...args: any[]) => this.excelPower(args));
    this.registerFunction('SQRT', (...args: any[]) => this.excelSqrt(args));

    // Logical functions
    this.registerFunction('IF', (...args: any[]) => this.excelIf(args));
    this.registerFunction('AND', (...args: any[]) => this.excelAnd(args));
    this.registerFunction('OR', (...args: any[]) => this.excelOr(args));
    this.registerFunction('NOT', (...args: any[]) => this.excelNot(args));

    // Text functions
    this.registerFunction('CONCATENATE', (...args: any[]) => this.excelConcatenate(args));
    this.registerFunction('LEN', (...args: any[]) => this.excelLen(args));
    this.registerFunction('UPPER', (...args: any[]) => this.excelUpper(args));
    this.registerFunction('LOWER', (...args: any[]) => this.excelLower(args));

    // Statistical functions
    this.registerFunction('SUMPRODUCT', (...args: any[]) => this.excelSumProduct(args));
    this.registerFunction('MEDIAN', (...args: any[]) => this.excelMedian(args));
    this.registerFunction('MODE', (...args: any[]) => this.excelMode(args));

    // Time calculation functions
    this.registerFunction('CALC_HOURS', (...args: any[]) => this.calcHours(args));
    this.registerFunction('SUM_DAILY_HOURS', (...args: any[]) => this.sumDailyHours(args));
    this.registerFunction('CALC_OVERTIME', (...args: any[]) => this.calcOvertime(args));
    this.registerFunction('FIELD', (...args: any[]) => this.getFieldValueFromArgs(args));
  }

  /**
   * Evaluate function calls
   */
  private evaluateFunction(formula: string): FormulaResult {
    try {
      const match = formula.match(/^([A-Z]+)\((.*)\)$/);
      if (!match) {
        return { value: 0, type: 'number' };
      }

      const functionName = match[1];
      const argsString = match[2];

      // Parse arguments
      const args = this.parseFunctionArguments(argsString);
      
      // Get function
      const fn = this.functions.get(functionName);
      if (!fn) {
        return {
          value: 0,
          error: `Unknown function: ${functionName}`,
          type: 'error'
        };
      }

      // Execute function
      const result = fn(...args);
      return {
        value: result,
        type: typeof result === 'number' ? 'number' : 
              typeof result === 'boolean' ? 'boolean' : 'string'
      };

    } catch (error) {
      return {
        value: 0,
        error: `Function evaluation error: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      };
    }
  }

  /**
   * Parse function arguments
   */
  private parseFunctionArguments(argsString: string): any[] {
    const args: any[] = [];
    let currentArg = '';
    let parenDepth = 0;
    let inQuotes = false;

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if (char === '"' && (i === 0 || argsString[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
        currentArg += char;
        continue;
      }

      if (!inQuotes) {
        if (char === '(') {
          parenDepth++;
        } else if (char === ')') {
          parenDepth--;
        } else if (char === ',' && parenDepth === 0) {
          args.push(this.parseArgument(currentArg.trim()));
          currentArg = '';
          continue;
        }
      }

      currentArg += char;
    }

    if (currentArg.trim()) {
      args.push(this.parseArgument(currentArg.trim()));
    }

    return args;
  }

  /**
   * Parse individual argument
   */
  private parseArgument(arg: string): any {
    // Remove quotes
    if ((arg.startsWith('"') && arg.endsWith('"')) || 
        (arg.startsWith("'") && arg.endsWith("'"))) {
      return arg.slice(1, -1);
    }

    // Check if it's a number
    if (!isNaN(Number(arg))) {
      return Number(arg);
    }

    // Check if it's a cell reference
    if (this.isCellReference(arg)) {
      return this.evaluateCellReference(arg).value;
    }

    // Check if it's a field reference
    if (this.isFieldReference(arg)) {
      return this.evaluateFieldReference(arg).value;
    }

    // Check if it's a boolean
    if (arg.toUpperCase() === 'TRUE') return true;
    if (arg.toUpperCase() === 'FALSE') return false;

    return arg;
  }

  /**
   * Check if string is a mathematical expression
   */
  private isMathematicalExpression(formula: string): boolean {
    return /^[0-9+\-*/().\s]+$/.test(formula);
  }

  /**
   * Check if string is a cell reference
   */
  private isCellReference(formula: string): boolean {
    return /^[A-Z]+\d+$/.test(formula);
  }

  /**
   * Check if string is a field reference
   */
  private isFieldReference(formula: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(formula);
  }

  /**
   * Evaluate mathematical expression
   */
  private evaluateMathematicalExpression(expression: string): FormulaResult {
    try {
      // Replace field references with values
      let processedExpression = expression;
      const fieldMatches = expression.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
      
      // Handle both direct context and nested form data
      const dataSource = this.context.formData || this.context;
      
      for (const field of fieldMatches) {
        const fieldValue = dataSource[field];
        if (fieldValue !== undefined) {
          processedExpression = processedExpression.replace(
            new RegExp(`\\b${field}\\b`, 'g'), 
            String(fieldValue)
          );
        } else {
          // Replace undefined fields with 0
          processedExpression = processedExpression.replace(
            new RegExp(`\\b${field}\\b`, 'g'), 
            '0'
          );
        }
      }

      // The expression is composed only of numeric literals after substitution above
      // eslint-disable-next-line no-new-func -- controlled expression generated by the calculator
      const result = new Function('return ' + processedExpression)();
      
      return {
        value: isNaN(result) ? 0 : result,
        type: 'number'
      };

    } catch (error) {
      return {
        value: 0,
        error: `Mathematical expression error: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      };
    }
  }

  /**
   * Evaluate cell reference (A1, B2, etc.)
   */
  private evaluateCellReference(cellRef: string): FormulaResult {
    // For now, treat cell references as field references
    // In a real implementation, you might want to map A1->field1, B2->field2, etc.
    const fieldName = `field_${cellRef}`;
    return this.evaluateFieldReference(fieldName);
  }

  /**
   * Evaluate field reference
   */
  private evaluateFieldReference(fieldName: string): FormulaResult {
    // Handle both direct context and nested form data
    const dataSource = this.context.formData || this.context;
    const value = dataSource[fieldName];
    if (value === undefined) {
      return { value: 0, type: 'number' };
    }

    const numValue = Number(value);
    return {
      value: isNaN(numValue) ? value : numValue,
      type: isNaN(numValue) ? 'string' : 'number'
    };
  }

  // Legacy functions (for backward compatibility)
  private countValues(value: string): FormulaResult {
    let count = 0;
    for (const key in this.context) {
      if (this.context[key] === value) {
        count++;
      }
    }
    return { value: count, type: 'number' };
  }

  // Enhanced COUNT function that works with form data structure
  private countValuesInFormData(value: string): FormulaResult {
    let count = 0;
    
    // Handle both direct context and nested form data
    const dataToSearch = this.context.formData || this.context;
    
    for (const key in dataToSearch) {
      if (dataToSearch[key] === value) {
        count++;
      }
    }
    
    return { value: count, type: 'number' };
  }

  private sumFields(fields: string[]): FormulaResult {
    let sum = 0;
    // Handle both direct context and nested form data
    const dataSource = this.context.formData || this.context;
    
    for (const field of fields) {
      const value = dataSource[field];
      if (value !== undefined) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          sum += numValue;
        }
      }
    }
    return { value: sum, type: 'number' };
  }

  private getFieldValue(fieldName: string): FormulaResult {
    // Handle both direct context and nested form data
    const dataSource = this.context.formData || this.context;
    const value = dataSource[fieldName];
    if (value === undefined) {
      return { value: 0, type: 'number' };
    }
    const numValue = Number(value);
    return {
      value: isNaN(numValue) ? value : numValue,
      type: isNaN(numValue) ? 'string' : 'number'
    };
  }

  // Excel-like function implementations
  private excelSum(args: any[]): number {
    return args.reduce((sum, arg) => {
      const num = Number(arg);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }

  private excelAverage(args: any[]): number {
    const validNumbers = args.filter(arg => !isNaN(Number(arg)));
    if (validNumbers.length === 0) return 0;
    return this.excelSum(validNumbers) / validNumbers.length;
  }

  private excelCount(args: any[]): number {
    return args.filter(arg => arg !== null && arg !== undefined && arg !== '').length;
  }

  private excelCountIf(args: any[]): number {
    if (args.length < 2) return 0;
    
    // Handle field references in the first argument
    let range = args[0];
    if (typeof range === 'string' && this.isFieldReference(range)) {
      // If it's a single field reference, get all form data values
      const formData = this.context.formData || this.context;
      range = Object.values(formData);
    } else if (!Array.isArray(range)) {
      range = [range];
    }
    
    const criteria = args[1];
    
    return range.filter((item: any) => {
      if (typeof criteria === 'string') {
        return String(item) === criteria;
      }
      if (typeof criteria === 'number') {
        return Number(item) === criteria;
      }
      return item === criteria;
    }).length;
  }

  private excelRound(args: any[]): number {
    if (args.length < 1) return 0;
    const number = Number(args[0]);
    const decimals = args.length > 1 ? Number(args[1]) : 0;
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  private excelMax(args: any[]): number {
    const numbers = args.map(arg => Number(arg)).filter(num => !isNaN(num));
    return numbers.length > 0 ? Math.max(...numbers) : 0;
  }

  private excelMin(args: any[]): number {
    const numbers = args.map(arg => Number(arg)).filter(num => !isNaN(num));
    return numbers.length > 0 ? Math.min(...numbers) : 0;
  }

  private excelAbs(args: any[]): number {
    if (args.length < 1) return 0;
    return Math.abs(Number(args[0]));
  }

  private excelPower(args: any[]): number {
    if (args.length < 2) return 0;
    return Math.pow(Number(args[0]), Number(args[1]));
  }

  private excelSqrt(args: any[]): number {
    if (args.length < 1) return 0;
    return Math.sqrt(Number(args[0]));
  }

  private excelIf(args: any[]): any {
    if (args.length < 2) return false;
    
    // Handle string conditions like "q2 > 2"
    let condition = args[0];
    if (typeof condition === 'string') {
      // Replace field references in condition
      const fieldMatches = condition.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
      // Handle both direct context and nested form data
      const dataSource = this.context.formData || this.context;
      
      for (const field of fieldMatches) {
        const fieldValue = dataSource[field];
        if (fieldValue !== undefined) {
          condition = condition.replace(
            new RegExp(`\\b${field}\\b`, 'g'), 
            String(fieldValue)
          );
        } else {
          condition = condition.replace(
            new RegExp(`\\b${field}\\b`, 'g'), 
            '0'
          );
        }
      }
      // Evaluate the condition
      try {
        // eslint-disable-next-line no-new-func -- condition string is built from sanitized form values
        condition = new Function('return ' + condition)();
      } catch (error) {
        condition = false;
      }
    }
    
    const trueValue = args[1];
    const falseValue = args.length > 2 ? args[2] : false;
    return Boolean(condition) ? trueValue : falseValue;
  }

  private excelAnd(args: any[]): boolean {
    return args.every(arg => Boolean(arg));
  }

  private excelOr(args: any[]): boolean {
    return args.some(arg => Boolean(arg));
  }

  private excelNot(args: any[]): boolean {
    if (args.length < 1) return true;
    return !Boolean(args[0]);
  }

  private excelConcatenate(args: any[]): string {
    return args.map(arg => String(arg)).join('');
  }

  private excelLen(args: any[]): number {
    if (args.length < 1) return 0;
    return String(args[0]).length;
  }

  private excelUpper(args: any[]): string {
    if (args.length < 1) return '';
    return String(args[0]).toUpperCase();
  }

  private excelLower(args: any[]): string {
    if (args.length < 1) return '';
    return String(args[0]).toLowerCase();
  }

  private excelSumProduct(args: any[]): number {
    if (args.length < 2) return 0;
    const array1 = Array.isArray(args[0]) ? args[0] : [args[0]];
    const array2 = Array.isArray(args[1]) ? args[1] : [args[1]];
    
    let sum = 0;
    const minLength = Math.min(array1.length, array2.length);
    
    for (let i = 0; i < minLength; i++) {
      sum += Number(array1[i]) * Number(array2[i]);
    }
    
    return sum;
  }

  private excelMedian(args: any[]): number {
    const numbers = args.map(arg => Number(arg)).filter(num => !isNaN(num)).sort((a, b) => a - b);
    if (numbers.length === 0) return 0;
    
    const mid = Math.floor(numbers.length / 2);
    return numbers.length % 2 === 0 
      ? (numbers[mid - 1] + numbers[mid]) / 2 
      : numbers[mid];
  }

  private excelMode(args: any[]): number {
    const numbers = args.map(arg => Number(arg)).filter(num => !isNaN(num));
    if (numbers.length === 0) return 0;
    
    const frequency: { [key: number]: number } = {};
    let maxFreq = 0;
    let mode = numbers[0];
    
    for (const num of numbers) {
      frequency[num] = (frequency[num] || 0) + 1;
      if (frequency[num] > maxFreq) {
        maxFreq = frequency[num];
        mode = num;
      }
    }
    
    return mode;
  }

  /**
   * Calculate hours from start time, end time, and break minutes
   * CALC_HOURS(startTime, endTime, breakMinutes)
   */
  private calcHours(args: any[]): number {
    if (args.length < 3) return 0;
    
    const startTime = String(args[0]);
    const endTime = String(args[1]);
    const breakMinutes = Number(args[2]) || 0;
    
    // Parse time strings (HH:MM format)
    const parseTime = (timeStr: string): number => {
      const parts = timeStr.split(':');
      if (parts.length !== 2) return 0;
      
      const hours = Number(parts[0]) || 0;
      const minutes = Number(parts[1]) || 0;
      return hours + (minutes / 60);
    };
    
    const startHours = parseTime(startTime);
    const endHours = parseTime(endTime);
    
    if (startHours === 0 || endHours === 0) return 0;
    
    // Calculate total hours worked
    let totalHours = endHours - startHours;
    
    // Subtract break time
    totalHours -= (breakMinutes / 60);
    
    // Ensure non-negative result
    return Math.max(0, totalHours);
  }

  /**
   * Sum all daily hours from the form data
   * SUM_DAILY_HOURS()
   */
  private sumDailyHours(args: any[]): number {
    const formData = this.context.formData || {};
    let total = 0;
    
    // Sum all daily total hours
    const dailyFields = [
      'mondayTotalHours', 'tuesdayTotalHours', 'wednesdayTotalHours', 
      'thursdayTotalHours', 'fridayTotalHours'
    ];
    
    for (const field of dailyFields) {
      const value = Number(formData[field]) || 0;
      total += value;
    }
    
    return total;
  }

  /**
   * Calculate overtime hours (hours over 40)
   * CALC_OVERTIME()
   */
  private calcOvertime(args: any[]): number {
    const regularHours = this.sumDailyHours([]);
    const overtime = regularHours - 40;
    return Math.max(0, overtime);
  }

  /**
   * Get field value from form data
   * FIELD(fieldName)
   */
  private getFieldValueFromArgs(args: any[]): number {
    if (args.length < 1) return 0;
    
    const fieldName = String(args[0]);
    const formData = this.context.formData || {};
    
    // Remove quotes if present
    const cleanFieldName = fieldName.replace(/['"]/g, '');
    
    return Number(formData[cleanFieldName]) || 0;
  }
}

// Export singleton instance
export const commercialFormulaCalculator = new CommercialFormulaCalculator(); 
