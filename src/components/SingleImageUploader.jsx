import React, { useState, useRef } from 'react';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';
import './SingleImageUploader.css';

function SingleImageUploader({ currentImage, onImageChange, label, folder = 'categories' }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file, { folder });
      onImageChange(imageUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <div className="single-image-uploader">
      {label && <label className="uploader-label">{label}</label>}
      <div 
        className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${currentImage ? 'has-image' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e.target.files[0])}
          accept="image/*"
          style={{ display: 'none' }}
        />
        
        {isUploading ? (
          <div className="upload-loading">
            <div className="spinner"></div>
            <p>Uploading...</p>
          </div>
        ) : currentImage ? (
          <div className="image-preview-container">
            <img src={currentImage} alt="Preview" className="image-preview" />
            <div className="preview-overlay">
              <span>Change Image</span>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📁</div>
            <p>Drag & drop or click to upload</p>
            <span className="upload-hint">PNG, JPG or WebP</span>
          </div>
        )}
      </div>
      
      <div className="url-input-section">
        <label>Or use Image URL</label>
        <input 
          type="url" 
          value={currentImage || ''} 
          onChange={(e) => onImageChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="url-input"
        />
      </div>
    </div>
  );
}

export default SingleImageUploader;
