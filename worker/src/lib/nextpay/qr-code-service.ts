import type { Logger } from "./http-client";

/**
 * QR Code Service handles QR code generation, validation, and display
 */
export class QRCodeService {
  constructor(private logger: Logger) {}

  /**
   * Validates a QR code string
   * @param qrCode - Base64 encoded QR code
   * @returns Validation result
   */
  validateQRCode(qrCode: string): {
    isValid: boolean;
    error?: string;
    size?: number;
  } {
    this.logger.debug("Validating QR code", { 
      hasQrCode: !!qrCode,
      qrCodeLength: qrCode?.length 
    });

    try {
      if (!qrCode) {
        return {
          isValid: false,
          error: "QR code is empty"
        };
      }

      // Check if it's a valid base64 string
      if (!this.isValidBase64(qrCode)) {
        return {
          isValid: false,
          error: "Invalid base64 format"
        };
      }

      // Check minimum size (QR codes should be at least 100x100 pixels)
      const size = this.getQRCodeSize(qrCode);
      if (size < 100) {
        return {
          isValid: false,
          error: "QR code too small",
          size
        };
      }

      return {
        isValid: true,
        size
      };
    } catch (error) {
      this.logger.error("QR code validation failed", { 
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        isValid: false,
        error: "Validation failed"
      };
    }
  }

  /**
   * Generates QR code data URL for display
   * @param qrCode - Base64 encoded QR code
   * @returns Data URL for display
   */
  generateDataURL(qrCode: string): string {
    if (!qrCode) {
      throw new Error("QR code is required");
    }

    // Validate QR code first
    const validation = this.validateQRCode(qrCode);
    if (!validation.isValid) {
      throw new Error(`Invalid QR code: ${validation.error}`);
    }

    return `data:image/png;base64,${qrCode}`;
  }

  /**
   * Gets QR code dimensions
   * @param qrCode - Base64 encoded QR code
   * @returns Dimensions object
   */
  getQRCodeDimensions(qrCode: string): {
    width: number;
    height: number;
    aspectRatio: number;
  } {
    const size = this.getQRCodeSize(qrCode);
    return {
      width: size,
      height: size,
      aspectRatio: 1 // QR codes are always square
    };
  }

  /**
   * Checks if QR code is expired
   * @param expiresAt - Expiration timestamp
   * @returns Expiration status
   */
  isQRCodeExpired(expiresAt: string): boolean {
    try {
      const expirationDate = new Date(expiresAt);
      const now = new Date();
      
      return now >= expirationDate;
    } catch (error) {
      this.logger.error("Failed to check QR code expiration", { 
        error: error instanceof Error ? error.message : String(error),
        expiresAt 
      });
      return true; // Assume expired if we can't parse the date
    }
  }

  /**
   * Gets time remaining until QR code expires
   * @param expiresAt - Expiration timestamp
   * @returns Time remaining in milliseconds
   */
  getTimeRemaining(expiresAt: string): number {
    try {
      const expirationDate = new Date(expiresAt);
      const now = new Date();
      
      return Math.max(0, expirationDate.getTime() - now.getTime());
    } catch (error) {
      this.logger.error("Failed to calculate time remaining", { 
        error: error instanceof Error ? error.message : String(error),
        expiresAt 
      });
      return 0;
    }
  }

  /**
   * Formats time remaining for display
   * @param expiresAt - Expiration timestamp
   * @returns Formatted time string
   */
  formatTimeRemaining(expiresAt: string): string {
    const timeRemaining = this.getTimeRemaining(expiresAt);
    
    if (timeRemaining === 0) {
      return "Expired";
    }

    const minutes = Math.floor(timeRemaining / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Checks if base64 string is valid
   * @param str - String to check
   * @returns true if valid base64
   */
  private isValidBase64(str: string): boolean {
    try {
      // Remove data URL prefix if present
      const base64String = str.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Check if it's valid base64
      const decoded = atob(base64String);
      const encoded = btoa(decoded);
      
      return encoded === base64String;
    } catch {
      return false;
    }
  }

  /**
   * Estimates QR code size from base64 data
   * @param qrCode - Base64 encoded QR code
   * @returns Estimated size in pixels
   */
  private getQRCodeSize(qrCode: string): number {
    try {
      // Remove data URL prefix if present
      const base64String = qrCode.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Decode base64 to get binary data
      const binaryString = atob(base64String);
      
      // For PNG files, we can estimate size from the binary data
      // This is a rough estimation - actual size depends on PNG compression
      const estimatedSize = Math.sqrt(binaryString.length / 4); // Rough estimate
      
      return Math.max(100, Math.min(1000, estimatedSize)); // Clamp between 100-1000
    } catch {
      return 200; // Default size if we can't determine
    }
  }

  /**
   * Generates QR code metadata for display
   * @param qrCode - Base64 encoded QR code
   * @param expiresAt - Expiration timestamp
   * @returns QR code metadata
   */
  generateQRCodeMetadata(qrCode: string, expiresAt: string): {
    dataURL: string;
    dimensions: { width: number; height: number; aspectRatio: number };
    isValid: boolean;
    isExpired: boolean;
    timeRemaining: string;
    validation: { isValid: boolean; error?: string; size?: number };
  } {
    const validation = this.validateQRCode(qrCode);
    const dimensions = this.getQRCodeDimensions(qrCode);
    const isExpired = this.isQRCodeExpired(expiresAt);
    const timeRemaining = this.formatTimeRemaining(expiresAt);

    return {
      dataURL: validation.isValid ? this.generateDataURL(qrCode) : "",
      dimensions,
      isValid: validation.isValid,
      isExpired,
      timeRemaining,
      validation
    };
  }
}
