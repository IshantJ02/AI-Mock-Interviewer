'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CameraOff, AlertTriangle, ShieldCheck, ShieldAlert,
    Minimize2, Maximize2, Eye, Smartphone, Users, X,
    Volume2, VolumeX, ChevronDown, ChevronUp
} from 'lucide-react';

type ProctorStatus = 'ok' | 'warning' | 'violation' | 'initializing' | 'no-camera';

interface ProctorEvent {
    type: 'no_face' | 'multiple_faces' | 'tab_switch' | 'face_ok' | 'device_detected';
    timestamp: Date;
    message: string;
    severity: 'low' | 'medium' | 'high';
}

interface ProctorMonitorProps {
    enabled: boolean;
    onViolation?: (event: ProctorEvent) => void;
}

// ── Alert sound generator using Web Audio API ───────────────────
function playAlertSound(type: 'warning' | 'critical') {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (type === 'critical') {
            // Urgent double-beep
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
            oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.5);
        } else {
            // Gentle single beep
            oscillator.frequency.setValueAtTime(520, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
        }
    } catch {
        // Audio context not available — silently skip
    }
}

export default function ProctorMonitor({ enabled, onViolation }: ProctorMonitorProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detectorRef = useRef<any>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastAlertSoundRef = useRef<number>(0);

    const [status, setStatus] = useState<ProctorStatus>('initializing');
    const [warning, setWarning] = useState('');
    const [warningType, setWarningType] = useState<'face' | 'multi' | 'device' | 'tab' | ''>('');
    const [faceDetected, setFaceDetected] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [violations, setViolations] = useState<ProctorEvent[]>([]);
    const [hasFaceApi, setHasFaceApi] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showLog, setShowLog] = useState(false);
    const [flashColor, setFlashColor] = useState<string | null>(null);
    const [multipleFaces, setMultipleFaces] = useState(false);
    const [faceCount, setFaceCount] = useState(0);
    const [deviceSuspicion, setDeviceSuspicion] = useState(false);

    // ── Play alert with cooldown ─────────────────────────────────
    const triggerAlert = useCallback((type: 'warning' | 'critical') => {
        if (!soundEnabled) return;
        const now = Date.now();
        if (now - lastAlertSoundRef.current < 3000) return; // 3s cooldown
        lastAlertSoundRef.current = now;
        playAlertSound(type);
    }, [soundEnabled]);

    // ── Flash screen effect ──────────────────────────────────────
    const triggerFlash = useCallback((color: string) => {
        setFlashColor(color);
        setTimeout(() => setFlashColor(null), 600);
    }, []);

    const addViolation = useCallback((type: ProctorEvent['type'], message: string, severity: ProctorEvent['severity'] = 'medium') => {
        const event: ProctorEvent = { type, timestamp: new Date(), message, severity };
        setViolations(prev => {
            // Debounce: don't add same type within 5 seconds
            const last = prev.filter(v => v.type === type).pop();
            if (last && Date.now() - last.timestamp.getTime() < 5000) return prev;
            return [...prev, event];
        });
        onViolation?.(event);
    }, [onViolation]);

    // ── Initialize webcam ────────────────────────────────────────
    useEffect(() => {
        if (!enabled) return;

        const initCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, facingMode: 'user' },
                    audio: false,
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => setCameraReady(true);
                }

                // Check for native FaceDetector API (Chrome/Edge 86+)
                if ('FaceDetector' in window) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    detectorRef.current = new (window as any).FaceDetector({
                        fastMode: true,
                        maxDetectedFaces: 10,
                    });
                    setHasFaceApi(true);
                }

                setStatus('ok');
            } catch {
                setStatus('no-camera');
                setWarning('Camera access denied. Please enable camera for proctored mode.');
            }
        };

        initCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [enabled]);

    // ── Device detection via canvas analysis ─────────────────────
    const analyzeForDevices = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return false;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;

        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Look for rectangular bright spots (phone/tablet screens glow)
        // Scan the image in blocks looking for clusters of bright pixels
        // that form a rectangular region (like a phone screen)
        const blockSize = 8;
        const cols = Math.floor(canvas.width / blockSize);
        const rows = Math.floor(canvas.height / blockSize);
        const brightMap: boolean[][] = [];

        for (let r = 0; r < rows; r++) {
            brightMap[r] = [];
            for (let c = 0; c < cols; c++) {
                let brightCount = 0;
                let totalPixels = 0;

                for (let y = r * blockSize; y < (r + 1) * blockSize && y < canvas.height; y++) {
                    for (let x = c * blockSize; x < (c + 1) * blockSize && x < canvas.width; x++) {
                        const idx = (y * canvas.width + x) * 4;
                        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        // Also check for blue-ish glow typical of screens
                        const blueRatio = data[idx + 2] / (brightness + 1);
                        if (brightness > 180 || (brightness > 140 && blueRatio > 1.1)) {
                            brightCount++;
                        }
                        totalPixels++;
                    }
                }

                brightMap[r][c] = brightCount / totalPixels > 0.6;
            }
        }

        // Find rectangular clusters of bright blocks (potential device screens)
        // A phone screen would typically be a 3x5+ or 5x3+ block region
        for (let r = 0; r < rows - 3; r++) {
            for (let c = 0; c < cols - 2; c++) {
                // Check for vertical rectangle (phone portrait)
                let verticalCount = 0;
                for (let dr = 0; dr < Math.min(6, rows - r); dr++) {
                    for (let dc = 0; dc < Math.min(3, cols - c); dc++) {
                        if (brightMap[r + dr]?.[c + dc]) verticalCount++;
                    }
                }
                if (verticalCount >= 12) return true; // Found a bright rectangle

                // Check for horizontal rectangle (phone landscape)
                let horizontalCount = 0;
                for (let dr = 0; dr < Math.min(3, rows - r); dr++) {
                    for (let dc = 0; dc < Math.min(6, cols - c); dc++) {
                        if (brightMap[r + dr]?.[c + dc]) horizontalCount++;
                    }
                }
                if (horizontalCount >= 12) return true;
            }
        }

        return false;
    }, []);

    // ── Face detection + device detection loop (runs every 1.5s) ─
    useEffect(() => {
        if (!enabled || !cameraReady) return;

        const detectAll = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;

            // ── Face Detection ────────────────────────────────
            if (hasFaceApi && detectorRef.current) {
                try {
                    const faces = await detectorRef.current.detect(videoRef.current);
                    setFaceCount(faces.length);

                    if (faces.length === 0) {
                        setFaceDetected(false);
                        setMultipleFaces(false);
                        setStatus('violation');
                        setWarning('⚠️ No face detected! Stay in front of the camera.');
                        setWarningType('face');
                        addViolation('no_face', 'No face detected in camera frame', 'high');
                        triggerAlert('critical');
                        triggerFlash('rgba(239, 68, 68, 0.15)');
                    } else if (faces.length > 1) {
                        setFaceDetected(true);
                        setMultipleFaces(true);
                        setStatus('violation');
                        setWarning(`🚨 ${faces.length} faces detected! Only ONE person is allowed during the interview.`);
                        setWarningType('multi');
                        addViolation('multiple_faces', `${faces.length} faces detected — possible third party assistance`, 'high');
                        triggerAlert('critical');
                        triggerFlash('rgba(249, 115, 22, 0.15)');
                    } else {
                        setFaceDetected(true);
                        setMultipleFaces(false);
                        setFaceCount(1);
                        // Only clear if no device suspicion
                        if (!deviceSuspicion) {
                            setStatus('ok');
                            setWarning('');
                            setWarningType('');
                        }
                    }
                } catch {
                    // Detection failed — silently continue
                }
            }

            // ── Device/Phone Detection ────────────────────────
            try {
                const deviceFound = analyzeForDevices();
                setDeviceSuspicion(deviceFound);
                if (deviceFound) {
                    setStatus('warning');
                    setWarning('📱 Suspicious device/screen detected! Remove any electronic devices from view.');
                    setWarningType('device');
                    addViolation('device_detected', 'Possible electronic device (phone/tablet) detected in camera view', 'medium');
                    triggerAlert('warning');
                    triggerFlash('rgba(234, 179, 8, 0.1)');
                }
            } catch {
                // Canvas analysis failed — skip
            }
        };

        intervalRef.current = setInterval(detectAll, 1500);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [enabled, cameraReady, hasFaceApi, addViolation, triggerAlert, triggerFlash, analyzeForDevices, deviceSuspicion]);

    // ── Tab visibility detection ─────────────────────────────────
    useEffect(() => {
        if (!enabled) return;

        const handleVisibility = () => {
            if (document.hidden) {
                setStatus('violation');
                setWarning('🚨 Tab switch detected! Stay on the interview tab.');
                setWarningType('tab');
                addViolation('tab_switch', 'Switched away from interview tab', 'high');
                triggerAlert('critical');
                triggerFlash('rgba(239, 68, 68, 0.2)');
            } else {
                // Restore status after coming back
                setTimeout(() => {
                    if (faceDetected && !multipleFaces && !deviceSuspicion) {
                        setStatus('ok');
                        setWarning('');
                        setWarningType('');
                    }
                }, 1500);
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [enabled, faceDetected, multipleFaces, deviceSuspicion, addViolation, triggerAlert, triggerFlash]);

    // ── Copy/paste detection ─────────────────────────────────────
    useEffect(() => {
        if (!enabled) return;

        const handlePaste = (e: ClipboardEvent) => {
            if (e.type === 'paste') {
                addViolation('tab_switch', 'Paste action detected', 'low');
                triggerAlert('warning');
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [enabled, addViolation, triggerAlert]);

    if (!enabled) return null;

    const statusColors: Record<ProctorStatus, string> = {
        ok: 'border-green-500 shadow-green-500/30',
        warning: 'border-yellow-500 shadow-yellow-500/30',
        violation: 'border-red-500 shadow-red-500/30',
        initializing: 'border-blue-500 shadow-blue-500/30',
        'no-camera': 'border-gray-600 shadow-none',
    };

    const statusIcons: Record<ProctorStatus, React.ReactNode> = {
        ok: <ShieldCheck size={12} className="text-green-400" />,
        warning: <AlertTriangle size={12} className="text-yellow-400" />,
        violation: <ShieldAlert size={12} className="text-red-400 animate-pulse" />,
        initializing: <Eye size={12} className="text-blue-400 animate-pulse" />,
        'no-camera': <CameraOff size={12} className="text-gray-400" />,
    };

    const violationCount = violations.length;
    const criticalViolations = violations.filter(v => v.severity === 'high').length;

    return (
        <>
            {/* Hidden canvas for device detection analysis */}
            <canvas ref={canvasRef} className="hidden" />

            {/* ── Full-screen flash overlay ────────────────── */}
            <AnimatePresence>
                {flashColor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[60] pointer-events-none"
                        style={{ backgroundColor: flashColor }}
                    />
                )}
            </AnimatePresence>

            {/* ── Floating webcam panel ────────────────────── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`fixed bottom-4 left-4 z-50 ${isMinimized ? 'w-12 h-12' : 'w-56'}`}
            >
                <div
                    className={`relative rounded-2xl overflow-hidden border-2 shadow-lg transition-all duration-300 ${statusColors[status]} bg-gray-900`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-2 py-1.5 bg-black/60 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5">
                            {statusIcons[status]}
                            {!isMinimized && (
                                <span className="text-[10px] font-semibold text-gray-300">
                                    Proctored
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Sound toggle */}
                            {!isMinimized && (
                                <button
                                    onClick={() => setSoundEnabled(!soundEnabled)}
                                    className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                                    title={soundEnabled ? 'Mute alerts' : 'Enable alert sounds'}
                                >
                                    {soundEnabled ? <Volume2 size={10} /> : <VolumeX size={10} />}
                                </button>
                            )}
                            {violationCount > 0 && !isMinimized && (
                                <button
                                    onClick={() => setShowLog(!showLog)}
                                    className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold hover:bg-red-500/30 transition-all cursor-pointer"
                                >
                                    {criticalViolations > 0 ? `🔴 ${criticalViolations}` : ''} {violationCount} ⚠
                                </button>
                            )}
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                            >
                                {isMinimized ? <Maximize2 size={10} /> : <Minimize2 size={10} />}
                            </button>
                        </div>
                    </div>

                    {/* Video feed */}
                    <AnimatePresence>
                        {!isMinimized && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                            >
                                {status === 'no-camera' ? (
                                    <div className="flex flex-col items-center justify-center py-6 px-3 text-center">
                                        <CameraOff size={24} className="text-gray-500 mb-2" />
                                        <p className="text-[10px] text-gray-400">
                                            Camera access required
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-auto mirror"
                                            style={{ transform: 'scaleX(-1)' }}
                                        />
                                        {/* Face detection overlay */}
                                        {(status === 'violation' || status === 'warning') && (
                                            <div className={`absolute inset-0 flex items-center justify-center ${
                                                status === 'violation' ? 'bg-red-500/15' : 'bg-yellow-500/10'
                                            }`}>
                                                <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2">
                                                    {!faceDetected ? (
                                                        <p className="text-[10px] text-red-400 font-semibold text-center flex items-center gap-1">
                                                            <Eye size={10} /> No face detected
                                                        </p>
                                                    ) : multipleFaces ? (
                                                        <p className="text-[10px] text-orange-400 font-semibold text-center flex items-center gap-1">
                                                            <Users size={10} /> {faceCount} faces!
                                                        </p>
                                                    ) : deviceSuspicion ? (
                                                        <p className="text-[10px] text-yellow-400 font-semibold text-center flex items-center gap-1">
                                                            <Smartphone size={10} /> Device detected
                                                        </p>
                                                    ) : (
                                                        <p className="text-[10px] text-red-400 font-semibold text-center">
                                                            ⚠ Violation
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {/* Status indicator dot */}
                                        <div className="absolute top-2 right-2">
                                            <span className={`block w-2.5 h-2.5 rounded-full ${
                                                status === 'ok' ? 'bg-green-400' :
                                                status === 'violation' ? 'bg-red-400 animate-pulse' :
                                                'bg-yellow-400 animate-pulse'
                                            }`} />
                                        </div>
                                        {/* Face count badge */}
                                        {hasFaceApi && cameraReady && faceCount > 0 && (
                                            <div className="absolute top-2 left-2">
                                                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                                                    faceCount === 1 ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'
                                                }`}>
                                                    <Users size={8} /> {faceCount}
                                                </div>
                                            </div>
                                        )}
                                        {!hasFaceApi && cameraReady && (
                                            <div className="absolute bottom-1 left-1 right-1">
                                                <div className="bg-black/60 rounded px-1.5 py-0.5">
                                                    <p className="text-[8px] text-yellow-400 text-center">
                                                        Use Chrome/Edge for face detection
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* ── Violation Log Panel ─────────────────────────── */}
            <AnimatePresence>
                {showLog && !isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="fixed bottom-4 left-[15.5rem] z-50 w-72"
                    >
                        <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                                <span className="text-[10px] font-semibold text-gray-300 flex items-center gap-1.5">
                                    <ShieldAlert size={10} className="text-red-400" />
                                    Violation Log ({violations.length})
                                </span>
                                <button
                                    onClick={() => setShowLog(false)}
                                    className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto p-2 space-y-1.5">
                                {violations.length === 0 ? (
                                    <p className="text-[10px] text-gray-500 text-center py-4">No violations recorded</p>
                                ) : (
                                    [...violations].reverse().map((v, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-start gap-2 px-2.5 py-2 rounded-lg text-[10px] ${
                                                v.severity === 'high'
                                                    ? 'bg-red-500/10 border border-red-500/20'
                                                    : v.severity === 'medium'
                                                    ? 'bg-yellow-500/10 border border-yellow-500/20'
                                                    : 'bg-white/5 border border-white/5'
                                            }`}
                                        >
                                            <span className="mt-0.5">
                                                {v.type === 'multiple_faces' ? <Users size={10} className="text-orange-400" /> :
                                                 v.type === 'no_face' ? <Eye size={10} className="text-red-400" /> :
                                                 v.type === 'device_detected' ? <Smartphone size={10} className="text-yellow-400" /> :
                                                 <AlertTriangle size={10} className="text-yellow-400" />}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold ${
                                                    v.severity === 'high' ? 'text-red-300' :
                                                    v.severity === 'medium' ? 'text-yellow-300' : 'text-gray-300'
                                                }`}>
                                                    {v.message}
                                                </p>
                                                <p className="text-gray-500 mt-0.5">
                                                    {v.timestamp.toLocaleTimeString()}
                                                </p>
                                            </div>
                                            <span className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase ${
                                                v.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                                v.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-white/10 text-gray-400'
                                            }`}>
                                                {v.severity}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Warning banner at top ────────────────────────── */}
            <AnimatePresence>
                {warning && (
                    <motion.div
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        className="fixed top-16 left-1/2 -translate-x-1/2 z-[55]"
                    >
                        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-md border shadow-2xl max-w-xl ${
                            status === 'violation'
                                ? 'bg-red-500/15 border-red-500/40 text-red-200'
                                : 'bg-yellow-500/15 border-yellow-500/40 text-yellow-200'
                        }`}>
                            {/* Icon based on warning type */}
                            {warningType === 'multi' ? (
                                <div className="flex items-center gap-1.5">
                                    <Users size={18} className="text-orange-400 animate-pulse" />
                                </div>
                            ) : warningType === 'device' ? (
                                <div className="flex items-center gap-1.5">
                                    <Smartphone size={18} className="text-yellow-400 animate-bounce" />
                                </div>
                            ) : warningType === 'face' ? (
                                <div className="flex items-center gap-1.5">
                                    <Eye size={18} className="text-red-400 animate-pulse" />
                                </div>
                            ) : (
                                <AlertTriangle size={18} className="animate-pulse" />
                            )}
                            <div>
                                <span className="text-xs font-bold block">{warning}</span>
                                {warningType === 'multi' && (
                                    <span className="text-[10px] text-orange-300/70 block mt-0.5">
                                        This incident will be recorded in your interview report.
                                    </span>
                                )}
                                {warningType === 'device' && (
                                    <span className="text-[10px] text-yellow-300/70 block mt-0.5">
                                        Remove phones, tablets, and secondary screens from your area.
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => { setWarning(''); setWarningType(''); }}
                                className="p-1 rounded-lg hover:bg-white/10 transition-all ml-2 flex-shrink-0"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Persistent violation counter badge (top-right) ── */}
            <AnimatePresence>
                {violationCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="fixed top-20 right-4 z-50"
                    >
                        <button
                            onClick={() => { setShowLog(!showLog); if(isMinimized) setIsMinimized(false); }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md border shadow-lg transition-all hover:scale-105 ${
                                criticalViolations > 0
                                    ? 'bg-red-500/15 border-red-500/30 text-red-300'
                                    : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300'
                            }`}
                        >
                            <ShieldAlert size={14} className={criticalViolations > 0 ? 'text-red-400 animate-pulse' : 'text-yellow-400'} />
                            <span className="text-xs font-bold">{violationCount} Violation{violationCount !== 1 ? 's' : ''}</span>
                            {showLog ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
