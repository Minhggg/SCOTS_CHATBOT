"use client";

import { useState, type FC } from 'react';
import { ImagePlus, Upload } from 'lucide-react';
import { Uploader } from './uploader';
import { ImageLinkInput } from './image-link-input';
import { TransferMethod, type ImageFile, type VisionSettings } from './types';

type UploadOnlyFromLocalProps = {
  onUpload: (imageFile: ImageFile) => void;
  disabled?: boolean;
  limit?: number;
};

const UploadOnlyFromLocal: FC<UploadOnlyFromLocalProps> = ({
  onUpload,
  disabled,
  limit,
}) => {
  return (
    <Uploader onUpload={onUpload} disabled={disabled} limit={limit}>
      {(hovering) => (
        <div
          className={`
            relative flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer
            ${hovering && !disabled ? 'bg-gray-100' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <ImagePlus className="w-4 h-4 text-gray-500" />
        </div>
      )}
    </Uploader>
  );
};

type UploaderButtonProps = {
  methods: VisionSettings['transfer_methods'];
  onUpload: (imageFile: ImageFile) => void;
  disabled?: boolean;
  limit?: number;
};

const UploaderButton: FC<UploaderButtonProps> = ({
  methods,
  onUpload,
  disabled,
  limit,
}) => {
  const [open, setOpen] = useState(false);

  const hasUploadFromLocal = methods.includes(TransferMethod.local_file);

  const handleUpload = (imageFile: ImageFile) => {
    onUpload(imageFile);
  };

  const closePopover = () => setOpen(false);

  const handleToggle = () => {
    if (disabled) return;
    setOpen(v => !v);
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className="relative flex items-center justify-center w-8 h-8 enabled:hover:bg-gray-100 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ImagePlus className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={closePopover}
          />
          {/* Popover */}
          <div className="absolute bottom-full left-0 mb-2 p-2 w-[260px] bg-white rounded-lg border-[0.5px] border-gray-200 shadow-lg z-50">
            <ImageLinkInput onUpload={handleUpload} disabled={disabled} />
            {hasUploadFromLocal && (
              <>
                <div className="flex items-center mt-2 px-2 text-xs font-medium text-gray-400">
                  <div className="mr-3 w-[93px] h-[1px] bg-gradient-to-l from-[#F3F4F6]" />
                  HOẶC
                  <div className="ml-3 w-[93px] h-[1px] bg-gradient-to-r from-[#F3F4F6]" />
                </div>
                <Uploader
                  onUpload={handleUpload}
                  limit={limit}
                  closePopover={closePopover}
                >
                  {(hovering) => (
                    <div
                      className={`
                        flex items-center justify-center h-8 text-[13px] font-medium text-[#155EEF] rounded-lg cursor-pointer
                        ${hovering ? 'bg-blue-50' : ''}
                      `}
                    >
                      <Upload className="mr-1 w-4 h-4" />
                      Tải từ máy tính
                    </div>
                  )}
                </Uploader>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

type ChatImageUploaderProps = {
  settings: VisionSettings;
  onUpload: (imageFile: ImageFile) => void;
  disabled?: boolean;
};

export const ChatImageUploader: FC<ChatImageUploaderProps> = ({
  settings,
  onUpload,
  disabled,
}) => {
  const onlyUploadLocal =
    settings.transfer_methods.length === 1 &&
    settings.transfer_methods[0] === TransferMethod.local_file;

  if (onlyUploadLocal) {
    return (
      <UploadOnlyFromLocal
        onUpload={onUpload}
        disabled={disabled}
        limit={settings.image_file_size_limit ? +settings.image_file_size_limit : undefined}
      />
    );
  }

  return (
    <UploaderButton
      methods={settings.transfer_methods}
      onUpload={onUpload}
      disabled={disabled}
      limit={settings.image_file_size_limit ? +settings.image_file_size_limit : undefined}
    />
  );
};
