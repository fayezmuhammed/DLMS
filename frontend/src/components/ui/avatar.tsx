import React from 'react';

export interface AvatarProps {
  className?: string;
  children?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({ className = '', children }) => {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
    >
      {children}
    </div>
  );
};

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({ src, alt = '', ...props }) => {
  if (!src) return null;
  
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      {...props}
    />
  );
};

export interface AvatarFallbackProps {
  children: React.ReactNode;
  className?: string;
}

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-gray-700 ${className}`}
    >
      {children}
    </div>
  );
}; 