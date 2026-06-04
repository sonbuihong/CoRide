'use client';

import React, { useState, useRef } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { Button } from '../ui/button';
import apiClient from '../../lib/api-client';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onUploadSuccess: (newUrl: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentAvatarUrl, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const response = await apiClient.post('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onUploadSuccess(response.data.avatarUrl);
    } catch (error) {
      console.error('Lỗi upload avatar:', error);
      alert('Không thể tải ảnh đại diện. Vui lòng thử lại.');
      setPreview(null); // Reset preview on error
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/10 bg-muted group">
        {preview || currentAvatarUrl ? (
          <img
            src={preview || currentAvatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <User className="w-16 h-16 text-secondary-foreground/50" />
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
        
        <button
          onClick={handleClick}
          disabled={uploading}
          className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:hidden"
          type="button"
        >
          <Camera className="w-8 h-8 text-white" />
        </button>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={uploading}
        className="text-xs"
        type="button"
      >
        Thay đổi ảnh đại diện
      </Button>
    </div>
  );
};
