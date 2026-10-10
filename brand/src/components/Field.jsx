import React, { useId } from 'react';
export function TextField({ label, hint, error, multiline = false, rows = 3, ...rest }) {
  const id = useId();
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <label className="gh-field" htmlFor={id}>
      {label && <span className="gh-field__label">{label}</span>}
      <Tag id={id} className="gh-input" rows={multiline ? rows : undefined} aria-invalid={!!error} {...rest} />
      {(error || hint) && <span className={`gh-field__hint ${error ? 'gh-field__hint--error' : ''}`}>{error || hint}</span>}
    </label>
  );
}
