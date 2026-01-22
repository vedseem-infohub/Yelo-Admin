import React, { useState, useRef, useEffect } from 'react';
import { uploadImagesToCloudinary } from '../utils/cloudinaryUpload';
import './ImageUploader.css';

function ImageUploader({ images = [], onChange, maxImages = 10 }) {
  const [imageList, setImageList] = useState(() => {
    // Initialize with existing images
    if (images && images.length > 0) {
      return images.map((img, idx) => ({
        id: `img-${idx}-${Date.now()}`,
        url: typeof img === 'string' ? img : img.url || img,
        isPrimary: typeof img === 'object' ? (img.isPrimary || idx === 0) : idx === 0,
        file: null,
        preview: typeof img === 'string' ? img : img.url || img
      }));
    }
    return [];
  });

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragOverZone, setIsDragOverZone] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Sync with external images prop changes when product changes
  const prevImagesRef = useRef();
  useEffect(() => {
    // Only update if images prop actually changed (not from our own updates)
    if (prevImagesRef.current !== images) {
      prevImagesRef.current = images;
      if (images && images.length > 0) {
        const formatted = images.map((img, idx) => ({
          id: `img-${idx}-${Date.now()}`,
          url: typeof img === 'string' ? img : img.url || img,
          isPrimary: typeof img === 'object' ? (img.isPrimary || idx === 0) : idx === 0,
          file: null,
          preview: typeof img === 'string' ? img : img.url || img
        }));
        setImageList(formatted);
      } else if (!images || images.length === 0) {
        setImageList([]);
      }
    }
  }, [images]);

  const handleImageChange = (newImageList) => {
    setImageList(newImageList);
    // Convert to format expected by parent
    const formattedImages = newImageList.map(img => ({
      url: img.url || img.preview,
      isPrimary: img.isPrimary,
      alt: img.alt || ''
    }));
    onChange(formattedImages);
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (files) => {
    const fileArray = Array.from(files).filter(file => {
      const isImage = file.type && file.type.startsWith('image/');
      if (!isImage) {
        console.warn(`Skipping non-image file: ${file.name}`);
      }
      return isImage;
    });

    if (fileArray.length === 0) {
      alert('Please select image files only');
      return;
    }

    setIsUploading(true);

    try {
      console.log(`📤 Uploading ${fileArray.length} images to Cloudinary...`);

      const cloudinaryUrls = await uploadImagesToCloudinary(fileArray, { folder: 'products' });

      if (!cloudinaryUrls || cloudinaryUrls.length === 0) {
        throw new Error('Upload returned no results');
      }

      console.log(`✅ Received ${cloudinaryUrls.length} Cloudinary URLs`);

      const newImages = cloudinaryUrls.map((url, index) => ({
        id: `img-${Date.now()}-${Math.random()}-${index}`,
        url: url,
        preview: url,
        file: null,
        isPrimary: imageList.length === 0 && index === 0,
        alt: fileArray[index].name || ''
      }));

      const updatedList = [...imageList, ...newImages];
      handleImageChange(updatedList);

      console.log(`✅ ${newImages.length} images added to list`);
    } catch (error) {
      console.error('❌ Error uploading images:', error);
      alert('Failed to upload images: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const remainingSlots = maxImages - imageList.length;
      if (remainingSlots > 0) {
        const filesToAdd = Array.from(files).slice(0, remainingSlots);
        handleFileSelect(filesToAdd);
      } else {
        alert(`Maximum ${maxImages} images allowed`);
      }
    }

    setDragOverIndex(null);
    setIsDragOverZone(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy'; // Show copy cursor
    setIsDragOverZone(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if we're dragging files (not text/html/etc)
    if (e.dataTransfer.types && (
      Array.from(e.dataTransfer.types).includes('Files') ||
      Array.from(e.dataTransfer.types).some(type => type.startsWith('application/'))
    )) {
      setIsDragOverZone(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're actually leaving the drop zone
    // relatedTarget might be null or a child element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Check if mouse is still within the drop zone bounds
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOverZone(false);
    }
  };

  const handleAddUrl = () => {
    const newImage = {
      id: `img-${Date.now()}`,
      url: '',
      preview: '',
      file: null,
      isPrimary: imageList.length === 0
    };
    handleImageChange([...imageList, newImage]);
  };

  const handleRemoveImage = (id) => {
    const updatedList = imageList.filter(img => img.id !== id);
    // If removed image was primary, make first image primary
    const removedWasPrimary = imageList.find(img => img.id === id)?.isPrimary;
    if (removedWasPrimary && updatedList.length > 0) {
      updatedList[0].isPrimary = true;
    }
    handleImageChange(updatedList);
  };

  const handleSetPrimary = (id) => {
    const updatedList = imageList.map(img => ({
      ...img,
      isPrimary: img.id === id
    }));
    handleImageChange(updatedList);
  };

  const handleUrlChange = (id, url) => {
    const updatedList = imageList.map(img =>
      img.id === id ? { ...img, url, preview: url || img.preview } : img
    );
    handleImageChange(updatedList);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOverItem = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDropItem = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newList = [...imageList];
      const [removed] = newList.splice(draggedIndex, 1);
      newList.splice(dropIndex, 0, removed);
      handleImageChange(newList);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="image-uploader">
      <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
        Product Images
      </label>

      {/* Drop Zone */}
      {imageList.length < maxImages && (
        <div
          ref={dropZoneRef}
          className={`drop-zone ${isDragOverZone ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={(e) => {
            // Only trigger file input if not clicking on child elements that have their own handlers
            if (e.target === e.currentTarget || e.target.closest('.drop-zone-content')) {
              fileInputRef.current?.click();
            }
          }}
          style={{ position: 'relative' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files.length > 0) {
                handleFileSelect(e.target.files);
              }
            }}
          />
          <div className="drop-zone-content">
            <div className="drop-zone-icon">📷</div>
            {isUploading ? (
              <>
                <p>Uploading images to Cloudinary...</p>
                <p className="drop-zone-hint">Please wait</p>
              </>
            ) : (
              <>
                <p>Drag & drop images here or click to browse</p>
                <p className="drop-zone-hint">You can add up to {maxImages} images</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Image List */}
      {imageList.length > 0 && (
        <div className="image-list">
          {imageList.map((image, index) => (
            <div
              key={image.id}
              className={`image-item ${image.isPrimary ? 'primary' : ''} ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOverItem(e, index)}
              onDrop={(e) => handleDropItem(e, index)}
            >
              {/* Image Preview */}
              <div className="image-preview-wrapper">
                {image.preview ? (
                  <img
                    src={image.preview}
                    alt={`Preview ${index + 1}`}
                    className="image-preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="image-placeholder" style={{ display: image.preview ? 'none' : 'flex' }}>
                  No Image
                </div>

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="primary-badge">Primary</div>
                )}
              </div>

              {/* URL Input */}
              <div className="image-controls">
                <input
                  type="url"
                  value={image.url}
                  onChange={(e) => handleUrlChange(image.id, e.target.value)}
                  placeholder="Enter image URL or upload file"
                  className="image-url-input"
                />

                <div className="image-actions">
                  <button
                    type="button"
                    className={`btn-set-primary ${image.isPrimary ? 'active' : ''}`}
                    onClick={() => handleSetPrimary(image.id)}
                    title="Set as primary image"
                  >
                    ⭐
                  </button>
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={() => handleRemoveImage(image.id)}
                    title="Remove image"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add URL Button */}
      {imageList.length < maxImages && (
        <button
          type="button"
          className="btn-add-image"
          onClick={handleAddUrl}
        >
          + Add Image URL
        </button>
      )}
    </div>
  );
}

export default ImageUploader;

