"use client";

import { useState, type FC } from 'react';
import { TransferMethod, type ImageFile } from './types';

type ImageLinkInputProps = {
  onUpload: (imageFile: ImageFile) => void;
  disabled?: boolean;
};

const regex = /^(https?|ftp):\/\//;

export const ImageLinkInput: FC<ImageLinkInputProps> = ({
  onUpload,
  disabled,
}) => {
  const [imageLink, setImageLink] = useState('');

  const handleClick = () => {
    if (disabled || !imageLink.trim()) return;

    const imageFile: ImageFile = {
      type: TransferMethod.remote_url,
      _id: `${Date.now()}`,
      fileId: '',
      progress: regex.test(imageLink) ? 0 : -1,
      url: imageLink,
    };

    onUpload(imageFile);
    setImageLink('');
  };

  return (
    <div className="flex items-center pl-1.5 pr-1 h-8 border border-gray-200 bg-white shadow-xs rounded-lg">
      <input
        type="text"
        className="grow mr-0.5 px-1 h-[18px] text-[13px] outline-none appearance-none"
        value={imageLink}
        onChange={(e) => setImageLink(e.target.value)}
        placeholder="Dán link ảnh..."
        onKeyDown={(e) => {
          if (e.key === 'Enter' && imageLink.trim()) {
            handleClick();
          }
        }}
      />
      <button
        type="button"
        className="h-6 px-2 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!imageLink.trim() || disabled}
        onClick={handleClick}
      >
        OK
      </button>
    </div>
  );
};
