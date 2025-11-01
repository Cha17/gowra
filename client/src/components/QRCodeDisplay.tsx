'use client';

import { useState, useEffect } from 'react';
import { QrCode, Download, RefreshCw, AlertCircle } from 'lucide-react';

interface QRCodeDisplayProps {
  qrCode: string;
  title?: string;
  subtitle?: string;
  size?: number;
  showDownload?: boolean;
  onDownload?: () => void;
  className?: string;
}

export default function QRCodeDisplay({
  qrCode,
  title = 'Scan QR Code',
  subtitle,
  size = 256,
  showDownload = false,
  onDownload,
  className = '',
}: QRCodeDisplayProps) {
  const [isValid, setIsValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Validate QR code
    if (!qrCode || qrCode.length < 100) {
      setIsValid(false);
    } else {
      setIsValid(true);
    }
  }, [qrCode]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${qrCode}`;
      link.download = 'qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const refreshQRCode = () => {
    setIsLoading(true);
    // This would trigger a QR code refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  if (!isValid) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Invalid QR Code
        </h3>
        <p className="text-gray-600 text-sm">
          The QR code could not be displayed. Please try refreshing.
        </p>
        <button
          onClick={refreshQRCode}
          disabled={isLoading}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh QR Code
        </button>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {subtitle && <p className="text-gray-600 text-sm mb-4">{subtitle}</p>}

      <div className="bg-white rounded-xl p-4 inline-block shadow-lg">
        <img
          src={`data:image/png;base64,${qrCode}`}
          alt="QR Code"
          className="mx-auto"
          style={{ width: size, height: size }}
        />
      </div>

      {showDownload && (
        <button
          onClick={handleDownload}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download QR Code
        </button>
      )}
    </div>
  );
}
