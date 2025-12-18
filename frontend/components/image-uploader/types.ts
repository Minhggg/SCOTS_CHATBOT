export enum TransferMethod {
  local_file = 'local_file',
  remote_url = 'remote_url',
}

export const ALLOW_FILE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

export interface ImageFile {
  _id: string;
  type: TransferMethod;
  fileId?: string;
  file?: File;
  url?: string;
  base64Url?: string;
  progress: number; // 0-100, -1 means error
  deleted?: boolean;
}

export interface VisionSettings {
  enabled: boolean;
  number_limits: number;
  detail?: 'low' | 'high' | 'auto';
  transfer_methods: TransferMethod[];
  image_file_size_limit?: number; // MB
}
