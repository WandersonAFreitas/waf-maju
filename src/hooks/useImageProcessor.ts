import { useCallback, useState } from 'react';

export function useImageProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback((file: File, maxDim = 250, quality = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      setIsProcessing(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Mantém a proporção da imagem limitando a maior dimensão a maxDim
            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Não foi possível obter o contexto 2D do Canvas.');
            }

            // Desenha a imagem redimensionada no canvas
            ctx.drawImage(img, 0, 0, width, height);

            // Converte para jpeg com compressão de qualidade
            const base64 = canvas.toDataURL('image/jpeg', quality);
            setIsProcessing(false);
            
            // Log do tamanho aproximado em KB
            const sizeInKB = Math.round((base64.length * 3) / 4 / 1024);
            console.log(`Image processed: ${width}x${height}, size: ~${sizeInKB}KB`);
            
            resolve(base64);
          } catch (err: any) {
            setIsProcessing(false);
            setError(err.message || 'Erro ao processar imagem.');
            reject(err);
          }
        };
        img.onerror = () => {
          setIsProcessing(false);
          setError('Erro ao carregar objeto de imagem.');
          reject(new Error('Erro ao carregar objeto de imagem.'));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setIsProcessing(false);
        setError('Erro ao ler o arquivo.');
        reject(new Error('Erro ao ler o arquivo.'));
      };
      reader.readAsDataURL(file);
    });
  }, []);

  return { processImage, isProcessing, error };
}
