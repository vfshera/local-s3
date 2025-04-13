import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Progress } from "./ui/progress";
import { Card } from "./ui/card";
import { Upload } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import type { MediaUploadState } from "~/types";
import { useSubmit } from "react-router";

export default function MediaUpload() {
  const submit = useSubmit();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<MediaUploadState>({
    isUploading: false,
    progress: 0,
  });
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Check file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast("Invalid File Type", {
        description: "Please upload an image or video file.",
        //   variant: "destructive"
      });
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    submit(fd, { method: "post", action: "/media/upload", encType: "multipart/form-data" });
  };

  return (
    <Card
      className={`p-6 border-2 border-dashed transition-all ${
        dragActive ? "border-media-blue bg-blue-50" : "border-gray-300"
      }`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 mb-4 bg-blue-50 rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-media-blue" />
        </div>

        <h3 className="text-lg font-medium mb-2">Upload Media</h3>
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop files here, or click to select files
        </p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="hidden"
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadState.isUploading}
          className="bg-media-blue hover:bg-blue-600"
        >
          Select File
        </Button>

        {uploadState.isUploading && (
          <div className="w-full mt-4">
            <div className="flex justify-between text-xs mb-1">
              {/* <span>{uploadState.file?.name}</span> */}
              <span>{uploadState.progress}%</span>
            </div>
            <Progress value={uploadState.progress} className="h-2" />
          </div>
        )}
      </div>
    </Card>
  );
}
