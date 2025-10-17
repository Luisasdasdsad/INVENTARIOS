import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { FaCamera, FaStop, FaQrcode, FaSyncAlt, FaTimes, FaRedo } from 'react-icons/fa';
import Modal from '../Modal/Modal';  // ← Asegura que este Modal llame onClose en backdrop/escape

const EscanerQR = ({ isOpen, onScan, onClose, onError }) => {
  const [scanResult, setScanResult] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraError, setCameraError] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isClosing, setIsClosing] = useState(false);  // Nuevo: Para UX cierre
  const [hasScanned, setHasScanned] = useState(false);  // Nuevo: Previene múltiples detecciones
  const scannerRef = useRef(null);
  const qrCode = useRef(null);

  // Cleanup seguro (con logs)
  const stopScannerSafely = async () => {
  const scanner = qrCode.current;
  if (scanner) {
    try {
      console.log('🔄 Cerrando scanner...');
      await scanner.stop();
      scanner.clear();
      console.log('⏹️ Scanner detenido y limpiado');
    } catch (err) {
      console.warn('⚠️ Error al detener scanner:', err.message);
    } finally {
      qrCode.current = null; // 👈 Solo aquí
      setIsCameraReady(false);
      setCameraError('');
      setScanResult('');
    }
  } else {
    console.log('ℹ️ No hay scanner activo para cerrar');
  }
};

  // Función para iniciar scanner (igual que antes – funciona)
  const startScanner = async (useDefault = false) => {
    if (!scannerRef.current || qrCode.current) return;

    console.log('🔄 Iniciando escáner' + (useDefault ? ' con default' : ' con facingMode'));
    setCameraError('');
    setIsCameraReady(false);
    setScanResult('');
    setHasScanned(false);  // Reset flag al iniciar

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: false
      }
    };

    qrCode.current = new Html5Qrcode(scannerRef.current.id);

    try {
      const cameraIdOrConfig = useDefault ? undefined : { facingMode: facingMode };
      console.log('🔄 Intentando cámara con config:', cameraIdOrConfig);

      await qrCode.current.start(
        cameraIdOrConfig,
        config,
        (decodedText) => {
          if (hasScanned) return;  // Previene múltiples llamadas
          setHasScanned(true);
          console.log('✅ QR Escaneado:', decodedText);
          setScanResult(decodedText);
          setIsCameraReady(false);
          stopScannerSafely();
          if (onScan) onScan(decodedText);
          if (onClose) onClose();  // Auto-cierre al detectar
        },
        (error) => {
          if (error && !error.includes('No MultiFormat Readers')) {
            console.error('❌ Error escaneo:', error);
            if (onError) onError(error);
          }
        }
      );
      console.log('✅ Cámara iniciada exitosamente');
      setIsCameraReady(true);
      setCameraError('');
    } catch (err) {
      console.error('❌ Error al iniciar cámara:', err);
      
      if (err.name === 'OverconstrainedError' || err.message.includes('Overconstrained')) {
        console.log('🔄 Overconstrained – Retry con default...');
        setCameraError('Config no disponible – usando cámara default');
        await startScanner(true);
        return;
      }
      
      setCameraError(`Error cámara: ${err.name === 'NotAllowedError' ? 'Permite acceso en navegador' : err.message}`);
      setIsCameraReady(false);
      if (onError) onError(err);
    }
  };

  // Auto-start al abrir
  useEffect(() => {
  if (isOpen && !qrCode.current) {
    const timer = setTimeout(() => {
      console.log('🔄 Modal QR abierto – Auto-start cámara...');
      startScanner(false);
    }, 150);
    return () => clearTimeout(timer);
  }
}, [isOpen]);

  // Fuerza stop al cerrar modal (anti-leak)
  useEffect(() => {
    if (!isOpen) {
      console.log('🔄 Modal cerrándose – Forzando stop cámara...');
      stopScannerSafely();
    }
  }, [isOpen]);

  // Switch cámara
  const handleSwitchCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    console.log('🔄 Switch a:', newMode);
    await stopScannerSafely();
    // Delay corto para re-mount
    setTimeout(() => startScanner(newMode === 'environment' ? false : true), 500);
  };

  // Pausa
  const handlePause = async () => {
    if (qrCode.current && isCameraReady) {
      try {
        await qrCode.current.pause(false);
        console.log('⏸️ Escaneo pausado');
      } catch (err) {
        console.warn('⚠️ No se pudo pausar:', err);
      }
    }
  };

  // Reintentar
  const handleRetryCamera = async () => {
    setCameraError('');
    await stopScannerSafely();
    startScanner(false);
  };

  // Cierre mejorado (con UX y logs)
  const handleClose = async () => {
    console.log('🔄 Usuario solicitó cierre – Iniciando cleanup...');
    setIsClosing(true);
    await stopScannerSafely();
    console.log('✅ Scanner detenido y limpiado');
    setIsClosing(false);
    if (onClose) onClose();  // Callback al parent (setShowEscanerQR(false))
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={handleClose}>  {/* ← Asegura que Modal use este onClose */}
      <div className="text-center space-y-4 max-w-md mx-auto">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <FaQrcode size={20} className="text-green-600" /> Escanear Código QR
        </h3>

        {/* Scanner Div */}
        <div 
          id="qr-scanner-div" 
          ref={scannerRef} 
          className="w-full h-64 border-2 border-gray-300 rounded bg-gray-100 flex items-center justify-center relative"
        >
          {isClosing ? (
            <div className="text-blue-600 flex flex-col items-center">
              <FaStop size={32} className="mb-2 animate-spin" />
              <p>Cerrando cámara...</p>
            </div>
          ) : cameraError ? (
            <div className="text-red-600 flex flex-col items-center space-y-2 p-4">
              <FaCamera size={32} className="text-red-500" />
              <p className="text-center">{cameraError}</p>
              <button
                onClick={handleRetryCamera}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
              >
                <FaRedo /> Reintentar Cámara
              </button>
            </div>
          ) : !isCameraReady ? (
            <div className="text-gray-500 flex flex-col items-center">
              <FaCamera size={32} className="mb-2 animate-spin" />
              <p>Iniciando cámara...</p>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-green-500 rounded-lg w-32 h-32 opacity-50 animate-pulse"></div>
              </div>
            </>
          )}
        </div>

        {/* Controles */}
        <div className="flex flex-wrap justify-center gap-2 p-2 bg-gray-50 rounded">
          <button
            onClick={handlePause}
            disabled={!isCameraReady || isClosing}
            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 flex items-center gap-1 text-sm"
          >
            <FaStop size={12} /> Pausar
          </button>
          <button
            onClick={handleSwitchCamera}
            disabled={!isCameraReady || isClosing}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-1 text-sm"
          >
            <FaSyncAlt size={12} /> Cambiar Cámara
          </button>
          <button
            onClick={handleClose}
            disabled={isClosing}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-1 text-sm"
          >
            <FaTimes size={12} /> Cerrar
          </button>
        </div>

        {scanResult && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded flex items-center justify-center gap-2">
            <FaQrcode size={16} /> Detectado: {scanResult.substring(0, 20)}...
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EscanerQR;