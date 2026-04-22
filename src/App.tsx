import React, { useState } from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import { OscillatorControls } from './components/OscillatorControls';
import { WaveformCanvas } from './components/WaveformCanvas';
import { SpectrumCanvas } from './components/SpectrumCanvas';
import { LissajousCanvas } from './components/LissajousCanvas';
import { CymaticDetailed } from './components/CymaticDetailed';
import { RatioInfo } from './components/RatioInfo';
import './styles.css';

export default function App() {
  const [freq1, setFreq1] = useState(180);
  const [freq2, setFreq2] = useState(111);
  const [freq3, setFreq3] = useState(291.6);
  const [volume, setVolume] = useState(0.1);
  const [mode1, setMode1] = useState(6);
  const [mode2, setMode2] = useState(4);
  const [mode3, setMode3] = useState(8);
  const [gain, setGain] = useState(0.6);
  
  const { startAudio, stopAudio, isPlaying, audioAnalysis } = useAudioEngine(freq1, freq2, freq3, volume);

  const handlePlayPause = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Φ Resonance Visualizer <span className="subtitle">— Explore the Golden Ratio in Sound</span></h1>
      </header>

      <main className="main">
        <div className="viz-row viz-row-top">
          <div className="viz-section viz-compact">
            <h3>Frequency Spectrum</h3>
            {isPlaying ? (
              <SpectrumCanvas audioAnalysis={audioAnalysis} />
            ) : (
              <div className="viz-placeholder">No Signal</div>
            )}
          </div>
          
          <div className="viz-section viz-compact">
            <h3>Lissajous Figure</h3>
            {isPlaying ? (
              <LissajousCanvas freq1={freq1} freq2={freq2} freq3={freq3} />
            ) : (
              <div className="viz-placeholder">No Signal</div>
            )}
          </div>

          <div className="viz-section viz-compact">
            <h3>Cymatic Pattern</h3>
            {isPlaying ? (
              <CymaticDetailed 
                freq1={freq1} 
                freq2={freq2} 
                freq3={freq3} 
                mode1={mode1}
                mode2={mode2}
                mode3={mode3}
                gain={gain}
              />
            ) : (
              <div className="viz-placeholder">No Signal</div>
            )}
          </div>

          <div className="viz-section viz-compact">
            <h3>Waveform</h3>
            {isPlaying ? (
              <WaveformCanvas audioAnalysis={audioAnalysis} />
            ) : (
              <div className="viz-placeholder">No Signal</div>
            )}
          </div>
        </div>
        
        <div className="ratio-controls-bar">
          <div className="control-buttons-inline">
            <button onClick={handlePlayPause} className="play-button">
              {isPlaying ? 'Stop' : 'Start'}
            </button>
            <button 
              onClick={() => {
                const newFreq1 = freq2 * 1.618;
                const newFreq3 = freq2 / 1.618;
                setFreq1(Math.round(newFreq1 * 100) / 100);
                setFreq3(Math.round(newFreq3 * 100) / 100);
              }} 
              className="snap-button"
            >
              Snap to φ
            </button>
          </div>
          <RatioInfo freq1={freq1} freq2={freq2} freq3={freq3} />
        </div>

        <OscillatorControls
          freq1={freq1}
          freq2={freq2}
          freq3={freq3}
          volume={volume}
          mode1={mode1}
          mode2={mode2}
          mode3={mode3}
          gain={gain}
          isPlaying={isPlaying}
          onFreq1Change={setFreq1}
          onFreq2Change={setFreq2}
          onFreq3Change={setFreq3}
          onVolumeChange={setVolume}
          onMode1Change={setMode1}
          onMode2Change={setMode2}
          onMode3Change={setMode3}
          onGainChange={setGain}
          onPlayPause={handlePlayPause}
        />

      </main>

      <footer className="footer">
        <p>f₁ = {freq1.toFixed(2)} Hz | f₂ = {freq2.toFixed(2)} Hz | f₃ = {freq3.toFixed(2)} Hz | φ ≈ 1.618</p>
      </footer>
    </div>
  );
}