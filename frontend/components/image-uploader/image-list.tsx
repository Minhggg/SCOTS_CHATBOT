"use client";

import { useState, type FC } from 'react';
import { X, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { TransferMethod, type ImageFile } from './types';

type ImageListProps = {
  list: ImageFile[];
  readonly?: boolean;
  onRemove?: (imageFileId: string) => void;
  onReUpload?: (imageFileId: string) => void;
  onImageLinkLoadSuccess?: (imageFileId: string) => void;
  onImageLinkLoadError?: (imageFileId: string) => void;
};

export const ImageList: FC<ImageListProps> = ({
  list,
  readonly,
  onRemove,
  onReUpload,
  onImageLinkLoadSuccess,
  onImageLinkLoadError,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageLinkLoadSuccess = (item: ImageFile) => {
    if (item.type === TransferMethod.remote_url && onImageLinkLoadSuccess && item.progress !== -1) {
      onImageLinkLoadSuccess(item._id);
    }
  };

  const handleImageLinkLoadError = (item: ImageFile) => {
    if (item.type === TransferMethod.remote_url && onImageLinkLoadError) {
      onImageLinkLoadError(item._id);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {list.map((item) => (
          <div
            key={item._id}
            className="group relative border-[0.5px] border-black/5 rounded-lg"
          >
            {/* Upload progress overlay */}
            {item.type === TransferMethod.local_file && item.progress !== 100 && (
              <>
                <div
                  className="absolute inset-0 flex items-center justify-center z-[1] bg-black/30 rounded-lg"
                  style={{ left: item.progress > -1 ? `${item.progress}%` : 0 }}
                >
                  {item.progress === -1 && onReUpload && (
                    <RefreshCw
                      className="w-5 h-5 text-white cursor-pointer"
                      onClick={() => onReUpload(item._id)}
                    />
                  )}
                </div>
                {item.progress > -1 && (
                  <span className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] text-sm text-white mix-blend-lighten z-[1]">
                    {item.progress}%
                  </span>
                )}
              </>
            )}

            {/* Remote URL loading/error overlay */}
            {item.type === TransferMethod.remote_url && item.progress !== 100 && (
              <div
                className={`
                  absolute inset-0 flex items-center justify-center rounded-lg z-[1] border
                  ${item.progress === -1
                    ? 'bg-[#FEF0C7] border-[#DC6803]'
                    : 'bg-black/[0.16] border-transparent'
                  }
                `}
              >
                {item.progress > -1 && (
                  <Loader2 className="animate-spin w-5 h-5 text-white" />
                )}
                {item.progress === -1 && (
                  <AlertTriangle className="w-4 h-4 text-[#DC6803]" title="Link ảnh không hợp lệ" />
                )}
              </div>
            )}

            <img
              className="w-16 h-16 rounded-lg object-cover cursor-pointer border-[0.5px] border-black/5"
              alt={item.file?.name || 'Uploaded image'}
              onLoad={() => handleImageLinkLoadSuccess(item)}
              onError={() => handleImageLinkLoadError(item)}
              src={
                item.type === TransferMethod.remote_url
                  ? item.url
                  : item.base64Url
              }
              onClick={() => {
                if (item.progress === 100) {
                  setPreviewUrl(
                    (item.type === TransferMethod.remote_url ? item.url : item.base64Url) || null
                  );
                }
              }}
            />

            {!readonly && (
              <button
                type="button"
                className={`
                  absolute z-10 -top-[9px] -right-[9px] items-center justify-center w-[18px] h-[18px]
                  bg-white hover:bg-gray-50 border-[0.5px] border-black/2 rounded-2xl shadow-lg
                  ${item.progress === -1 ? 'flex' : 'hidden group-hover:flex'}
                `}
                onClick={() => onRemove && onRemove(item._id)}
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              onClick={() => setPreviewUrl(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};
