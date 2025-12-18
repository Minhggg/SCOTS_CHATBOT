import { getToken } from '../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_MIAGENT_API_URL || "http://localhost:5001";

type ImageUploadParams = {
  file: File;
  onProgressCallback: (progress: number) => void;
  onSuccessCallback: (res: { id: string }) => void;
  onErrorCallback: () => void;
};

export const imageUpload = ({
  file,
  onProgressCallback,
  onSuccessCallback,
  onErrorCallback,
}: ImageUploadParams) => {
  const token = getToken();

  if (!token) {
    onErrorCallback();
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percent = Math.floor((e.loaded / e.total) * 100);
      onProgressCallback(percent);
    }
  });

  xhr.addEventListener('load', () => {
    if (xhr.status === 201) {
      try {
        const res = JSON.parse(xhr.responseText);
        onSuccessCallback(res);
      } catch (error) {
        onErrorCallback();
      }
    } else {
      onErrorCallback();
    }
  });

  xhr.addEventListener('error', () => {
    onErrorCallback();
  });

  xhr.open('POST', `${API_URL}/console/api/files/upload`);
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  xhr.send(formData);
};
