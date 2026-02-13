import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/core/components/atomic/Button';
import { FILE_ACCEPT, MAX_FILE_SIZE, MAX_FILE_SIZE_DISPLAY, SUPPORTED_FORMATS } from '../imports.constants';

interface ImportUploadZoneProps {
  onFileSelect: (file: File) => void;
  onUpload: () => void;
  onCancel: () => void;
  selectedFile: File | null;
  isUploading?: boolean;
  error?: string | null;
}

/**
 * Drag and drop upload zone for import files
 * Supports CSV, XLSX, and XLS file formats
 */
export const ImportUploadZone = ({
  onFileSelect,
  onUpload,
  onCancel,
  selectedFile,
  isUploading = false,
  error = null,
}: ImportUploadZoneProps) => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): boolean => {
    setValidationError(null);

    // Check file extension
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!SUPPORTED_FORMATS.includes(extension as typeof SUPPORTED_FORMATS[number])) {
      setValidationError(t('imports.errors.invalidFormat'));
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setValidationError(t('imports.errors.fileTooLarge', { maxSize: MAX_FILE_SIZE_DISPLAY }));
      return false;
    }

    return true;
  }, [t]);

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  }, [validateFile, onFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const handleButtonClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleClear = useCallback(() => {
    setValidationError(null);
    onCancel();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onCancel]);

  const displayError = error || validationError;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : displayError
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className={`h-12 w-12 mx-auto mb-4 ${displayError ? 'text-red-400' : 'text-gray-400'}`} />
        <p className="text-gray-600 mb-2">
          {t('imports.dragAndDrop')}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          {t('imports.supportedFormats')}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={FILE_ACCEPT}
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          disabled={isUploading}
        />
        <Button
          variant="secondary"
          onClick={handleButtonClick}
          disabled={isUploading}
        >
          {t('imports.selectFile')}
        </Button>
      </div>

      {/* Error Display */}
      {displayError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{displayError}</span>
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && !displayError && (
        <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleClear}
              disabled={isUploading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={onUpload}
              disabled={isUploading}
            >
              {isUploading ? t('imports.uploading') : t('imports.startImport')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportUploadZone;
