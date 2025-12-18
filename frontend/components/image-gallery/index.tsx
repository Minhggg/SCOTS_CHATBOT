"use client";

import { useState, type FC } from 'react';
import { ImagePreview } from './image-preview';

type ImageGalleryProps = {
  srcs: string[];
};

const getWidthStyle = (imgNum: number) => {
  if (imgNum === 1) {
    return {
      maxWidth: '100%',
    };
  }

  if (imgNum === 2 || imgNum === 4) {
    return {
      width: 'calc(50% - 4px)',
    };
  }

  return {
    width: 'calc(33.3333% - 5.3333px)',
  };
};

export const ImageGallery: FC<ImageGalleryProps> = ({ srcs }) => {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  if (!srcs || srcs.length === 0) return null;

  const imgNum = srcs.length;
  const imgStyle = getWidthStyle(imgNum);

  return (
    <>
      <div className={`flex flex-wrap mb-2`}>
        {srcs.map((src, index) => (
          <img
            key={index}
            className="h-[200px] mr-2 mb-2 object-cover object-center rounded-lg cursor-pointer"
            style={{
              ...imgStyle,
              ...(imgNum === 2 || imgNum === 4
                ? index % 2 === 1
                  ? { marginRight: 0 }
                  : {}
                : index % 3 === 2
                  ? { marginRight: 0 }
                  : {}),
            }}
            src={src}
            alt=""
            onClick={() => setImagePreviewUrl(src)}
          />
        ))}
      </div>
      {imagePreviewUrl && (
        <ImagePreview
          url={imagePreviewUrl}
          onCancel={() => setImagePreviewUrl(null)}
        />
      )}
    </>
  );
};
