import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Volume2, Sparkles, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AudioWaveVisualizer = ({ onRecordingComplete }) => {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [micError, setMicError] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);

  // Formatting time into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Audio Recording & Web Audio API Visualizer
  const startRecording = async () => {
    setMicError(false);
    setAnalysisResult(null);
    setRecordingTime(0);

    // Start timer immediately
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsRecording(true);

      // Defer canvas draw to ensure DOM state has updated (isRecording=true renders canvas)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => drawCanvas());
      });
    } catch (err) {
      console.warn('Microphone access denied or unavailable, using animated fallback:', err.message);
      // Fallback: simulated animated visualizer (no real audio)
      setIsRecording(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => drawFallbackCanvas());
      });
    }
  };


  // Stop Recording
  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    // Trigger AI Recitation Evaluation simulation
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      const score = Math.floor(88 + Math.random() * 11); // 88% to 98%
      const result = {
        score,
        versesEvaluated: 3,
        fluencyScore: 'ممتازجداً (96%)',
        tajweedScore: 'مقبول مع إظهار النون الساكنة (92%)',
        makharijScore: 'مخارج الحروف دقيقة (98%)',
        feedback: 'تلاوة مباركة وخاشعة! حافظ على مد الوقف عند رأس الآية والالتزام بغنة الإخفاء.'
      };
      setAnalysisResult(result);
      if (onRecordingComplete) onRecordingComplete(result);
    }, 1800);
  };

  // Canvas Web Audio Live Renderer
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      // Calculate audio average volume level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      setAudioLevel(Math.min(100, Math.round((avg / 255) * 100)));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

        // Gradient color for waveform
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#10B981');
        gradient.addColorStop(0.5, '#34D399');
        gradient.addColorStop(1, '#6EE7B7');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, canvas.height / 2 - barHeight / 2, barWidth - 3, Math.max(6, barHeight), 4);
        ctx.fill();

        x += barWidth + 2;
      }
    };

    render();
  };

  // Fallback visualizer if real microphone stream isn't connected
  const drawFallbackCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let phase = 0;

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      phase += 0.1;
      setAudioLevel(Math.floor(40 + Math.sin(phase) * 35));

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const numBars = 32;
      const barWidth = canvas.width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        const h = Math.abs(Math.sin(phase + i * 0.2)) * canvas.height * 0.75 + 10;
        const x = i * (barWidth + 2);

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#10B981');
        gradient.addColorStop(1, '#34D399');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, canvas.height / 2 - h / 2, barWidth, h, 4);
        ctx.fill();
      }
    };

    render();
  };

  // Clean up timers & context on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div style={{
      padding: '24px',
      borderRadius: '24px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-soft)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: isRecording ? 'rgba(239, 68, 68, 0.15)' : 'var(--primary-light)',
            color: isRecording ? '#EF4444' : 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}>
            <Mic size={24} className={isRecording ? 'pulse-icon' : ''} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              {t('recitation_title')}
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {t('recitation_sub')}
            </span>
          </div>
        </div>

        {/* Recording Timer Badge */}
        {isRecording && (
          <div style={{
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            fontWeight: 'bold',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              display: 'inline-block',
              animation: 'pulse 1s infinite'
            }} />
            {t('recitation_live_mic')} • {formatTime(recordingTime)}
          </div>
        )}
      </div>

      {/* Waveform Visualizer Canvas Display Box */}
      <div style={{
        position: 'relative',
        height: '110px',
        borderRadius: '16px',
        background: 'rgba(15, 23, 42, 0.95)',
        border: `1.5px solid ${isRecording ? '#10B981' : 'rgba(255, 255, 255, 0.1)'}`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isRecording ? '0 0 20px rgba(16, 185, 129, 0.25)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={100}
          style={{ width: '100%', height: '100%', display: isRecording ? 'block' : 'none' }}
        />

        {!isRecording && !isAnalyzing && (
          <div style={{ color: '#94A3B8', fontSize: '14px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <Volume2 size={24} style={{ opacity: 0.6 }} />
            <span>{t('recitation_wave_label')}</span>
          </div>
        )}

        {isAnalyzing && (
          <div style={{ color: '#34D399', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RefreshCw size={20} className="spin-icon" />
            <span>{t('recitation_analyzing')}</span>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isAnalyzing}
              style={{
                padding: '12px 26px',
                borderRadius: '14px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <Mic size={19} />
              {t('recitation_start')}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              style={{
                padding: '12px 26px',
                borderRadius: '14px',
                background: '#EF4444',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <Square size={18} />
              {t('recitation_stop')}
            </button>
          )}
        </div>

        {/* Live Input Level Meter */}
        {isRecording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '200px' }}>
            <Volume2 size={16} style={{ color: 'var(--primary)' }} />
            <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${audioLevel}%`,
                background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                borderRadius: '4px',
                transition: 'width 0.1s linear'
              }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{audioLevel}%</span>
          </div>
        )}
      </div>

      {/* AI Recitation Analysis Results Report Card */}
      {analysisResult && (
        <div style={{
          marginTop: '10px',
          padding: '20px 24px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.04) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={22} style={{ color: 'var(--primary)' }} />
              <h5 style={{ margin: 0, fontSize: '16px', color: 'var(--primary)', fontWeight: 'bold' }}>
                {t('recitation_score_title')}
              </h5>
            </div>
            <span style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'var(--primary)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {t('recitation_accuracy')}: {analysisResult.score}%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
              <b>الطلاقة ومتابعة النسق:</b> {analysisResult.fluencyScore}
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
              <b>أحكام التجويد:</b> {analysisResult.tajweedScore}
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
              <b>سلامة المخارج:</b> {analysisResult.makharijScore}
            </div>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-primary)', background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: '10px', borderRight: '4px solid var(--primary)' }}>
            💡 <b>ملاحظة وتوصية الذكاء الاصطناعي:</b> {analysisResult.feedback}
          </div>
        </div>
      )}
    </div>
  );
};
