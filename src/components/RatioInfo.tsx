import React from 'react';
import { calculateRatio, deviationFromPhi, isGoldenRatio } from '../utils/phi';

interface RatioInfoProps {
  freq1: number;
  freq2: number;
  freq3: number;
}

export const RatioInfo: React.FC<RatioInfoProps> = ({ freq1, freq2, freq3 }) => {
  const ratio12 = calculateRatio(freq1, freq2);
  const ratio23 = calculateRatio(freq2, freq3);
  const ratio13 = calculateRatio(freq1, freq3);
  
  const deviation12 = deviationFromPhi(ratio12);
  const deviation23 = deviationFromPhi(ratio23);
  const deviation13 = deviationFromPhi(ratio13);
  
  const isGolden12 = isGoldenRatio(ratio12);
  const isGolden23 = isGoldenRatio(ratio23);
  const isGolden13 = isGoldenRatio(ratio13);

  return (
    <div className="ratio-info-bar">
      <div className="ratio-item">
        <span className="ratio-label">f₁/f₂:</span>
        <span className={`ratio-value ${isGolden12 ? 'golden-text' : ''}`}>{ratio12.toFixed(4)}</span>
        <span className="deviation-text">(Δφ: {deviation12.toFixed(4)})</span>
      </div>
      <div className="ratio-item">
        <span className="ratio-label">f₂/f₃:</span>
        <span className={`ratio-value ${isGolden23 ? 'golden-text' : ''}`}>{ratio23.toFixed(4)}</span>
        <span className="deviation-text">(Δφ: {deviation23.toFixed(4)})</span>
      </div>
      <div className="ratio-item">
        <span className="ratio-label">f₁/f₃:</span>
        <span className={`ratio-value ${isGolden13 ? 'golden-text' : ''}`}>{ratio13.toFixed(4)}</span>
        <span className="deviation-text">(Δφ: {deviation13.toFixed(4)})</span>
      </div>
    </div>
  );
};