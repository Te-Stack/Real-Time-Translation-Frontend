// src/components/LanguageSelector.jsx
import React from 'react';

export const LanguageSelector = ({ currentLanguage, onChange }) => {
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ja', label: 'Japanese' },
    // Add more languages as needed
  ];
  
  return (
    <div className="language-selector">
      <label htmlFor="language-select">Select language: </label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={(e) => onChange(e.target.value)}
      >
        {languageOptions.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};

