import { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';

const BarcodeScanner = ({ onDetected, onError, isActive = false }) => {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isActive && !isScanning) {
      startScanner();
    } else if (!isActive && isScanning) {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive]);

  const startScanner = () => {
    if (!scannerRef.current) return;

    setError(null);
    setIsScanning(true);

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment" // Usar cámara trasera en móviles
        }
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: 2,
      frequency: 10,
      decoder: {
        readers: ["code_128_reader"] // Solo Code128
      },
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

    // Listener para detección de códigos
    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      console.log('Código detectado:', code);
      
      if (onDetected) {
        onDetected(code);
      }
      
      // Detener scanner después de detectar un código
      stopScanner();
    });
  };

  const stopScanner = () => {
    if (isScanning) {
      Quagga.stop();
      setIsScanning(false);
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
