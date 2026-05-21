import api from '../lib/api';
import type { MediaUploadResponse } from '../types';

export const mediaApi = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<{ data: MediaUploadResponse }>('/media/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
