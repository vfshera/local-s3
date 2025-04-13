import { Image, Video, Pencil, Trash2, Eye } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { format } from "date-fns";
import type { ObjectInfo } from "local-s3";
import { MEDIA_BUCKET_NAME } from "~/constants";
import { useSubmit } from "react-router";
type MediaGridProps = {
  mediaItems: ObjectInfo[];
  searchTerm: string;
  setSelectedMedia: React.Dispatch<React.SetStateAction<ObjectInfo | null>>;
};
export default function MediaGrid({
  mediaItems,
  searchTerm,
  setSelectedMedia,
}: MediaGridProps) {
  const filteredMedia = useMemo(() => {
    return mediaItems.filter((item) =>
      item.key.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mediaItems, searchTerm]);

  const submit = useSubmit();

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";

    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  if (filteredMedia.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg mb-2">No media found</p>
        <p className="text-sm">
          {searchTerm
            ? "Try a different search term"
            : "Upload some media to get started"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredMedia.map((media) => (
        <Card key={media.key} className="overflow-hidden group animate-fade-in">
          <div className="relative aspect-square">
            {media.contentType &&
              (media.contentType.startsWith("image") ? (
                <img
                  src={`/media/${MEDIA_BUCKET_NAME}/objects/${media.key}`}
                  alt={""}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Video className="h-12 w-12 text-gray-400" />
                </div>
              ))}

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => {
                    setSelectedMedia(media);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => {
                    setSelectedMedia(media);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Media</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{media.key}"? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          submit(null, {
                            method: "delete",
                            action: `/media/${MEDIA_BUCKET_NAME}/objects/${media.key}/delete`,
                          });
                        }}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div className="truncate">
                <h3 className="font-medium truncate">{media.key}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {format(media.lastModified, "MMM d, yyyy")} •{" "}
                  {formatFileSize(media.size)}
                </p>
              </div>
              <div className="flex-shrink-0 ml-2">
                {media.contentType &&
                  (media.contentType?.startsWith("image/") ? (
                    <Image className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Video className="h-4 w-4 text-gray-400" />
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
