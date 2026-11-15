import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  QrCode,
  Download,
  Grid,
  FileText,
  Play,
  Pause,
  Copy,
  Check,
  X,
  Share2,
  Sparkles,
  HelpCircle,
  RotateCcw,
  List
} from 'lucide-react';
import slidesData from './slidesData.json';

interface Slide {
  id: number;
  title: string;
  image: string;
  thumbnail: string;
  text: string;
  width: number;
  height: number;
}

export default function App() {
  const slides: Slide[] = slidesData;
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'slide' | 'scroll'>('slide');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [currentUrl, setCurrentUrl] = useState<string>('https://biology-presentation-beta.vercel.app');
  const [customQrUrl, setCustomQrUrl] = useState<string>('https://biology-presentation-beta.vercel.app');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize live URL for QR code
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.href) {
      const cleanUrl = window.location.origin + window.location.pathname;
      setCurrentUrl(cleanUrl);
      setCustomQrUrl(cleanUrl);
    }
  }, []);

  // Preload neighboring slides for instant switching
  useEffect(() => {
    if (viewMode !== 'slide') return;
    const nextIdx = (currentIndex + 1) % slides.length;
    const prevIdx = (currentIndex - 1 + slides.length) % slides.length;
    const nextImg = new Image();
    nextImg.src = slides[nextIdx].image;
    const prevImg = new Image();
    prevImg.src = slides[prevIdx].image;
  }, [currentIndex, slides, viewMode]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setImageError(false);
      setCurrentIndex(index);
      if (viewMode === 'scroll') {
        const el = document.getElementById(`slide-anchor-${index + 1}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [slides.length, viewMode]);

  const nextSlide = useCallback(() => {
    setImageError(false);
    setCurrentIndex((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setImageError(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Autoplay effect
  useEffect(() => {
    if (!isAutoPlay || viewMode !== 'slide') return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= slides.length - 1) {
          setIsAutoPlay(false);
          return prev;
        }
        return prev + 1;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlay, slides.length, viewMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showQrModal || showNotes || showThumbnails || showHelp) {
        if (e.key === 'Escape') {
          setShowQrModal(false);
          setShowNotes(false);
          setShowThumbnails(false);
          setShowHelp(false);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(slides.length - 1);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'q':
        case 'Q':
          e.preventDefault();
          setShowQrModal(true);
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          setShowThumbnails((prev) => !prev);
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          setShowNotes((prev) => !prev);
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          setIsAutoPlay((prev) => !prev);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setViewMode((prev) => (prev === 'slide' ? 'scroll' : 'slide'));
          break;
        case '?':
          e.preventDefault();
          setShowHelp(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, goToSlide, slides.length, showQrModal, showNotes, showThumbnails, showHelp, viewMode]);

  // Fullscreen toggle with fallback
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      try {
        setIsFullscreen(Boolean(document.fullscreenElement));
      } catch {
        // ignore
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Controls visibility
  const wakeControls = () => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isFullscreen) {
        setIsControlsVisible(false);
      }
    }, 4500);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    wakeControls();
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null || viewMode === 'scroll') return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleCopyLink = () => {
    const urlToCopy = customQrUrl || currentUrl;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(urlToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  };

  const currentSlide = slides[currentIndex];

  return (
    <div
      ref={containerRef}
      onMouseMove={wakeControls}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[100dvh] min-h-[100dvh] bg-[#07130e] text-slate-100 flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[20%] w-[450px] h-[450px] rounded-full bg-[#2d6a4f] blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[550px] h-[550px] rounded-full bg-[#1b4332] blur-[150px]" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header
        className={`relative z-20 flex-shrink-0 flex items-center justify-between px-3 md:px-6 py-2 bg-[#091a13]/95 backdrop-blur-md border-b border-[#2d6a4f]/40 transition-all duration-300 ${
          !isControlsVisible && isFullscreen ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Left: Branding & current title */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-400">
            <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/40">
              Nhóm 1
            </span>
            <span className="hidden sm:inline-block text-xs text-emerald-300/40">|</span>
            <h1 className="hidden sm:inline-block text-xs md:text-sm font-medium text-slate-200 truncate max-w-[200px] md:max-w-md">
              {currentSlide.title}
            </h1>
          </div>
        </div>

        {/* Center: Slide counter / Mode Switcher */}
        <div className="flex items-center gap-2">
          {viewMode === 'slide' ? (
            <div className="flex items-center gap-1 bg-[#0e2a1e]/90 border border-emerald-600/30 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-300">
              <span className="text-emerald-400 font-bold">{String(currentIndex + 1).padStart(2, '0')}</span>
              <span className="text-emerald-600/80">/</span>
              <span className="text-slate-400">{String(slides.length).padStart(2, '0')}</span>
            </div>
          ) : (
            <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              Chế độ cuộn đọc (18 trang)
            </span>
          )}

          {/* Mode Toggle Button: Slide vs Scroll */}
          <button
            onClick={() => setViewMode((prev) => (prev === 'slide' ? 'scroll' : 'slide'))}
            title={viewMode === 'slide' ? 'Đổi sang cuộn đọc danh sách (M)' : 'Đổi sang trình chiếu từng slide (M)'}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700/40 transition-colors"
          >
            {viewMode === 'slide' ? <List className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{viewMode === 'slide' ? 'Cuộn đọc' : 'Trình chiếu'}</span>
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* QR Button (Highlighted) */}
          <button
            onClick={() => setShowQrModal(true)}
            title="Quét mã QR để mở trên điện thoại (Q)"
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-md shadow-emerald-950/40 transition-all active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="text-[11px] md:text-xs">Mã QR</span>
          </button>

          {/* Download Original PDF */}
          <a
            href="/slides/te-bao-thuc-vat-nhom-1.pdf"
            download="te-bao-thuc-vat-nhom-1.pdf"
            title="Tải bài thuyết trình PDF gốc"
            className="hidden sm:flex items-center gap-1 p-1.5 md:px-2.5 md:py-1.5 text-xs rounded-lg bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-300 border border-emerald-700/40 transition-colors"
          >
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden md:inline">Tải PDF</span>
          </a>

          {/* Grid View Button */}
          <button
            onClick={() => setShowThumbnails((prev) => !prev)}
            title="Xem danh sách 18 slide (G)"
            className={`p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-900/40 transition-colors ${
              showThumbnails ? 'bg-emerald-800/60 text-white' : ''
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Notes Button */}
          <button
            onClick={() => setShowNotes((prev) => !prev)}
            title="Xem nội dung chi tiết / Ghi chú (N)"
            className={`p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-900/40 transition-colors ${
              showNotes ? 'bg-emerald-800/60 text-white' : ''
            }`}
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Auto play button */}
          {viewMode === 'slide' && (
            <button
              onClick={() => setIsAutoPlay((prev) => !prev)}
              title={isAutoPlay ? 'Tạm dừng tự động chạy (A)' : 'Tự động chạy bài thuyết trình (A)'}
              className={`hidden sm:flex p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-900/40 transition-colors ${
                isAutoPlay ? 'bg-emerald-500 text-black' : ''
              }`}
            >
              {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thoát toàn màn hình (F)' : 'Toàn màn hình (F)'}
            className="p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-900/40 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Help Button */}
          <button
            onClick={() => setShowHelp(true)}
            title="Phím tắt & Hướng dẫn (?)"
            className="hidden md:block p-1.5 rounded-lg text-emerald-400/80 hover:bg-emerald-900/40 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      {viewMode === 'slide' ? (
        /* SLIDE PRESENTATION VIEW */
        <main className="relative flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
          <div className="relative w-full h-full max-w-[1920px] flex items-center justify-center">
            {/* Left Click Area for Prev Slide */}
            <div
              onClick={prevSlide}
              title="Slide trước (←)"
              className="group absolute left-0 top-0 bottom-0 w-[20%] cursor-pointer flex items-center justify-start pl-2 sm:pl-4 transition-all duration-200 z-10"
            >
              <div className="p-2 sm:p-3 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            {/* Slide Image with Native Aspect Ratio */}
            {!imageError ? (
              <img
                key={currentSlide.id}
                src={currentSlide.image}
                alt={currentSlide.title}
                onError={() => setImageError(true)}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border border-emerald-600/30 select-none pointer-events-none transition-opacity duration-200"
                style={{ display: 'block' }}
                loading="eager"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-black/50 border border-emerald-700/50 rounded-2xl text-center max-w-sm">
                <p className="text-sm text-red-300 mb-3">Không thể tải slide #{currentSlide.id}</p>
                <button
                  onClick={() => {
                    setImageError(false);
                    goToSlide(currentIndex);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Thử tải lại</span>
                </button>
              </div>
            )}

            {/* Right Click Area for Next Slide */}
            <div
              onClick={nextSlide}
              title="Slide tiếp (→ hoặc Space)"
              className="group absolute right-0 top-0 bottom-0 w-[20%] cursor-pointer flex items-center justify-end pr-2 sm:pr-4 transition-all duration-200 z-10"
            >
              <div className="p-2 sm:p-3 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* CONTINUOUS SCROLL VIEW (FOR EASY READING ON PHONE) */
        <main className="relative flex-1 min-h-0 w-full overflow-y-auto p-3 sm:p-6 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {slides.map((s, idx) => (
              <div
                key={s.id}
                id={`slide-anchor-${s.id}`}
                className="bg-[#0b2016] rounded-xl overflow-hidden border border-emerald-700/40 shadow-xl"
              >
                <div className="px-4 py-2 bg-[#081811] border-b border-emerald-800/40 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">Trang {idx + 1} / {slides.length}</span>
                  <span className="text-slate-300 font-medium">{s.title}</span>
                </div>
                <img
                  src={s.image}
                  alt={s.title}
                  className="w-full h-auto object-contain select-none"
                  loading="lazy"
                />
                {s.text && (
                  <div className="p-3 text-xs text-slate-300 border-t border-emerald-900/50 bg-[#07130e]/80 whitespace-pre-line">
                    {s.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      )}

      {/* BOTTOM CONTROLS & TIMELINE (IN SLIDE MODE) */}
      {viewMode === 'slide' && (
        <footer
          className={`relative z-20 flex-shrink-0 px-3 md:px-6 py-2 bg-[#091a13]/95 backdrop-blur-md border-t border-[#2d6a4f]/40 flex flex-col gap-1.5 transition-all duration-300 ${
            !isControlsVisible && isFullscreen ? 'opacity-0 translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Progress Bar with clickable segments */}
          <div className="w-full flex items-center gap-1 h-2 cursor-pointer group py-0.5">
            {slides.map((s, idx) => {
              const isActive = idx === currentIndex;
              const isPassed = idx < currentIndex;
              return (
                <div
                  key={s.id}
                  onClick={() => goToSlide(idx)}
                  title={`Slide ${idx + 1}: ${s.title}`}
                  className={`relative flex-1 h-1.5 md:h-2 rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-400 ring-2 ring-emerald-300/60 scale-y-125'
                      : isPassed
                      ? 'bg-emerald-700 hover:bg-emerald-600'
                      : 'bg-emerald-950/80 hover:bg-emerald-900/60'
                  }`}
                />
              );
            })}
          </div>

          {/* Footer controls row */}
          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0e2a1e] border border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/60 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px] md:text-xs">Trước</span>
              </button>
              <button
                onClick={nextSlide}
                disabled={currentIndex === slides.length - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0e2a1e] border border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/60 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <span className="text-[11px] md:text-xs">Sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-emerald-400/70 text-[11px] md:text-xs">
              <span className="truncate max-w-[280px] text-slate-300 font-medium">
                #{currentIndex + 1}. {currentSlide.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQrModal(true)}
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 flex items-center gap-1 text-[11px] md:text-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Chia sẻ QR</span>
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* QR CODE SHARING MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-[#0a1f16] border border-emerald-500/40 rounded-2xl p-5 shadow-2xl flex flex-col items-center text-center">
            {/* Close button */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-emerald-900/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 mb-2">
              <QrCode className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white mb-1">
              Quét mã QR xem bài thuyết trình
            </h2>
            <p className="text-[11px] text-emerald-300/80 mb-3 max-w-xs">
              Mở camera điện thoại hoặc Zalo để quét và theo dõi bài giảng trực tiếp
            </p>

            {/* Static QR Image Card */}
            <div className="p-3 bg-white rounded-xl shadow-lg border-4 border-emerald-500/30 mb-3 flex flex-col items-center justify-center">
              <img
                src="/qr-code.png"
                alt="QR Code"
                className="w-48 h-48 object-contain"
              />
              <span className="text-[10px] text-gray-700 mt-1 font-semibold uppercase tracking-wider">
                Nhóm 1 • Tế bào thực vật
              </span>
            </div>

            {/* URL input field */}
            <div className="w-full flex items-center gap-1.5 mb-3">
              <input
                type="text"
                readOnly
                value={customQrUrl || currentUrl}
                className="flex-1 bg-black/40 border border-emerald-700/50 text-[11px] text-slate-200 rounded-lg px-2.5 py-2 outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] px-3 py-2 rounded-lg font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Chép'}</span>
              </button>
            </div>

            {/* Action buttons */}
            <div className="w-full flex gap-2">
              <a
                href="/qr-code.png"
                download="QR-Te-Bao-Thuc-Vat-Nhom-1.png"
                className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-600/40 text-emerald-200 text-xs font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Tải ảnh QR</span>
              </a>
              <button
                onClick={() => setShowQrModal(false)}
                className="py-2 px-4 rounded-lg bg-emerald-700/30 hover:bg-emerald-700/50 text-slate-300 text-xs font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THUMBNAILS GRID DRAWER / MODAL */}
      {showThumbnails && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#07130e]/95 backdrop-blur-xl animate-in fade-in duration-200 p-4 md:p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-emerald-800/40 mb-4">
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm md:text-base font-bold text-white">Danh sách 18 slide thuyết trình</h2>
            </div>
            <button
              onClick={() => setShowThumbnails(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-emerald-900/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 flex-1">
            {slides.map((s, idx) => {
              const isSelected = idx === currentIndex && viewMode === 'slide';
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    goToSlide(idx);
                    setShowThumbnails(false);
                  }}
                  className={`group relative flex flex-col bg-[#0d2319] rounded-xl overflow-hidden cursor-pointer border transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-900/50 scale-[1.02]'
                      : 'border-emerald-800/40 hover:border-emerald-600/70 hover:scale-[1.01]'
                  }`}
                >
                  <div className="relative aspect-video bg-black/60 overflow-hidden">
                    <img
                      src={s.thumbnail}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm text-[10px] font-bold text-emerald-300 px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </div>
                  </div>
                  <div className="p-2 text-left">
                    <h3 className="text-[11px] font-medium text-slate-200 line-clamp-2 leading-tight">
                      {s.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NOTES / TRANSCRIPT DRAWER */}
      {showNotes && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#091a13]/95 backdrop-blur-xl border-l border-emerald-700/40 p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-800/40 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Nội dung Slide {currentIndex + 1}</h2>
            </div>
            <button
              onClick={() => setShowNotes(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-emerald-900/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs leading-relaxed text-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Tiêu đề:</span>
              <p className="text-xs font-semibold text-white mt-0.5">{currentSlide.title}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Nội dung thuyết minh:</span>
              <div className="mt-1 p-3 bg-black/40 rounded-xl border border-emerald-900/60 whitespace-pre-line text-slate-300">
                {currentSlide.text || '(Slide hình ảnh / sơ đồ minh họa)'}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-800/40 flex gap-2">
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(currentSlide.text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? 'Đã sao chép nội dung' : 'Sao chép nội dung'}</span>
            </button>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS HELP MODAL */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-[#0a1f16] border border-emerald-500/40 rounded-2xl p-5 shadow-2xl">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-emerald-900/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Phím tắt trình chiếu</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-emerald-900/40">
                <span className="text-slate-300">Slide tiếp theo</span>
                <span className="font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-800 text-emerald-300">
                  → / Space
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-emerald-900/40">
                <span className="text-slate-300">Slide trước đó</span>
                <span className="font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-800 text-emerald-300">
                  ←
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-emerald-900/40">
                <span className="text-slate-300">Đổi Chế độ Cuộn/Trình chiếu</span>
                <span className="font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-800 text-emerald-300">
                  M
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-emerald-900/40">
                <span className="text-slate-300">Toàn màn hình</span>
                <span className="font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-800 text-emerald-300">
                  F
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-emerald-900/40">
                <span className="text-slate-300">Mở mã QR</span>
                <span className="font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-800 text-emerald-300">
                  Q
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-emerald-900/40">
                <span className="text-slate-300">Xem lưới slide</span>
                <span className="font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-800 text-emerald-300">
                  G
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
