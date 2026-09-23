import { useState, useRef, useEffect, useCallback } from 'react';

export function useRecitationRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptBufferRef = useRef('');

  const clearResult = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
    setLiveTranscript('');
    setSaveSuccess(false);
    setDuration(0);
    transcriptBufferRef.current = '';
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setAnalysisResult(null);
    setLiveTranscript('');
    setSaveSuccess(false);
    setDuration(0);
    transcriptBufferRef.current = '';
    audioChunksRef.current = [];

    // 1. Initialize Web Speech Recognition if available (Arabic)
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript + ' ';
          }
          const cleanText = currentText.trim();
          transcriptBufferRef.current = cleanText;
          setLiveTranscript(cleanText);
        };

        recognition.onerror = (e) => {
          console.warn('[RecitationRecorder] SpeechRecognition event:', e.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (speechErr) {
      console.warn('[RecitationRecorder] SpeechRecognition start notice:', speechErr);
    }

    // 2. Initialize MediaRecorder for audio recording
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('المتصفح لا يدعم الوصول المباشر إلى الميكروفون أو يحتاج فتح التطبيق في نافذة مستقلة.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''));

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      let msg = 'تعذر الوصول إلى الميكروفون. يرجى منح إذن الميكروفون من إعدادات المتصفح.';
      if (err.name === 'NotAllowedError') {
        msg = 'تم رفض إذن الميكروفون. يُرجى السماح بالوصول إلى الميكروفون للمتابعة.';
      } else if (err.name === 'NotFoundError') {
        msg = 'لم يتم العثور على ميكروفون متصل بجهازك.';
      }
      setError(msg);
      setIsRecording(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    }
  }, []);

  const stopAndAnalyze = useCallback(async (expectedText, meta = {}) => {
    if (!isRecording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    setIsRecording(false);
    setIsAnalyzing(true);
    setError(null);
    setSaveSuccess(false);

    const speechText = transcriptBufferRef.current.trim();

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;

      const finishAnalysis = async (base64Audio = null) => {
        try {
          const payload = {
            expectedText,
            ayahs: meta.ayahs || undefined,
            isFullPage: Boolean(meta.isFullPage),
            spokenText: speechText || undefined,
            audioBase64: base64Audio || undefined,
            autoSave: true,
            userId: meta.userId,
            pageNumber: meta.pageNumber,
            surahNumber: meta.surahNumber,
            surahName: meta.surahName,
            ayahNumber: meta.ayahNumber,
            type: 'voice'
          };

          const res = await fetch('/api/ai/recitation-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.message || 'تعذر تصحيح التلاوة.');
          }

          setAnalysisResult(data);
          setSaveSuccess(true);
          setIsAnalyzing(false);

          // Update local review cache for the Quran Map
          if (meta.pageNumber && meta.userId) {
            try {
              const key = `ma7fath_${meta.userId}_quran_page_reviews`;
              const cached = JSON.parse(localStorage.getItem(key) || '{}');
              cached[meta.pageNumber] = {
                status: data.accuracy >= 90 ? 'excellent' : (data.accuracy >= 75 ? 'review' : 'weak'),
                score: data.accuracy,
                lastReviewed: 'اليوم',
                errorsCount: data.stats?.errorCount || 0
              };
              localStorage.setItem(key, JSON.stringify(cached));
            } catch (e) {}
          }

          resolve(data);
        } catch (apiErr) {
          console.error('API Error during analysis:', apiErr);
          setError(apiErr.message || 'حدث خطأ أثناء التواصل مع خادم تصحيح التلاوة.');
          setIsAnalyzing(false);
          resolve(null);
        }
      };

      if (!recorder || recorder.state === 'inactive') {
        if (speechText) {
          finishAnalysis(null);
        } else {
          setError('لم يتم التقاط صوت كافٍ، يرجى المحاولة والتسميع بوضوح.');
          setIsAnalyzing(false);
          resolve(null);
        }
        return;
      }

      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          if (audioBlob.size > 200) {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
              finishAnalysis(reader.result);
            };
          } else if (speechText) {
            finishAnalysis(null);
          } else {
            throw new Error('التسجيل الصوتي قصير جداً، يرجى التسميع بوضوح والمحاولة ثانية.');
          }
        } catch (err) {
          console.error('Recording processing error:', err);
          if (speechText) {
            finishAnalysis(null);
          } else {
            setError(err.message || 'تعذر معالجة التسجيل الصوتي.');
            setIsAnalyzing(false);
            resolve(null);
          }
        }
      };

      try {
        recorder.stop();
      } catch (e) {
        if (speechText) finishAnalysis(null);
      }
    });
  }, [isRecording]);

  // Evaluate text recitation directly (e.g. typing or pasting from memory)
  const evaluateTextRecitation = useCallback(async (spokenText, expectedText, meta = {}) => {
    if (!spokenText || !spokenText.trim()) {
      setError('يرجى إدخال النص المنطوق أو المكتوب للمقارنة والتصحيح.');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        expectedText,
        ayahs: meta.ayahs || undefined,
        isFullPage: Boolean(meta.isFullPage),
        spokenText: spokenText.trim(),
        autoSave: true,
        userId: meta.userId,
        pageNumber: meta.pageNumber,
        surahNumber: meta.surahNumber,
        surahName: meta.surahName,
        ayahNumber: meta.ayahNumber,
        type: 'text'
      };

      const res = await fetch('/api/ai/recitation-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'تعذر فحص التسميع.');
      }

      setAnalysisResult(data);
      setSaveSuccess(true);
      setIsAnalyzing(false);

      if (meta.pageNumber && meta.userId) {
        try {
          const key = `ma7fath_${meta.userId}_quran_page_reviews`;
          const cached = JSON.parse(localStorage.getItem(key) || '{}');
          cached[meta.pageNumber] = {
            status: data.accuracy >= 90 ? 'excellent' : (data.accuracy >= 75 ? 'review' : 'weak'),
            score: data.accuracy,
            lastReviewed: 'اليوم',
            errorsCount: data.stats?.errorCount || 0
          };
          localStorage.setItem(key, JSON.stringify(cached));
        } catch (e) {}
      }

      return data;
    } catch (err) {
      console.error('Evaluate text recitation error:', err);
      setError(err.message || 'حدث خطأ أثناء فحص وتصحيح التسميع.');
      setIsAnalyzing(false);
      return null;
    }
  }, []);

  // Explicit save of current analysis result
  const saveCurrentResult = useCallback(async (meta = {}) => {
    if (!analysisResult) return false;
    setIsSaving(true);
    try {
      const payload = {
        userId: meta.userId || 'demo_user_123',
        pageNumber: Number(meta.pageNumber) || 1,
        surahNumber: Number(meta.surahNumber) || 1,
        surahName: meta.surahName || 'سورة الشريفة',
        ayahNumber: meta.isFullPage ? null : (Number(meta.ayahNumber) || 1),
        isFullPage: Boolean(meta.isFullPage),
        accuracy: analysisResult.accuracy,
        stats: analysisResult.stats,
        results: analysisResult.results,
        ayahBreakdown: analysisResult.ayahBreakdown || [],
        transcribedText: analysisResult.transcribedText || analysisResult.transcribedSpoken,
        expectedText: analysisResult.originalExpected,
        type: meta.type || 'voice'
      };

      const res = await fetch('/api/recitation/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        if (meta.pageNumber && meta.userId) {
          try {
            const key = `ma7fath_${meta.userId}_quran_page_reviews`;
            const cached = JSON.parse(localStorage.getItem(key) || '{}');
            cached[meta.pageNumber] = {
              status: analysisResult.accuracy >= 90 ? 'excellent' : (analysisResult.accuracy >= 75 ? 'review' : 'weak'),
              score: analysisResult.accuracy,
              lastReviewed: 'اليوم',
              errorsCount: analysisResult.stats?.errorCount || 0
            };
            localStorage.setItem(key, JSON.stringify(cached));
          } catch (e) {}
        }
      }
      setIsSaving(false);
      return data.success;
    } catch (e) {
      console.error('Failed to save recitation:', e);
      setIsSaving(false);
      return false;
    }
  }, [analysisResult]);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setIsAnalyzing(false);
    setDuration(0);
    setLiveTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isRecording,
    isAnalyzing,
    isSaving,
    duration,
    error,
    liveTranscript,
    analysisResult,
    saveSuccess,
    startRecording,
    stopAndAnalyze,
    evaluateTextRecitation,
    saveCurrentResult,
    cancelRecording,
    clearResult,
    setAnalysisResult
  };
}
