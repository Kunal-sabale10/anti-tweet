"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Send, ShieldCheck, AlertCircle, Clock, Smile, Image as ImageIcon, BookOpen, Globe, Lock, Users, Star, FileAudio } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { getErrorMessage } from '@/lib/errors';
import GifPicker from '@/components/GifPicker';
import { useLanguage } from '@/lib/LanguageContext';

interface TweetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TweetModal({ isOpen, onClose, onSuccess }: TweetModalProps) {
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Premium Features
  const [additionalTweets, setAdditionalTweets] = useState<string[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  
  // Phase 3 Features
  const [isArticle, setIsArticle] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [audience, setAudience] = useState<'PUBLIC' | 'SUPER_FOLLOWERS' | 'CIRCLE'>('PUBLIC');
  const [communities, setCommunities] = useState<{id: string; name: string}[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  
  // OTP Flow for Audio
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Pickers
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [mediaItems, setMediaItems] = useState<{url: string, type: string}[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const resetState = useCallback(() => {
    if (audioUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setContent('');
    setIsAudioMode(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setIsRecording(false);
    setRecordingTime(0);
    setLoading(false);
    setError('');
    setRequiresOtp(false);
    setOtp('');
    setOtpSent(false);
    setShowEmoji(false);
    setShowGif(false);
    setMediaItems([]);
    setAdditionalTweets([]);
    setShowSchedule(false);
    setScheduledFor('');
    setIsArticle(false);
    setArticleTitle('');
    setAudience('PUBLIC');
    setSelectedCommunity('');
    if (timerRef.current) clearInterval(timerRef.current);
  }, [audioUrl]);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    } else {
      // Load communities when modal opens
      fetch('/api/communities').then(r => r.json()).then(d => setCommunities((d.communities || []).filter((c: any) => c.isMember)));
    }
  }, [isOpen, resetState]);

  const checkAudioTimeWindow = () => {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    
    // IST is UTC + 5:30
    let istMinutes = utcMinutes + 30;
    let istHours = utcHours + 5;
    if (istMinutes >= 60) {
      istHours += 1;
      istMinutes -= 60;
    }
    istHours = istHours % 24;
    
    if (istHours < 14 || istHours >= 19) {
      setError('Audio tweets are only allowed between 2:00 PM and 7:00 PM IST.');
      return false;
    }
    return true;
  };

  const handleStartAudio = async () => {
    setError('');
    if (!checkAudioTimeWindow()) return;
    
    // Trigger OTP flow
    setRequiresOtp(true);
    try {
      const res = await fetch('/api/auth/audio-otp', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to send OTP');
      setOtpSent(true);
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to send OTP'));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mediaItems.length >= 4) { setError('Max 4 items allowed'); return; }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json() as { success: boolean; url: string };
      if (data.success) {
        setMediaItems(prev => [...prev, { url: data.url, type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE' }]);
      }
    } catch (err) {
      setError('Image upload failed');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setError('Audio file exceeds 100MB limit.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio(objectUrl);
    
    // Fallback if metadata doesn't load within 2 seconds
    const timeout = setTimeout(() => {
      setAudioBlob(file);
      setAudioUrl(objectUrl);
      setError('');
    }, 2000);

    audio.onloadedmetadata = () => {
      clearTimeout(timeout);
      if (audio.duration > 300) {
        setError('Audio file must be 5 minutes or less.');
      } else {
        setAudioBlob(file);
        setAudioUrl(objectUrl);
        setError('');
      }
    };

    audio.onerror = () => {
      clearTimeout(timeout);
      // If the browser can't read it, we still allow uploading, 
      // the backend will handle the 100MB limit.
      setAudioBlob(file);
      setAudioUrl(objectUrl);
      setError('');
    };
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        if (blob.size > 100 * 1024 * 1024) {
          setError('Audio file exceeds 100MB limit.');
          return;
        }
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 300) { // 5 minutes limit
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setError('Microphone access denied or error occurred.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content && !audioBlob) return;
    
    setLoading(true);
    setError('');

    try {
      let finalAudioUrl = null;
      
      if (audioBlob) {
        if (!checkAudioTimeWindow()) throw new Error('Audio window closed.');
        const formData = new FormData();
        formData.append('file', audioBlob);
        formData.append('otp', otp);

        const uploadRes = await fetch('/api/tweets/upload-audio', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error);
        finalAudioUrl = uploadData.url;
      }

      const baseTweet = {
        content, 
        audioUrl: finalAudioUrl,
        media: mediaItems,
        audioOtp: audioBlob ? otp : undefined,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
        isArticle,
        articleTitle: isArticle ? articleTitle : undefined,
        isSuperFollowersOnly: audience === 'SUPER_FOLLOWERS',
        communityId: selectedCommunity || undefined,
      };
      
      const requestBody = additionalTweets.length > 0
        ? { tweets: [baseTweet, ...additionalTweets.map(c => ({ content: c }))] }
        : baseTweet;

      const res = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onSuccess();
      onClose();
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to post tweet'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="composer-shell modal-sheet" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel composer-panel modal-panel"
        style={{ width: '100%', maxWidth: '600px', position: 'relative', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Post Anti-Tweet</h2>

          {/* Audience & Article Toggles */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {/* Audience toggle */}
            <button
              type="button"
              onClick={() => setAudience(a => a === 'PUBLIC' ? 'SUPER_FOLLOWERS' : a === 'SUPER_FOLLOWERS' ? 'CIRCLE' : 'PUBLIC')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem',
                borderRadius: '99px', border: '1px solid var(--card-border)', background: 'none', cursor: 'pointer',
                color: audience === 'SUPER_FOLLOWERS' ? '#a855f7' : audience === 'CIRCLE' ? '#10b981' : 'var(--accent)', fontSize: '0.8rem', fontWeight: 600,
              }}
            >
              {audience === 'SUPER_FOLLOWERS' ? <><Star size={13} /> Super Followers</> : audience === 'CIRCLE' ? <><Users size={13} /> Circle</> : <><Globe size={13} /> Everyone</>}
            </button>

            {/* Article mode toggle */}
            <button
              type="button"
              onClick={() => setIsArticle(a => !a)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem',
                borderRadius: '99px', border: '1px solid var(--card-border)', background: 'none', cursor: 'pointer',
                color: isArticle ? 'var(--accent)' : 'var(--muted)', fontSize: '0.8rem', fontWeight: 600,
              }}
            >
              <BookOpen size={13} /> Article
            </button>

            {/* Community selector */}
            {communities.length > 0 && (
              <select
                value={selectedCommunity}
                onChange={e => setSelectedCommunity(e.target.value)}
                style={{ padding: '0.3rem 0.75rem', borderRadius: '99px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: selectedCommunity ? 'var(--accent)' : 'var(--muted)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
              >
                <option value="">+ Post to Community</option>
                {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form className="composer-form" onSubmit={handleSubmit}>
          {/* Article Title field */}
          {isArticle && (
            <input
              className="input-field"
              placeholder="Article title..."
              value={articleTitle}
              onChange={e => setArticleTitle(e.target.value)}
              style={{ width: '100%', fontSize: '1.4rem', fontWeight: 800, background: 'transparent', border: 'none', borderBottom: '1px solid var(--card-border)', borderRadius: 0, paddingLeft: 0, marginBottom: '0.75rem' }}
            />
          )}
          <textarea 
            className="input-field composer-textarea" 
            placeholder={isArticle ? "Write your article..." : "What's happening?"} 
            style={{ width: '100%', minHeight: isArticle ? '250px' : '120px', resize: 'none', background: 'transparent', border: 'none', borderBottom: '1px solid var(--card-border)', borderRadius: 0, paddingLeft: 0, fontSize: '1.1rem' }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {mediaItems.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', width: '100%', marginTop: '1rem' }}>
              {mediaItems.map((item, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)', aspectRatio: '1/1' }}>
                  {item.type === 'VIDEO' ? (
                     <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                     <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <button 
                    type="button"
                    onClick={() => setMediaItems(prev => prev.filter((_, i) => i !== idx))} 
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {additionalTweets.map((tContent, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-20px', top: '-20px', bottom: '20px', width: '2px', background: 'var(--card-border)' }} />
              <textarea 
                className="input-field composer-textarea" 
                placeholder="Add another tweet..." 
                style={{ width: '100%', minHeight: '80px', resize: 'none', background: 'transparent', border: 'none', borderBottom: '1px solid var(--card-border)', borderRadius: 0, paddingLeft: 0, fontSize: '1.1rem' }}
                value={tContent}
                onChange={(e) => {
                  const newT = [...additionalTweets];
                  newT[i] = e.target.value;
                  setAdditionalTweets(newT);
                }}
              />
            </div>
          ))}

          <AnimatePresence>
            {requiresOtp && !isAudioMode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ marginTop: '1rem', background: 'rgba(59, 130, 246, 0.1)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#60a5fa' }}>
                  <ShieldCheck size={20} />
                  <span style={{ fontWeight: 600 }}>Audio Authorization Required</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                  To ensure quality, audio tweets require a one-time verification. Enter the code sent to your email.
                </p>
                {otpSent && (
                  <p style={{ fontSize: '0.8rem', color: '#60a5fa', marginBottom: '1rem' }}>
                    Verification code sent. It stays active for 15 minutes.
                  </p>
                )}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Enter 6-digit OTP" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ flex: 1, textAlign: 'center', letterSpacing: '0.2rem', fontWeight: 700 }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    disabled={otp.length !== 6}
                    onClick={() => setIsAudioMode(true)}
                  >
                    Verify & Unlock
                  </button>
                </div>
              </motion.div>
            )}

            {isAudioMode && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed var(--card-border)' }}
              >
                {!audioUrl ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <motion.div 
                          animate={isRecording ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 1 }}
                          style={{ width: '64px', height: '64px', borderRadius: '50%', background: isRecording ? '#ef4444' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                          onClick={isRecording ? stopRecording : startRecording}
                          title="Record Audio"
                        >
                          {isRecording ? <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '3px' }} /> : <Mic size={32} />}
                        </motion.div>
                        
                        {!isRecording && (
                          <div
                            style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}
                            onClick={() => audioFileInputRef.current?.click()}
                            title="Upload Audio File"
                          >
                            <FileAudio size={28} />
                          </div>
                        )}
                      </div>
                      
                      <input type="file" ref={audioFileInputRef} onChange={handleAudioFileUpload} accept="audio/*" style={{ display: 'none' }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{isRecording ? 'Recording...' : 'Voice Note'}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                          {isRecording ? `${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')} / 5:00` : 'Up to 5 minutes allowed'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <audio src={audioUrl} controls style={{ flex: 1, height: '40px' }} />
                    <button type="button" onClick={() => { setAudioUrl(null); setAudioBlob(null); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>Remove</button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="composer-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!isAudioMode && !requiresOtp && (
                <button 
                  type="button" 
                  className="icon-btn" 
                  onClick={handleStartAudio}
                  title="Audio Tweet (2 PM - 7 PM)"
                  style={{ color: 'var(--accent)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '50%', border: 'none', cursor: 'pointer' }}
                >
                  <Mic size={20} />
                </button>
              )}
              {isAudioMode && (
                <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <ShieldCheck size={16} /> Audio Authorized
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*,video/mp4,video/webm,video/quicktime" style={{ display: 'none' }} />
              <button 
                type="button" 
                className="icon-btn" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                style={{ color: 'var(--muted)', background: 'transparent', padding: '0.5rem', borderRadius: '50%', border: 'none', cursor: uploadingImage ? 'not-allowed' : 'pointer', opacity: uploadingImage ? 0.5 : 1 }}
              >
                <ImageIcon size={20} />
              </button>
              <button 
                type="button" 
                className="icon-btn" 
                onClick={() => { setShowEmoji(!showEmoji); setShowGif(false); }}
                style={{ color: 'var(--muted)', background: showEmoji ? 'rgba(255,255,255,0.1)' : 'transparent', padding: '0.5rem', borderRadius: '50%', border: 'none', cursor: 'pointer' }}
              >
                <Smile size={20} />
              </button>
              <button 
                type="button" 
                className="icon-btn" 
                onClick={() => { setShowGif(!showGif); setShowEmoji(false); }}
                style={{ color: 'var(--muted)', background: showGif ? 'rgba(255,255,255,0.1)' : 'transparent', padding: '0.5rem', borderRadius: '50%', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.7rem' }}
              >
                GIF
              </button>
              <button 
                type="button" 
                className="icon-btn" 
                onClick={() => setShowSchedule(!showSchedule)}
                style={{ color: 'var(--muted)', background: showSchedule ? 'rgba(255,255,255,0.1)' : 'transparent', padding: '0.5rem', borderRadius: '50%', border: 'none', cursor: 'pointer' }}
              >
                <Clock size={20} />
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <AnimatePresence>
                {showSchedule && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '1rem', zIndex: 100, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '1rem', width: '250px' }}
                  >
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Schedule Tweet</label>
                    <input 
                      type="datetime-local" 
                      value={scheduledFor}
                      onChange={e => setScheduledFor(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', fontSize: '0.9rem' }}
                    />
                  </motion.div>
                )}
                {showEmoji && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    style={{ position: 'absolute', bottom: '100%', left: '-100px', marginBottom: '1rem', zIndex: 100 }}
                  >
                    <EmojiPicker theme={Theme.DARK} onEmojiClick={(emoji: EmojiClickData) => setContent(c => c + emoji.emoji)} />
                  </motion.div>
                )}
                {showGif && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    style={{ position: 'absolute', bottom: '100%', left: '-50px', marginBottom: '1rem', zIndex: 100, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '1rem', width: '320px' }}
                  >
                    <GifPicker onSelect={(url) => {
                      if (mediaItems.length < 4) setMediaItems(prev => [...prev, {url, type: 'GIF'}]);
                      setShowGif(false);
                    }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: content.length > 250 ? '#ef4444' : 'var(--muted)', fontSize: '0.85rem' }}>
                {content.length}/280
              </span>
              <button 
                type="button" 
                className="icon-btn" 
                onClick={() => setAdditionalTweets([...additionalTweets, ''])}
                style={{ color: 'var(--accent)', background: 'transparent', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', fontWeight: 800 }}
                title="Add to thread"
              >
                +
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || uploadingImage || (!content && !audioBlob && mediaItems.length === 0) || (isAudioMode && !audioBlob && !isRecording)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', opacity: uploadingImage ? 0.6 : 1 }}
              >
                {loading ? 'Posting...' : scheduledFor ? <><Clock size={18} /> Schedule</> : <><Send size={18} /> {t('post_tweet')}</>}
              </button>
            </div>
          </div>
        </form>

        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <Clock size={12} /> {t('audio_window')}
        </div>
      </motion.div>
    </div>
  );
}
