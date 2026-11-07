'use client';

import {
  useState,
  useRef,
  useEffect,
  type DragEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileImage,
  X,
  AlertCircle,
  Sparkles,
  Loader2,
  HelpCircle,
  Layers,
  Wrench,
  Package,
  Cpu,
  Camera,
} from 'lucide-react';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/constants';
import { uploadAndInspect } from '@/lib/api-client';
import { useNotification } from './NotificationProvider';
import type {
  DemoSampleItem,
  ProductCategory,
} from '@/lib/types';

interface InspectionUploadViewProps {
  samples: DemoSampleItem[];
}

export function InspectionUploadView({
  samples,
}: InspectionUploadViewProps) {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory>('Auto Detect / General');
  const [selectedSample, setSelectedSample] =
    useState<DemoSampleItem | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [inspectionStep, setInspectionStep] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => undefined);
    }
  }, [isCameraActive]);

  const startCamera = async () => {
    setCameraError(null);
    setValidationError(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      const message =
        'Camera is not supported in this browser. Please upload a file instead.';
      setCameraError(message);
      setValidationError(message);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err: any) {
      const message =
        err?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access or upload a file instead.'
          : err?.name === 'NotFoundError'
            ? 'No camera was found on this device. Please upload a file instead.'
            : 'Unable to access the camera. Please upload a file instead.';
      setCameraError(message);
      setValidationError(message);
      showNotification('error', message);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return;
    }

    const maxDimension = 1920;
    let width = video.videoWidth;
    let height = video.videoHeight;
    if (Math.max(width, height) > maxDimension) {
      const scale = maxDimension / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('Could not capture the photo. Please try again.');
      return;
    }
    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('Could not capture the photo. Please try again.');
          return;
        }
        const file = new File(
          [blob],
          `camera-capture-${Date.now()}.jpg`,
          { type: 'image/jpeg' }
        );
        stopCamera();
        handleFileChange(file);
      },
      'image/jpeg',
      0.9
    );
  };

  const categories: { label: ProductCategory; icon: any }[] = [
    { label: 'Auto Detect / General', icon: Sparkles },
    { label: 'Metal Part', icon: Wrench },
    { label: 'Bottle / Packaging', icon: Package },
    { label: 'Electronic Component', icon: Cpu },
    { label: 'Clothing / Fabric', icon: Layers },
    { label: 'Other', icon: HelpCircle },
  ];

  const handleFileChange = (file: File) => {
    setValidationError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setValidationError(
        'Unsupported format. Please upload JPG, PNG, or WEBP.'
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError('File size exceeds the 4 MB limit.');
      return;
    }

    setSelectedFile(file);
    setSelectedSample(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSampleSelect = (sample: DemoSampleItem) => {
    setValidationError(null);
    setSelectedSample(sample);
    setSelectedFile(null);
    setPreviewUrl(sample.imagePath);
    setSelectedCategory(sample.category);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setSelectedSample(null);
    if (previewUrl && !selectedSample) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile && !selectedSample) {
      setValidationError(
        'Please select or upload a product photo to inspect.'
      );
      return;
    }

    setIsLoading(true);
    try {
      setInspectionStep('Uploading image to secure storage...');
      setTimeout(() => {
        setInspectionStep(
          'Executing multimodal Gemini Vision defect analysis...'
        );
      }, 900);
      setTimeout(() => {
        setInspectionStep(
          'Validating bounding boxes & saving audit log...'
        );
      }, 2100);

      const result = await uploadAndInspect(
        selectedFile,
        selectedCategory,
        selectedSample ? selectedSample.imagePath : undefined
      );

      showNotification(
        'success',
        'Inspection completed and audit record logged.'
      );
      router.push(`/results/${result.inspection.id}`);
      router.refresh();
    } catch (err: any) {
      const message = err.message || 'Inspection failed';
      setValidationError(message);
      showNotification('error', message);
    } finally {
      setInspectionStep('');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
          New Quality Inspection
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload or capture a clear photograph of a single manufactured item or
          component to run automated defect screening.
        </p>
      </div>

      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
              Try Preset Test Samples
            </span>
            <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">
              1-Click Instant Demo
            </span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Click any test asset below to auto-load
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {samples.map((s) => {
            const isSelected = selectedSample?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSampleSelect(s)}
                className={`text-left p-2 rounded-lg border transition-all flex flex-col justify-between group ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/70'
                }`}
              >
                <div>
                  <div className="relative aspect-4/3 rounded overflow-hidden bg-slate-100 mb-2">
                    <img
                      src={s.imagePath}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div
                      className={`absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs ${
                        s.expectedOutcome === 'FAIL'
                          ? 'bg-rose-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {s.expectedOutcome}
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-900 line-clamp-1">
                    {s.title}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                  {s.defectSummary}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-display">
            Step 1: Product Category (Recommended)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {categories.map((c) => {
              const Icon = c.icon;
              const isSelected = selectedCategory === c.label;
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setSelectedCategory(c.label)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isSelected ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
              Step 2: Upload or Capture Product Photograph
            </label>
            <span className="text-[11px] text-slate-500">
              JPG, PNG, or WEBP up to 4 MB
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          {previewUrl ? (
            <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="relative max-h-96 w-full rounded-lg overflow-hidden flex items-center justify-center bg-slate-900/5">
                <img
                  src={previewUrl}
                  alt="Inspection candidate"
                  className="max-h-96 w-auto object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-700 min-w-0">
                  <FileImage className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold truncate">
                    {selectedSample ? selectedSample.title : selectedFile?.name}
                  </span>
                  {selectedSample && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                      Demo Asset
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 hover:bg-blue-50 rounded"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Use Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 hover:bg-blue-50 rounded"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-slate-500 hover:text-rose-600 p-1 hover:bg-rose-50 rounded"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/30 hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-display mb-1">
                Drop your product photo here, or click to browse
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Position the camera perpendicular to the defect area with
                clear, uniform lighting.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs"
                >
                  Select File from Computer
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCamera();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  Use Camera
                </button>
              </div>
            </div>
          )}
        </div>

        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <span className="font-semibold">Inspection Error:</span>{' '}
              {validationError}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div className="text-xs font-bold text-blue-900">
                AI Vision Pipeline in Progress...
              </div>
            </div>
            <div className="text-xs text-blue-800 pl-8">
              {inspectionStep || 'Communicating with Gemini Vision AI...'}
            </div>
            <div className="w-full bg-blue-200/50 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading || (!selectedFile && !selectedSample)}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors"
          >
            Clear Selection
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || (!selectedFile && !selectedSample)}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 font-display"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Image...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Inspect Image</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isCameraActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 font-display">
                <Camera className="w-4 h-4 text-blue-600" />
                Capture Product Photo
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
                aria-label="Close camera"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-[60vh] object-contain"
              />
            </div>

            {cameraError && (
              <div className="px-4 py-2 text-xs text-rose-700 bg-rose-50 border-t border-rose-100">
                {cameraError}
              </div>
            )}

            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500">
                Center the item in the frame with clear, even lighting.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
