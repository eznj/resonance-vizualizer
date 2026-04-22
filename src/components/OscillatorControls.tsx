import React from 'react';
import { PHI, calculateRatio, deviationFromPhi, isGoldenRatio } from '../utils/phi';

interface OscillatorControlsProps {
  freq1: number;
  freq2: number;
  freq3: number;
  volume: number;
  mode1: number;
  mode2: number;
  mode3: number;
  gain: number;
  isPlaying: boolean;
  onFreq1Change: (freq: number) => void;
  onFreq2Change: (freq: number) => void;
  onFreq3Change: (freq: number) => void;
  onVolumeChange: (volume: number) => void;
  onMode1Change: (mode: number) => void;
  onMode2Change: (mode: number) => void;
  onMode3Change: (mode: number) => void;
  onGainChange: (gain: number) => void;
  onPlayPause: () => void;
}

export const OscillatorControls: React.FC<OscillatorControlsProps> = ({
  freq1,
  freq2,
  freq3,
  volume,
  mode1,
  mode2,
  mode3,
  gain,
  isPlaying,
  onFreq1Change,
  onFreq2Change,
  onFreq3Change,
  onVolumeChange,
  onMode1Change,
  onMode2Change,
  onMode3Change,
  onGainChange,
  onPlayPause,
}) => {
  const ratio12 = calculateRatio(freq1, freq2);
  const ratio23 = calculateRatio(freq2, freq3);
  const ratio13 = calculateRatio(freq1, freq3);
  
  const deviation12 = deviationFromPhi(ratio12);
  const deviation23 = deviationFromPhi(ratio23);
  const deviation13 = deviationFromPhi(ratio13);
  
  const isGolden12 = isGoldenRatio(ratio12);
  const isGolden23 = isGoldenRatio(ratio23);
  const isGolden13 = isGoldenRatio(ratio13);
  const anyGolden = isGolden12 || isGolden23 || isGolden13;

  const snapToGoldenRatio = () => {
    const newFreq1 = freq2 * PHI;
    const newFreq3 = freq2 / PHI;
    onFreq1Change(Math.round(newFreq1 * 100) / 100);
    onFreq3Change(Math.round(newFreq3 * 100) / 100);
  };

  return (
    <div className="controls">
      <div className="controls-grid">
        <div className="control-section frequency-section">
          <h4>Frequencies</h4>
          <div className="control-group">
            <label htmlFor="freq1">
              Frequency 1: <span className="freq-value">{freq1.toFixed(2)} Hz</span>
            </label>
            <input
              id="freq1"
              type="range"
              min="0"
              max="500"
              step="0.1"
              value={freq1}
              onChange={(e) => onFreq1Change(Number(e.target.value))}
            />
            <input
              type="number"
              min="0"
              max="500"
              step="0.1"
              value={freq1}
              onChange={(e) => onFreq1Change(Number(e.target.value))}
              className="freq-input"
            />
          </div>

          <div className="control-group">
            <label htmlFor="freq2">
              Frequency 2: <span className="freq-value">{freq2.toFixed(2)} Hz</span>
            </label>
            <input
              id="freq2"
              type="range"
              min="0"
              max="500"
              step="0.1"
              value={freq2}
              onChange={(e) => onFreq2Change(Number(e.target.value))}
            />
            <input
              type="number"
              min="0"
              max="500"
              step="0.1"
              value={freq2}
              onChange={(e) => onFreq2Change(Number(e.target.value))}
              className="freq-input"
            />
          </div>

          <div className="control-group">
            <label htmlFor="freq3">
              Frequency 3: <span className="freq-value">{freq3.toFixed(2)} Hz</span>
            </label>
            <input
              id="freq3"
              type="range"
              min="0"
              max="500"
              step="0.1"
              value={freq3}
              onChange={(e) => onFreq3Change(Number(e.target.value))}
            />
            <input
              type="number"
              min="0"
              max="500"
              step="0.1"
              value={freq3}
              onChange={(e) => onFreq3Change(Number(e.target.value))}
              className="freq-input"
            />
          </div>

          <div className="control-group">
            <label htmlFor="volume">
              Volume: <span className="freq-value">{(volume * 100).toFixed(0)}%</span>
            </label>
            <input
              id="volume"
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="control-section mode-section">
          <h4>Cymatic Modes</h4>
          <div className="mode-controls">
          <div className="control-group mode-group">
            <label htmlFor="mode1">
              Mode 1: <span className="mode-value">{mode1}-fold</span>
            </label>
            <input
              id="mode1"
              type="range"
              min="2"
              max="12"
              step="1"
              value={mode1}
              onChange={(e) => onMode1Change(Number(e.target.value))}
              className="mode-slider"
            />
            <input
              type="number"
              min="2"
              max="12"
              step="1"
              value={mode1}
              onChange={(e) => onMode1Change(Number(e.target.value))}
              className="mode-input"
            />
          </div>

          <div className="control-group mode-group">
            <label htmlFor="mode2">
              Mode 2: <span className="mode-value">{mode2}-fold</span>
            </label>
            <input
              id="mode2"
              type="range"
              min="2"
              max="12"
              step="1"
              value={mode2}
              onChange={(e) => onMode2Change(Number(e.target.value))}
              className="mode-slider"
            />
            <input
              type="number"
              min="2"
              max="12"
              step="1"
              value={mode2}
              onChange={(e) => onMode2Change(Number(e.target.value))}
              className="mode-input"
            />
          </div>

          <div className="control-group mode-group">
            <label htmlFor="mode3">
              Mode 3: <span className="mode-value">{mode3}-fold</span>
            </label>
            <input
              id="mode3"
              type="range"
              min="2"
              max="12"
              step="1"
              value={mode3}
              onChange={(e) => onMode3Change(Number(e.target.value))}
              className="mode-slider"
            />
            <input
              type="number"
              min="2"
              max="12"
              step="1"
              value={mode3}
              onChange={(e) => onMode3Change(Number(e.target.value))}
              className="mode-input"
            />
          </div>

          <div className="control-group">
            <label htmlFor="gain">
              Visual Gain: <span className="freq-value">{gain.toFixed(2)}</span>
            </label>
            <input
              id="gain"
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={gain}
              onChange={(e) => onGainChange(Number(e.target.value))}
            />
          </div>
          </div>
        </div>
      </div>

    </div>
  );
};