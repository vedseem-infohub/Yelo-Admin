const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export async function uploadImageToCloudinary(file, options = {}) {
  const { folder = 'products', filename } = options;

  try {
    console.log(` Uploading image to Cloudinary: ${file.name}`);
    console.log(`File size: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`Target folder: ${folder}`);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    if (filename) {
      formData.append('filename', filename);
    }

    const response = await fetch(`${API_URL}/upload/compress-image`, {
      method: 'POST',
      body: formData
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(' Upload failed:', errorData);
      throw new Error(errorData.message || `Upload failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data || !result.data.url) {
      console.error('Invalid response format:', result);
      throw new Error('Invalid response from upload service');
    }

    console.log(`Image uploaded successfully!`);
    console.log(`Cloudinary URL: ${result.data.url}`);
    console.log(`Public ID: ${result.data.publicId}`);

    return result.data.url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

export async function uploadImagesToCloudinary(files, options = {}) {
  const { folder = 'products' } = options;

  try {
    console.log(` Uploading ${files.length} images to Cloudinary...`);
    console.log(`Target folder: ${folder}`);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
      console.log(` ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    });
    formData.append('folder', folder);

    console.log(`Making request to: ${API_URL}/upload/compress-images`);

    const response = await fetch(`${API_URL}/upload/compress-images`, {
      method: 'POST',
      body: formData
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(' Upload failed:', errorData);
      throw new Error(errorData.message || `Upload failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data || !Array.isArray(result.data)) {
      console.error('Invalid response format:', result);
      throw new Error('Invalid response from upload service');
    }

    const successfulUploads = result.data.filter(item => !item.error);
    const failedUploads = result.data.filter(item => item.error);

    console.log(` Upload complete: ${successfulUploads.length} successful, ${failedUploads.length} failed`);

    if (failedUploads.length > 0) {
      console.warn(` ${failedUploads.length} upload(s) failed:`, failedUploads);
    }

    return successfulUploads.map(item => item.url);
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}
