'use client';

import React from 'react';

interface GoongMarkerProps {
  color?: string;
  size?: number;
  className?: string;
}

const GoongMarker: React.FC<GoongMarkerProps> = ({
  color = '#0071e3',
  size = 24,
  className = '',
}) => {
  // This is a visual marker component for use outside the map
  // For actual map markers, use the GoongMap component's markers prop
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          fill={color}
        />
        <circle cx="12" cy="9" r="2.5" fill="white" />
      </svg>
    </div>
  );
};

export default GoongMarker;
