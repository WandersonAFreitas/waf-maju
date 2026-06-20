import React from 'react';

interface SafeTouchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const SafeTouch: React.FC<SafeTouchProps> = ({ children, onClick, className, ...props }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Aciona feedback háptico (vibração de 12ms) se suportado
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch (err) {
        // Ignora erros de vibração silenciosamente (ex: permissões)
      }
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type="button"
      {...props}
      onClick={handleClick}
      className={`focus:outline-none transition-all ${className || ''}`}
      style={{ touchAction: 'manipulation', ...props.style }}
    >
      {children}
    </button>
  );
};
