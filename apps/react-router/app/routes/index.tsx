import { Button } from "~/components/ui/button";
import type { Route } from "./+types/index";
import { Plus, LayoutGrid, LayoutList } from "lucide-react";
import { useState } from "react";
import { Separator } from "~/components/ui/separator";
import MediaUpload from "~/components/MediaUpload";
import { ls3 } from "~/utils/storage.server";
import { MediaSearch } from "~/components/MediaSearch";
import { MEDIA_BUCKET_NAME } from "~/constants";
import MediaGrid from "~/components/MediaGrid";

import { useDebounceValue } from "usehooks-ts";
export function meta({}: Route.MetaArgs) {
  return [{ title: "Local S3" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const items = await ls3.listObjects(MEDIA_BUCKET_NAME);

  return {
    items,
  };
}

export default function Home({ loaderData: { items } }: Route.ComponentProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [searchTerm, setSearchTerm] = useDebounceValue("", 500);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Media Manager</h1>
          <p className="text-gray-500">
            Upload, organize, and manage your media files
          </p>
        </div>

        {/* Action bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
          <Button
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="bg-media-blue hover:bg-blue-600"
          >
            {isUploadOpen ? (
              "Hide Upload Form"
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Upload Media
              </>
            )}
          </Button>

          <div className="flex-1 w-full md:w-auto">
            {" "}
            <MediaSearch
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />{" "}
          </div>

          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className={
                viewMode === "grid" ? "bg-media-blue hover:bg-blue-600" : ""
              }
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className={
                viewMode === "list" ? "bg-media-blue hover:bg-blue-600" : ""
              }
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Upload area */}
        {isUploadOpen && (
          <div className="mb-8 animate-fade-in">
            <MediaUpload />
          </div>
        )}

        <Separator className="my-6" />

        {/* Media Grid */}
        <div className="mt-6">
          <MediaGrid searchTerm={searchTerm} mediaItems={items} />
        </div>

        {/* Media Modal */}
        {/* <MediaModal /> */}
      </div>
    </div>
  );
}
