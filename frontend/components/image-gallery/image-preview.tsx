"use client";

import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ImagePreviewProps = {
  url: string;
  onCancel: () => void;
};

export const ImagePreview = ({ url, onCancel }: ImagePreviewProps) => {
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 p-8 flex items-center justify-center bg-black/80 z-[1000]"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <img
        alt="preview image"
        src={url}
        className="max-w-full max-h-full rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <div
        className="absolute top-6 right-6 flex items-center justify-center w-8 h-8 bg-white/8 rounded-lg backdrop-blur-[2px] cursor-pointer hover:bg-white/20 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
      >
        <X className="w-4 h-4 text-white" />
      </div>
    </div>,
    document.body,
  );
};
