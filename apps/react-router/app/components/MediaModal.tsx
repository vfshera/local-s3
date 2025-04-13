import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { format } from "date-fns";
import { Save, X, Calendar, FileText, Info } from "lucide-react";
import { useEffect, useState } from "react";
import type { ObjectInfo } from "local-s3";
import { MEDIA_BUCKET_NAME } from "~/constants";

type MediaModalProps = {
  selectedMedia: ObjectInfo | null;
  setSelectedMedia: React.Dispatch<React.SetStateAction<ObjectInfo | null>>;
};
export default function MediaModal({
  selectedMedia,
  setSelectedMedia,
}: MediaModalProps) {
  const [editedMedia, setEditedMedia] = useState<Partial<ObjectInfo> | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (selectedMedia) {
      setEditedMedia(selectedMedia);
    } else {
      setEditedMedia(null);
      setIsEditing(false);
    }
  }, [selectedMedia]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (editedMedia) {
      setEditedMedia({
        ...editedMedia,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSave = () => {
    if (selectedMedia && editedMedia) {
      //   updateMedia(selectedMedia.id, editedMedia);
      setIsEditing(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";

    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <Dialog
      open={!!selectedMedia}
      onOpenChange={(open) => !open && setSelectedMedia(null)}
    >
      {editedMedia && (
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {isEditing ? (
                <Input
                  name="title"
                  value={editedMedia.key || ""}
                  onChange={handleChange}
                  className="font-bold text-lg"
                />
              ) : (
                <span>{editedMedia.key}</span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel Edit" : "Edit Details"}
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="flex justify-center">
              {editedMedia.contentType?.startsWith("image/") ? (
                <img
                  src={`/media/${MEDIA_BUCKET_NAME}/objects/${editedMedia.key}`}
                  alt={editedMedia.key}
                  className="max-h-[350px] object-contain rounded-md"
                />
              ) : (
                <video
                  src={`/media/${MEDIA_BUCKET_NAME}/objects/${editedMedia.key}`}
                  controls
                  className="max-h-[350px] w-auto rounded-md"
                />
              )}
            </div>

            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={editedMedia.key || ""}
                    onChange={handleChange}
                    placeholder="Enter a description for this media"
                    className="resize-none"
                    rows={4}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {editedMedia.key && (
                  <div className="flex gap-2">
                    <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <p className="text-gray-700">{editedMedia.key}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Uploaded:</span>{" "}
                      {/* {format(new Date(editedMedia.createdAt), "MMMM d, yyyy")} */}
                    </p>
                    {editedMedia.lastModified && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Last modified:</span>{" "}
                        {format(
                          new Date(editedMedia.lastModified),
                          "MMMM d, yyyy"
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Info className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Type:</span>{" "}
                    {/* {editedMedia.type.charAt(0).toUpperCase() +
                      editedMedia.type.slice(1)} */}
                    {editedMedia.size && (
                      <span> • {formatFileSize(editedMedia.size)}</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {isEditing ? (
              <Button
                onClick={handleSave}
                className="bg-media-blue hover:bg-blue-600"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setSelectedMedia(null)}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
