import React from 'react';
/** variant: primary | secondary | ghost | dark | sunny · size: sm | md | lg */
export function Button({ variant = 'primary', size = 'md', className = '', ...rest }) {
  return <button className={`gh-btn gh-btn--${variant} gh-btn--${size} ${className}`} {...rest} />;
}
