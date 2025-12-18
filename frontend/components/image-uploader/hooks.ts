"use client";

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { imageUpload } from './utils';
import { ALLOW_FILE_EXTENSIONS, TransferMethod, type ImageFile, type VisionSettings } from './types';

export const useImageFiles = () => {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const filesRef = useRef<ImageFile[]>([]);

  const handleUpload = (imageFile: ImageFile) => {
    const currentFiles = filesRef.current;
    const index = currentFiles.findIndex(file => file._id === imageFile._id);

    if (index > -1) {
      // Update existing file
      const newFiles = [...currentFiles.slice(0, index), { ...currentFiles[index], ...imageFile }, ...currentFiles.slice(index + 1)];
      setFiles(newFiles);
      filesRef.current = newFiles;
    } else {
      // Add new file
      const newFiles = [...currentFiles, imageFile];
      setFiles(newFiles);
      filesRef.current = newFiles;
    }
  };

  const handleRemove = (imageFileId: string) => {
    const currentFiles = filesRef.current;
    const newFiles = currentFiles.filter(file => file._id !== imageFileId);
    setFiles(newFiles);
    filesRef.current = newFiles;
  };

  const handleImageLinkLoadError = (imageFileId: string) => {
    const currentFiles = filesRef.current;
    const index = currentFiles.findIndex(file => file._id === imageFileId);
    if (index > -1) {
      const newFiles = [...currentFiles.slice(0, index), { ...currentFiles[index], progress: -1 }, ...currentFiles.slice(index + 1)];
      filesRef.current = newFiles;
      setFiles(newFiles);
    }
  };

  const handleImageLinkLoadSuccess = (imageFileId: string) => {
    const currentFiles = filesRef.current;
    const index = currentFiles.findIndex(file => file._id === imageFileId);
    if (index > -1) {
      const newFiles = [...currentFiles.slice(0, index), { ...currentFiles[index], progress: 100 }, ...currentFiles.slice(index + 1)];
      filesRef.current = newFiles;
      setFiles(newFiles);
    }
  };

  const handleReUpload = (imageFileId: string) => {
    const currentFiles = filesRef.current;
    const index = currentFiles.findIndex(file => file._id === imageFileId);
    if (index > -1 && currentFiles[index].file) {
      const currentImageFile = currentFiles[index];
      imageUpload({
        file: currentImageFile.file!,
        onProgressCallback: (progress) => {
          const newFiles = [...currentFiles.slice(0, index), { ...currentImageFile, progress }, ...currentFiles.slice(index + 1)];
          filesRef.current = newFiles;
          setFiles(newFiles);
        },
        onSuccessCallback: (res) => {
          const newFiles = [...currentFiles.slice(0, index), { ...currentImageFile, fileId: res.id, progress: 100 }, ...currentFiles.slice(index + 1)];
          filesRef.current = newFiles;
          setFiles(newFiles);
        },
        onErrorCallback: () => {
          const newFiles = [...currentFiles.slice(0, index), { ...currentImageFile, progress: -1 }, ...currentFiles.slice(index + 1)];
          filesRef.current = newFiles;
          setFiles(newFiles);
        },
      });
    }
  };

  const handleClear = () => {
    setFiles([]);
    filesRef.current = [];
  };

  const filteredFiles = useMemo(() => {
    return files.filter(file => !file.deleted);
  }, [files]);

  return {
    files: filteredFiles,
    onUpload: handleUpload,
    onRemove: handleRemove,
    onImageLinkLoadError: handleImageLinkLoadError,
    onImageLinkLoadSuccess: handleImageLinkLoadSuccess,
    onReUpload: handleReUpload,
    onClear: handleClear,
  };
};

type useLocalFileUploaderProps = {
  disabled?: boolean;
  limit?: number; // MB
  onUpload: (imageFile: ImageFile) => void;
};

export const useLocalFileUploader = ({ limit, disabled = false, onUpload }: useLocalFileUploaderProps) => {
  const handleLocalFileUpload = useCallback((file: File) => {
    if (disabled) return;

    const fileExtension = file.type.split('/')[1]?.toLowerCase();
    if (!ALLOW_FILE_EXTENSIONS.includes(fileExtension)) {
      console.error('Unsupported file type');
      return;
    }

    if (limit && file.size > limit * 1024 * 1024) {
      console.error(`File size exceeded. Max: ${limit}MB`);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const imageFile: ImageFile = {
        type: TransferMethod.local_file,
        _id: `${Date.now()}`,
        fileId: '',
        file,
        url: reader.result as string,
        base64Url: reader.result as string,
        progress: 0,
      };
      onUpload(imageFile);
      
      // Upload to server
      imageUpload({
        file: imageFile.file!,
        onProgressCallback: (progress) => {
          onUpload({ ...imageFile, progress });
        },
        onSuccessCallback: (res) => {
          onUpload({ ...imageFile, fileId: res.id, progress: 100 });
        },
        onErrorCallback: () => {
          onUpload({ ...imageFile, progress: -1 });
        },
      });
    }, false);

    reader.addEventListener('error', () => {
      console.error('Error reading file');
    }, false);

    reader.readAsDataURL(file);
  }, [disabled, limit, onUpload]);

  return { handleLocalFileUpload };
};

type useClipboardUploaderProps = {
  files: ImageFile[];
  visionConfig?: VisionSettings;
  onUpload: (imageFile: ImageFile) => void;
};

export const useClipboardUploader = ({ visionConfig, onUpload, files }: useClipboardUploaderProps) => {
  const allowLocalUpload = visionConfig?.transfer_methods?.includes(TransferMethod.local_file);
  const disabled = useMemo(() =>
    !visionConfig
    || !visionConfig?.enabled
    || !allowLocalUpload
    || files.length >= (visionConfig.number_limits || 0),
  [allowLocalUpload, files.length, visionConfig]);
  const limit = useMemo(() => visionConfig ? +(visionConfig.image_file_size_limit || 0) : 0, [visionConfig]);
  const { handleLocalFileUpload } = useLocalFileUploader({ limit, onUpload, disabled });

  const handleClipboardPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const file = e.clipboardData?.files[0];
    if (file) {
      e.preventDefault();
      handleLocalFileUpload(file);
    }
  }, [handleLocalFileUpload]);

  return {
    onPaste: handleClipboardPaste,
  };
};

type useDraggableUploaderProps = {
  files: ImageFile[];
  visionConfig?: VisionSettings;
  onUpload: (imageFile: ImageFile) => void;
};

export const useDraggableUploader = <T extends HTMLElement>({ visionConfig, onUpload, files }: useDraggableUploaderProps) => {
  const allowLocalUpload = visionConfig?.transfer_methods?.includes(TransferMethod.local_file);
  const disabled = useMemo(() =>
    !visionConfig
    || !visionConfig?.enabled
    || !allowLocalUpload
    || files.length >= (visionConfig.number_limits || 0),
  [allowLocalUpload, files.length, visionConfig]);
  const limit = useMemo(() => visionConfig ? +(visionConfig.image_file_size_limit || 0) : 0, [visionConfig]);
  const { handleLocalFileUpload } = useLocalFileUploader({ disabled, onUpload, limit });
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<T>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragActive(true);
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent<T>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<T>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<T>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    handleLocalFileUpload(file);
  }, [handleLocalFileUpload]);

  return {
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    isDragActive,
  };
};
