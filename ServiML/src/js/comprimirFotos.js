export const comprimirImagen = (archivo) => {
  return new Promise((resolve, reject) => {
    if (!archivo || !archivo.type.startsWith('image/')) {
      reject(new Error('El archivo proporcionado no es una imagen valida'));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(archivo);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      let finalWidth = img.width;
      let finalHeight = img.height;

      if (img.width > MAX_WIDTH) {
        const scaleSize = MAX_WIDTH / img.width;
        finalWidth = MAX_WIDTH;
        finalHeight = img.height * scaleSize;
      }

      canvas.width = finalWidth;
      canvas.height = finalHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const archivoComprimido = new File([blob], archivo.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(archivoComprimido);
          } else {
            reject(new Error('Fallo al generar la imagen comprimida'));
          }
        },
        'image/jpeg',
        0.7
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Error al cargar la imagen en memoria'));
    };
  });
};