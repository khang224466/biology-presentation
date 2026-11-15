import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
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
  HelpCircle
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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [customQrUrl, setCustomQrUrl] = useState<string>('');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qrSvgRef = useRef<SVGSVGElement | null>(null);

  // Initialize URL for QR code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const href = window.location.href.split('#')[0];
      setCurrentUrl(href);
      setCustomQrUrl(href);
    }
  }, []);

  // Preload neighboring slides
  useEffect(() => {
    const nextIdx = (currentIndex + 1) % slides.length;
    const prevIdx = (currentIndex - 1 + slides.length) % slides.length;
    const nextImg = new Image();
    nextImg.src = slides[nextIdx].image;
    const prevImg = new Image();
    prevImg.src = slides[prevIdx].image;
  }, [currentIndex, slides]);

  // Confetti on thank-you slide (Slide 17)
  useEffect(() => {
    if (currentIndex === 16) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#d8f3dc']
        });
      } catch {
        // ignore
      }
    }
  }, [currentIndex]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  }, [slides.length]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Autoplay effect
  useEffect(() => {
    if (!isAutoPlay) return;
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
  }, [isAutoPlay, slides.length]);

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
        case '?':
          e.preventDefault();
          setShowHelp(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, goToSlide, slides.length, showQrModal, showNotes, showThumbnails, showHelp]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Inactivity fade for controls in presentation mode
  const handleMouseMove = () => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isFullscreen) {
        setIsControlsVisible(false);
      }
    }, 3500);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStartX(null);
  };

  const handleCopyLink = () => {
    const urlToCopy = customQrUrl || currentUrl;
    navigator.clipboard.writeText(urlToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadQrCodePng = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(img, 40, 40, 520, 520);
        const a = document.createElement('a');
        a.download = `QR-Te-Bao-Thuc-Vat-Nhom-1.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const currentSlide = slides[currentIndex];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-screen h-screen bg-[#07130e] text-slate-100 flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#2d6a4f] blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#1b4332] blur-[160px]" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header
        className={`relative z-20 flex items-center justify-between px-3 md:px-6 py-2.5 bg-[#091a13]/85 backdrop-blur-md border-b border-[#2d6a4f]/40 transition-all duration-300 ${
          !isControlsVisible && isFullscreen ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Left: Branding & current title */}
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Nhóm 1 • Sinh Học
              </span>
              <span className="hidden sm:inline-block text-xs text-emerald-200/60">|</span>
              <h1 className="hidden sm:inline-block text-sm font-medium text-slate-200 truncate max-w-[220px] md:max-w-md">
                {currentSlide.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Slide indicator */}
        <div className="flex items-center gap-1.5 bg-[#0e2a1e]/80 border border-emerald-600/30 px-3 py-1 rounded-full text-xs font-medium text-emerald-300">
          <span className="text-emerald-400 font-bold">{String(currentIndex + 1).padStart(2, '0')}</span>
          <span className="text-emerald-600">/</span>
          <span className="text-slate-400">{String(slides.length).padStart(2, '0')}</span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* QR Button (Prominent) */}
          <button
            onClick={() => setShowQrModal(true)}
            title="Quét mã QR để mở trên điện thoại (Q)"
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-medium px-2.5 md:px-3.5 py-1.5 rounded-lg shadow-lg shadow-emerald-900/40 transition-all transform active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Quét QR</span>
          </button>

          {/* Download Original PDF */}
          <a
            href="/slides/te-bao-thuc-vat-nhom-1.pdf"
            download="te-bao-thuc-vat-nhom-1.pdf"
            title="Tải bài thuyết trình PDF gốc"
            className="p-1.5 md:px-2.5 md:py-1.5 text-xs rounded-lg bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-300 border border-emerald-700/40 flex items-center gap-1 transition-colors"
          >
            <Download className="w-4 h-4" />
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
          <button
            onClick={() => setIsAutoPlay((prev) => !prev)}
            title={isAutoPlay ? 'Tạm dừng tự động chạy (A)' : 'Tự động chạy bài thuyết trình (A)'}
            className={`p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-900/40 transition-colors ${
              isAutoPlay ? 'bg-emerald-500 text-black' : ''
            }`}
          >
            {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

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
            className="hidden sm:block p-1.5 rounded-lg text-emerald-400/80 hover:bg-emerald-900/40 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN SLIDE VIEW AREA */}
      <main className="relative flex-1 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
        {/* Slide Canvas 16:9 */}
        <div className="relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] aspect-video flex items-center justify-center bg-black/40 rounded-xl md:rounded-2xl shadow-2xl overflow-hidden border border-[#2d6a4f]/30">
          <img
            key={currentSlide.id}
            src={currentSlide.image}
            alt={currentSlide.title}
            className="w-full h-full object-contain transition-opacity duration-200 select-none pointer-events-none"
            loading="eager"
            decoding="async"
          />

          {/* Left Click Area for Prev Slide */}
          <div
            onClick={prevSlide}
            title="Slide trước (←)"
            className="group absolute left-0 top-0 bottom-0 w-[15%] cursor-pointer flex items-center justify-start pl-2 sm:pl-4 transition-all duration-200 z-10"
          >
            <div className="p-2 sm:p-3 rounded-full bg-black/50 backdrop-blur-md text-emerald-300 border border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Right Click Area for Next Slide */}
          <div
            onClick={nextSlide}
            title="Slide tiếp (→ hoặc Space)"
            className="group absolute right-0 top-0 bottom-0 w-[15%] cursor-pointer flex items-center justify-end pr-2 sm:pr-4 transition-all duration-200 z-10"
          >
            <div className="p-2 sm:p-3 rounded-full bg-black/50 backdrop-blur-md text-emerald-300 border border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM CONTROLS & TIMELINE */}
      <footer
        className={`relative z-20 px-3 md:px-6 py-2.5 bg-[#091a13]/85 backdrop-blur-md border-t border-[#2d6a4f]/40 flex flex-col gap-2 transition-all duration-300 ${
          !isControlsVisible && isFullscreen ? 'opacity-0 translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Progress Bar with clickable segments */}
        <div className="w-full flex items-center gap-1 h-2 cursor-pointer group">
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
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0e2a1e] border border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trước</span>
            </button>
            <button
              onClick={nextSlide}
              disabled={currentIndex === slides.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0e2a1e] border border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <span>Sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-emerald-400/70">
            <span>Dùng phím mũi tên ◄ ► hoặc Space để chuyển slide</span>
            <span>•</span>
            <span>Nhấn <kbd className="px-1.5 py-0.5 bg-black/40 rounded border border-emerald-800 text-white font-mono text-[10px]">F</kbd> toàn màn hình</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQrModal(true)}
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 flex items-center gap-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ mã QR</span>
            </button>
          </div>
        </div>
      </footer>

      {/* QR CODE SHARING MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0a1f16] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
            {/* Close button */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-emerald-900/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              Quét mã QR để xem bài thuyết trình
            </h2>
            <p className="text-xs text-emerald-300/80 mb-5 max-w-xs">
              Mở camera điện thoại hoặc Zalo để quét và theo dõi bài thuyết trình trên máy của bạn
            </p>

            {/* QR Card */}
            <div className="p-4 bg-white rounded-xl shadow-lg border-4 border-emerald-500/30 mb-4 flex flex-col items-center justify-center">
              <QRCodeSVG
                id="qr-code-svg"
                ref={qrSvgRef}
                value={customQrUrl || currentUrl || 'https://te-bao-thuc-vat.vercel.app'}
                size={220}
                level="H"
                includeMargin={true}
                fgColor="#091a13"
                bgColor="#ffffff"
              />
              <span className="text-[10px] text-gray-500 mt-1 font-semibold uppercase tracking-wider">
                Nhóm 1 • Tế bào thực vật
              </span>
            </div>

            {/* URL input field */}
            <div className="w-full flex items-center gap-1.5 mb-4">
              <input
                type="text"
                value={customQrUrl}
                onChange={(e) => setCustomQrUrl(e.target.value)}
                placeholder="Nhập liên kết web app..."
                className="flex-1 bg-black/40 border border-emerald-700/50 text-xs text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-2 rounded-lg font-medium transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã chép' : 'Chép'}</span>
              </button>
            </div>

            {/* Download QR PNG Button */}
            <div className="w-full flex gap-2">
              <button
                onClick={downloadQrCodePng}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-600/40 text-emerald-200 text-xs font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Tải ảnh QR (PNG)</span>
              </button>
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
        <div className="fixed inset-0 z-50 flex flex-col bg-[#07130e]/95 backdrop-blur-xl animate-in fade-in duration-200 p-4 md:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-emerald-800/40 mb-6">
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Danh sách 18 slide thuyết trình</h2>
            </div>
            <button
              onClick={() => setShowThumbnails(false)}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-emerald-900/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 flex-1">
            {slides.map((s, idx) => {
              const isSelected = idx === currentIndex;
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
                    <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-[10px] font-bold text-emerald-300 px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </div>
                  </div>
                  <div className="p-2 text-left">
                    <h3 className="text-xs font-medium text-slate-200 line-clamp-2 leading-tight">
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
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#091a13]/95 backdrop-blur-xl border-l border-emerald-700/40 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-emerald-800/40 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Nội dung Slide {currentIndex + 1}</h2>
            </div>
            <button
              onClick={() => setShowNotes(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-emerald-900/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs leading-relaxed text-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Tiêu đề:</span>
              <p className="text-sm font-semibold text-white mt-0.5">{currentSlide.title}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Nội dung thuyết minh:</span>
              <div className="mt-1 p-3 bg-black/40 rounded-xl border border-emerald-900/60 whitespace-pre-line text-slate-300">
                {currentSlide.text || '(Slide hình ảnh / sơ đồ minh họa)'}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-800/40 flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentSlide.text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
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
          <div className="relative w-full max-w-sm bg-[#0a1f16] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-emerald-900/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
              <span>Phím tắt trình chiếu</span>
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-emerald-900/40">
                <span className="text-slate-300">Slide tiếp theo</span>
                <span className="font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-800 text-emerald-300">
                  → / Space / PageDown
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-emerald-900/40">
                <span className="text-slate-300">Slide trước đó</span>
                <span className="font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-800 text-emerald-300">
                  ← / PageUp
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
              <div className="flex justify-between items-center py-1 border-b border-emerald-900/40">
                <span className="text-slate-300">Xem nội dung bài giảng</span>
                <span className="font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-800 text-emerald-300">
                  N
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-300">Đóng cửa sổ phụ</span>
                <span className="font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-800 text-emerald-300">
                  ESC
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
