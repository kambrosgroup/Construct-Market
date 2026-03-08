import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { API } from '../../App';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Upload, X, Image, File, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function FileUpload({ 
  onUpload, 
  category = 'general', 
  accept = { 'image/*': ['.jpg', '.jpeg', '.png', '.gif'] },
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024 // 10MB
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles
  });

  const removeFile = (id) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    const uploadedFiles = [];

    for (const fileObj of files) {
      if (fileObj.status === 'uploaded') continue;

      try {
        setProgress(prev => ({ ...prev, [fileObj.id]: 0 }));
        
        const formData = new FormData();
        formData.append('file', fileObj.file);
        formData.append('category', category);

        const token = localStorage.getItem('token');
        const response = await axios.post(`${API}/files/upload`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / e.total);
            setProgress(prev => ({ ...prev, [fileObj.id]: percent }));
          }
        });

        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'uploaded', url: response.data.url } : f
        ));
        uploadedFiles.push(response.data);
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'error' } : f
        ));
        toast.error(`Failed to upload ${fileObj.file.name}`);
      }
    }

    setUploading(false);
    
    if (uploadedFiles.length > 0 && onUpload) {
      onUpload(uploadedFiles);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
        {isDragActive ? (
          <p className="text-primary font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="font-medium">Drag & drop files here</p>
            <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
            <p className="text-xs text-muted-foreground mt-2">
              Max {maxFiles} files, up to {formatSize(maxSize)} each
            </p>
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileObj) => (
            <div 
              key={fileObj.id} 
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              {/* Preview */}
              {fileObj.file.type.startsWith('image/') ? (
                <img 
                  src={fileObj.preview} 
                  alt={fileObj.file.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                  <File className="h-6 w-6 text-muted-foreground" />
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileObj.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(fileObj.file.size)}</p>
                
                {/* Progress Bar */}
                {uploading && progress[fileObj.id] !== undefined && fileObj.status === 'pending' && (
                  <Progress value={progress[fileObj.id]} className="h-1 mt-2" />
                )}
              </div>

              {/* Status */}
              {fileObj.status === 'uploaded' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {fileObj.status === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}

              {/* Remove Button */}
              {!uploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(fileObj.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && files.some(f => f.status === 'pending') && (
        <Button 
          onClick={uploadFiles} 
          disabled={uploading}
          className="w-full gap-2"
        >
          {uploading ? (
            <>Uploading...</>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload {files.filter(f => f.status === 'pending').length} File(s)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
