import { useState } from 'react';
import { getAssetUrl } from '@/lib/assetUrl';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mode?: 'square' | 'rectangular';
}

export default function BrandLogo({ className = '', size = 'md', mode = 'rectangular' }: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);
  const logoUrl = getAssetUrl('assets/MoritzCareHomeLOGO-1.png');

  // Size mappings for square mode (legacy compatibility)
  const squareSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  // Size mappings for rectangular mode (height-driven with auto width)
  const rectangularSizeClasses = {
    sm: 'h-8 w-auto max-w-[120px]',
    md: 'h-12 w-auto max-w-[180px]',
    lg: 'h-16 w-auto max-w-[240px]',
    xl: 'h-24 w-auto max-w-[360px]',
  };

  const sizeClasses = mode === 'square' ? squareSizeClasses : rectangularSizeClasses;

  const handleImageError = () => {
    console.error('Failed to load logo image from:', logoUrl);
    setImageError(true);
  };

  // If image fails to load, show clean text fallback (no broken image icon)
  if (imageError) {
    return (
      <div className={`flex items-center justify-center ${mode === 'square' ? squareSizeClasses[size] : 'h-12'} ${className}`}>
        <span className="text-xs font-bold text-teal-700">MCH</span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt="Moritz Care Home logo"
      className={`${sizeClasses[size]} object-contain ${className}`}
      onError={handleImageError}
    />
  );
}
