import { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';

const BarcodeScanner = ({ onDetected, onError, isActive = false }) => {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasDetected, setHasDetected] = useState(false);  // Flag para bloqueo múltiples

  // ← FIX CLAVE: Listener GLOBAL – atado UNA VEZ al componente
  useEffect(() => {
    // Ata listener una sola vez (no depende de isActive)
    const handleDetected = (result) => {
      const code = result.codeResult.code;
      
      // Bloquea si ya detectado (global)
      if (hasDetected) {
        console.log('⏸️ Detección ignorada (global) – ya procesada:', code);
        return;
      }
      
      console.log('📱 Código detectado (único global):', code);
      setHasDetected(true);  // Marca global
      
      if (onDetected) {
        onDetected(code);  // Llama parent UNA SOLA VEZ
      }
      
      console.log('🛑 Detección única procesada – deteniendo scanner');
      
      // Detiene inmediatamente
      stopScanner();
    };

    Quagga.onDetected(handleDetected);
    console.log('🔗 Listener onDetected atado (único)');

    // Cleanup: Remueve listener al desmontar
    return () => {
      Quagga.offDetected(handleDetected);
      console.log('🔌 Listener onDetected removido');
      stopScanner();
    };
  }, []);  // ← VACÍO: Solo una vez al mount (no re-ata)

  // ← useEffect para start/stop basado en isActive
  useEffect(() => {
    if (isActive && !isScanning) {
      startScanner();
    } else if (!isActive && isScanning) {
      stopScanner();
    }

    // Cleanup al cambio de isActive
    return () => {
      if (!isActive) {
        stopScanner();
      }
    };
  }, [isActive]);

  const startScanner = () => {
    if (!scannerRef.current || hasDetected) return;  // No start si ya detectado

    setError(null);
    setIsScanning(true);
    setHasDetected(false);  // Reset solo al start manual

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment"
        }
      },
      decoder: {
        readers: ['code_128_reader','ean_reader','code_39_reader']  // Múltiples OK
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: 2,
      frequency: 10,
      locate: true
    }, (err) => {
      if (err) {
        console.error('Error inicializando Quagga:', err);
        setError('Error al acceder a la cámara. Verifique los permisos.');
        setIsScanning(false);
        if (onError) onError(err);
        return;
      }
      
      console.log('Quagga inicializado correctamente');
      Quagga.start();
    });
  };

  const stopScanner = () => {
    if (isScanning) {
      Quagga.stop();
      setIsScanning(false);
      // NO reset hasDetected aquí – se mantiene true hasta re-start manual
      console.log('🛑 Scanner detenido (stream off)');
    }
  };

  return (
    <div className="barcode-scanner">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div 
        ref={scannerRef} 
        className="scanner-container bg-black rounded-lg overflow-hidden"
        style={{ 
          width: '100%', 
          maxWidth: '640px', 
          height: '480px',
          position: 'relative'
        }}
      >
        {!isScanning && !error && (
          <div className="flex items-center justify-center h-full text-white">
            <p>Preparando cámara...</p>
          </div>
        )}
      </div>
      
      {isScanning && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Apunte la cámara hacia el código de barras
          </p>
          <div className="mt-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
              Escaneando...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;