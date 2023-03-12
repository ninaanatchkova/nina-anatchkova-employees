import './LoadingSpinner.css';

import React from 'react';

function LoadingSpinner() {
  return <p className="loading-spinner">
      <span className="text-strong">Calculating</span>
      <span className="loading-spinner__dots"></span>
    </p>
}

export default LoadingSpinner;