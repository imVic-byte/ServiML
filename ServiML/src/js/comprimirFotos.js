export const comprimirImagen = (archivo) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(archivo);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        
        const finalWidth = scaleSize < 1 ? MAX_WIDTH : img.width;
        const finalHeight = scaleSize < 1 ? img.height * scaleSize : img.height;

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
              reject(new Error('Error al comprimir imagen'));
            }
          },
          'image/jpeg',
          0.7
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};