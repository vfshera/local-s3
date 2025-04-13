import { ls3 } from "~/utils/storage.server";
import type { Route } from "./+types/$bucket.objects.$key";

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { bucket, key } = params;

  try {
    const { metadata, object } = await ls3.getObject(bucket, key);
    const headers = new Headers();

    if (metadata.systemMetadata.contentType) {
      headers.set("Content-Type", metadata.systemMetadata.contentType);
    }

    if (metadata) {
      Object.keys(metadata).forEach((key) => {
        if (key !== "systemMetadata") {
          headers.set(`x-amz-meta-${key}`, metadata[key]);
        }
      });

      if (metadata.systemMetadata) {
        headers.set("Content-Length", metadata.systemMetadata.size.toString());
        headers.set("Last-Modified", metadata.systemMetadata.lastModified);
        headers.set("ETag", metadata.systemMetadata.etag);
      }
    }

    return new Response(object, {
      headers,
    });
  } catch (error) {
    if ((error as any)?.code === "ENOENT") {
      return new Response("Object not found", { status: 404 });
    } else {
      return new Response("Internal Server Error", { status: 500 });
    }
  }
}
