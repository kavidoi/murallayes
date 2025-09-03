import { Injectable } from '@nestjs/common';
import { ProductFormat, ProductExtra } from '@prisma/client';

export interface SKUComponents {
  format: ProductFormat;
  brand?: string;
  variant?: string;
  origin?: string;
  extras: ProductExtra[];
}

@Injectable()
export class SKUGeneratorService {
  
  /**
   * Generate SKU based on product classification
   * Format: [FORMAT_CODE] [BRAND] [VARIANT] [ORIGIN] [EXTRA_CODES]
   * Example: 100 DKK KBCH ORI 9
   */
  generateSKU(components: SKUComponents): string {
    const parts: string[] = [];
    
    // 1. Format code (required)
    parts.push(this.getFormatCode(components.format));
    
    // 2. Brand code (optional, 3 chars)
    if (components.brand) {
      parts.push(this.generateBrandCode(components.brand));
    }
    
    // 3. Variant code (optional, 4 chars)
    if (components.variant) {
      parts.push(this.generateVariantCode(components.variant));
    }
    
    // 4. Origin code (optional, 3 chars)
    if (components.origin) {
      parts.push(this.generateOriginCode(components.origin));
    }
    
    // 5. Extra codes (optional, concatenated numbers)
    if (components.extras && components.extras.length > 0) {
      const extraCodes = components.extras
        .map(extra => this.getExtraCode(extra))
        .sort()
        .join('');
      if (extraCodes) {
        parts.push(extraCodes);
      }
    }
    
    return parts.join(' ');
  }
  
  /**
   * Get format code based on ProductFormat enum
   */
  private getFormatCode(format: ProductFormat): string {
    const formatCodes = {
      [ProductFormat.ENVASADOS]: '100',
      [ProductFormat.CONGELADOS]: '200',
      [ProductFormat.FRESCOS]: '300'
    };
    
    return formatCodes[format] || '000';
  }
  
  /**
   * Get extra code based on ProductExtra enum
   */
  private getExtraCode(extra: ProductExtra): string {
    const extraCodes = {
      [ProductExtra.ARTESANAL]: '2',
      [ProductExtra.INTEGRAL]: '3',
      [ProductExtra.LIGHT]: '4',
      [ProductExtra.ORGANICO]: '5',
      [ProductExtra.SIN_GLUTEN]: '6',
      [ProductExtra.KETO]: '7',
      [ProductExtra.VEGANO]: '8',
      [ProductExtra.SIN_AZUCAR]: '9'
    };
    
    return extraCodes[extra] || '';
  }
  
  /**
   * Generate brand code from brand name (3 characters)
   */
  private generateBrandCode(brandName: string): string {
    return brandName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 3)
      .padEnd(3, 'X');
  }
  
  
  /**
   * Generate variant code from variant name (4 characters)
   */
  private generateVariantCode(variantName: string): string {
    return variantName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 4)
      .padEnd(4, 'X');
  }
  
  /**
   * Generate origin code from origin name (3 characters)
   */
  private generateOriginCode(originName: string): string {
    return originName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 3)
      .padEnd(3, 'X');
  }
  
  /**
   * Parse SKU back into components (for validation/editing)
   */
  parseSKU(sku: string): Partial<SKUComponents> {
    const parts = sku.split(' ');
    const result: Partial<SKUComponents> = {};
    
    if (parts.length > 0) {
      // Parse format code
      const formatCode = parts[0];
      result.format = this.parseFormatCode(formatCode);
    }
    
    if (parts.length > 4) {
      // Parse extra codes (last part)
      const extraCodes = parts[parts.length - 1];
      result.extras = this.parseExtraCodes(extraCodes);
    }
    
    return result;
  }
  
  /**
   * Parse format code back to ProductFormat enum
   */
  private parseFormatCode(code: string): ProductFormat | undefined {
    const codeToFormat = {
      '100': ProductFormat.ENVASADOS,
      '200': ProductFormat.CONGELADOS,
      '300': ProductFormat.FRESCOS
    };
    
    return codeToFormat[code];
  }
  
  /**
   * Parse extra codes back to ProductExtra array
   */
  private parseExtraCodes(codes: string): ProductExtra[] {
    const codeToExtra = {
      '2': ProductExtra.ARTESANAL,
      '3': ProductExtra.INTEGRAL,
      '4': ProductExtra.LIGHT,
      '5': ProductExtra.ORGANICO,
      '6': ProductExtra.SIN_GLUTEN,
      '7': ProductExtra.KETO,
      '8': ProductExtra.VEGANO,
      '9': ProductExtra.SIN_AZUCAR
    };
    
    return codes
      .split('')
      .map(code => codeToExtra[code])
      .filter(Boolean);
  }
  
  /**
   * Validate SKU format
   */
  validateSKU(sku: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const parts = sku.split(' ');
    
    // Check minimum parts (format code is required)
    if (parts.length < 1) {
      errors.push('SKU must contain at least a format code');
      return { isValid: false, errors };
    }
    
    // Validate format code
    const formatCode = parts[0];
    if (!/^[123]00$/.test(formatCode)) {
      errors.push('Invalid format code. Must be 100, 200, or 300');
    }
    
    // Validate brand code (if present)
    if (parts.length > 1 && parts[1] && !/^[A-Z0-9]{1,3}$/.test(parts[1])) {
      errors.push('Brand code must be 1-3 alphanumeric characters');
    }
    
    // Validate variant/type code (if present)
    if (parts.length > 2 && parts[2] && !/^[A-Z0-9]{1,4}$/.test(parts[2])) {
      errors.push('Variant/type code must be 1-4 alphanumeric characters');
    }
    
    // Validate origin code (if present)
    if (parts.length > 3 && parts[3] && !/^[A-Z0-9]{1,3}$/.test(parts[3])) {
      errors.push('Origin code must be 1-3 alphanumeric characters');
    }
    
    // Validate extra codes (if present)
    if (parts.length > 4 && parts[4] && !/^[2-9]+$/.test(parts[4])) {
      errors.push('Extra codes must be digits 2-9 only');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get human-readable description of SKU components
   */
  describeSKU(sku: string): string {
    const components = this.parseSKU(sku);
    const parts: string[] = [];
    
    if (components.format) {
      const formatNames = {
        [ProductFormat.ENVASADOS]: 'Envasados',
        [ProductFormat.CONGELADOS]: 'Congelados',
        [ProductFormat.FRESCOS]: 'Frescos'
      };
      parts.push(`Format: ${formatNames[components.format]}`);
    }
    
    if (components.extras && components.extras.length > 0) {
      const extraNames = {
        [ProductExtra.ARTESANAL]: 'Artesanal',
        [ProductExtra.INTEGRAL]: 'Integral',
        [ProductExtra.LIGHT]: 'Light',
        [ProductExtra.ORGANICO]: 'Orgánico',
        [ProductExtra.SIN_GLUTEN]: 'Sin Gluten',
        [ProductExtra.KETO]: 'Keto',
        [ProductExtra.VEGANO]: 'Vegano',
        [ProductExtra.SIN_AZUCAR]: 'Sin Azúcar'
      };
      
      const extraDescriptions = components.extras.map(extra => extraNames[extra]);
      parts.push(`Extras: ${extraDescriptions.join(', ')}`);
    }
    
    return parts.join(' | ');
  }
}
