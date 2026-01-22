/**
 * Frontend Image Compression Utility using ConvertAPI via Backend
 * This utility sends images to the backend API for compression
 * 
 * Backend endpoint required: /api/upload/compress-image
 */

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Compress a single image file using backend ConvertAPI
 * @param {File} file - Image file to compress
 * @param {number} quality - Quality level 1-100 (default: 20 for aggressive compression - target 20-30 KB)
 * @returns {Promise<string>} Base64 data URL of compressed image
 */
export async function compressImage(file, quality = 20) {
  try {
    // Create FormData
    const formData = new FormData();
    formData.append('image', file);
    formData.append('quality', quality.toString());

    // Send to backend for compression
    const response = await fetch(`${API_URL}/upload/compress-image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data || !result.data.base64) {
      throw new Error('Invalid response from compression service');
    }

    // Return as data URL
    return `data:${result.data.mimeType};base64,${result.data.base64}`;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Fallback to client-side compression if backend fails
    return fallbackCompressImage(file);
  }
}

/**
 * Compress multiple images using backend ConvertAPI
 * @param {File[]} files - Array of image files
 * @param {number} quality - Quality level 1-100 (default: 20 for aggressive compression - target 20-30 KB)
 * @returns {Promise<string[]>} Array of base64 data URLs
 */
export async function compressImages(files, quality = 20) {
  try {
    console.log(`📤 Sending ${files.length} image(s) to backend for compression...`);
    console.log(`🌐 API URL: ${API_URL}/upload/compress-images`);
    
    const formData = new FormData();
    
    // Append all files
    files.forEach((file, index) => {
      formData.append('images', file);
      console.log(`  📎 File ${index + 1}: ${file.name} (${(file.size / 1024).toFixed(2)} KB, ${file.type})`);
    });
    formData.append('quality', quality.toString());

    // Send to backend for compression
    console.log(`🌐 Making request to: ${API_URL}/upload/compress-images`);
    const response = await fetch(`${API_URL}/upload/compress-images`, {
      method: 'POST',
      body: formData
      // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
    });

    console.log(`📥 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('❌ Backend compression failed (JSON):', errorData);
      } catch (e) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ Backend compression failed (text):', errorText);
        errorData = { message: errorText || `HTTP error! status: ${response.status}` };
      }
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    let result;
    try {
      result = await response.json();
      console.log('📦 Compression response:', {
        success: result.success,
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        dataLength: result.data?.length || 0,
        data: result.data ? result.data.map((item, i) => ({
          index: i,
          hasError: !!item.error,
          hasBase64: !!item.base64,
          error: item.error,
          originalName: item.originalName
        })) : null
      });
    } catch (parseError) {
      const responseText = await response.text().catch(() => 'Unable to read response');
      console.error('❌ Failed to parse response as JSON:', parseError);
      console.error('📄 Response text:', responseText);
      throw new Error('Invalid JSON response from compression service');
    }

    if (!result.success || !result.data || !Array.isArray(result.data)) {
      console.error('❌ Invalid response format:', result);
      throw new Error('Invalid response from compression service');
    }

    // Check if any items failed
    const failedItems = result.data.filter(item => item.error);
    if (failedItems.length > 0) {
      console.warn(`⚠️ ${failedItems.length} image(s) failed compression:`, failedItems.map(item => ({
        name: item.originalName,
        error: item.error
      })));
    }

    // Return array of data URLs (only successful compressions)
    const successfulResults = result.data.filter(item => !item.error && item.base64);
    console.log(`✅ Successfully compressed ${successfulResults.length} out of ${result.data.length} image(s)`);

    if (successfulResults.length === 0 && result.data.length > 0) {
      // All items failed - throw error to trigger fallback
      const errorMessages = result.data.map(item => item.error || 'Unknown error').join(', ');
      console.error('❌ All images failed compression:', errorMessages);
      throw new Error(`All images failed compression: ${errorMessages}`);
    }

    if (successfulResults.length === 0) {
      // No data returned
      console.error('❌ No images were compressed - empty response');
      throw new Error('No images were compressed');
    }

    const dataUrls = successfulResults.map(item => `data:${item.mimeType || 'image/webp'};base64,${item.base64}`);
    console.log(`✅ Returning ${dataUrls.length} compressed image data URL(s)`);
    return dataUrls;
  } catch (error) {
    console.error('❌ Error compressing images, falling back to client-side compression:', error);
    console.log(`🔄 Using fallback compression for ${files.length} image(s)...`);
    // Fallback to client-side compression
    try {
      const fallbackResults = await Promise.all(files.map(file => fallbackCompressImage(file)));
      console.log(`✅ Fallback compression completed: ${fallbackResults.length} image(s)`);
      return fallbackResults;
    } catch (fallbackError) {
      console.error('❌ Fallback compression also failed:', fallbackError);
      throw new Error(`Image compression failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
    }
  }
}

/**
 * Fallback client-side compression (used if backend compression fails)
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width (default: 800 for 20-30 KB target)
 * @param {number} maxHeight - Maximum height (default: 800 for 20-30 KB target)
 * @param {number} quality - JPEG quality 0-1 (default: 0.5 for aggressive compression)
 * @returns {Promise<string>} Base64 data URL of compressed image
 */
function fallbackCompressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.5) {
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
          compressedDataUrl = canvas.toDataURL('image/webp', quality);
        } catch (error) {
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
