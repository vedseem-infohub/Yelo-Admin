/**
 * Compress and resize image before uploading
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width (default: 800 for aggressive compression)
 * @param {number} maxHeight - Maximum height (default: 800 for aggressive compression)
 * @param {number} quality - JPEG quality 0-1 (default: 0.5 for 20-30 KB target)
 * @returns {Promise<string>} Base64 data URL of compressed image
 */
export function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.5) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression - try WebP first (better compression), fallback to JPEG
        let compressedDataUrl;
        try {
          // Try WebP first (better compression ratio)
          compressedDataUrl = canvas.toDataURL('image/webp', quality);
        } catch (error) {
          // Fallback to JPEG if WebP not supported
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        // If the compressed image is still too large (>50 KB base64), reduce quality further
        const base64Length = compressedDataUrl.length;
        const maxSize = 50 * 1024; // 50 KB base64 string (roughly 37 KB actual)
        
        if (base64Length > maxSize) {
          // Try again with even lower quality
          let reducedQuality = Math.max(0.3, quality * 0.7);
          try {
            compressedDataUrl = canvas.toDataURL('image/webp', reducedQuality);
          } catch (error) {
            compressedDataUrl = canvas.toDataURL('image/jpeg', reducedQuality);
          }
        }
        
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple images
 * @param {File[]} files - Array of image files
 * @returns {Promise<string[]>} Array of base64 data URLs
 */
export async function compressImages(files, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
  return Promise.all(
    files.map(file => compressImage(file, maxWidth, maxHeight, quality))
  );
}

