import { useEffect, useRef, useState } from 'react';

export interface AudioAnalysis {
  analyser: AnalyserNode | null;
  timeData: Float32Array;
  frequencyData: Uint8Array;
}

export function useAudioEngine(freq1: number, freq2: number, freq3: number, volume: number = 0.1) {
  const ctxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const osc3Ref = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis>({
    analyser: null,
    timeData: new Float32Array(0),
    frequencyData: new Uint8Array(0),
  });

  const startAudio = () => {
    if (ctxRef.current && ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }

    if (!ctxRef.current) {
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.value = volume;
      gainRef.current = gain;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const timeData = new Float32Array(analyser.frequencyBinCount);
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);

      gain.connect(analyser);
      analyser.connect(ctx.destination);

      setAudioAnalysis({
        analyser,
        timeData,
        frequencyData,
      });

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      osc1Ref.current = osc1;
      osc2Ref.current = osc2;
      osc3Ref.current = osc3;

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc3.type = 'sine';

      osc1.frequency.value = freq1;
      osc2.frequency.value = freq2;
      osc3.frequency.value = freq3;

      osc1.connect(gain);
      osc2.connect(gain);
      osc3.connect(gain);

      osc1.start();
      osc2.start();
      osc3.start();

      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (osc1Ref.current) {
      osc1Ref.current.stop();
      osc1Ref.current.disconnect();
      osc1Ref.current = null;
    }
    if (osc2Ref.current) {
      osc2Ref.current.stop();
      osc2Ref.current.disconnect();
      osc2Ref.current = null;
    }
    if (osc3Ref.current) {
      osc3Ref.current.stop();
      osc3Ref.current.disconnect();
      osc3Ref.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    setIsPlaying(false);
    setAudioAnalysis({
      analyser: null,
      timeData: new Float32Array(0),
      frequencyData: new Uint8Array(0),
    });
  };

  useEffect(() => {
    if (osc1Ref.current) {
      osc1Ref.current.frequency.value = freq1;
    }
  }, [freq1]);

  useEffect(() => {
    if (osc2Ref.current) {
      osc2Ref.current.frequency.value = freq2;
    }
  }, [freq2]);

  useEffect(() => {
    if (osc3Ref.current) {
      osc3Ref.current.frequency.value = freq3;
    }
  }, [freq3]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return {
    startAudio,
    stopAudio,
    isPlaying,
    audioAnalysis,
  };
}