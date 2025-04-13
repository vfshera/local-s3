import { redirect } from "react-router";
import type { Route } from "./+types/upload";
import { ls3 } from "~/utils/storage.server";
import { MEDIA_BUCKET_NAME } from "~/constants";
import {
  MultipartParseError,
  parseMultipartRequest,
} from "@mjackson/multipart-parser";
import { Buffer } from "node:buffer";
export async function action({ request }: Route.ActionArgs) {
  try {
    await parseMultipartRequest(request, async (part) => {
      if (part.name !== "file") return;
      if (part.isFile) {
        const buffer = await part.bytes();
        const result = await ls3.putObject(
          MEDIA_BUCKET_NAME,
          part.filename!,
          Buffer.from(buffer),
          { contentType: part.mediaType }
        );
      }
    });
  } catch (error) {
    if (error instanceof MultipartParseError) {
      console.error("MultipartParseError:", error.message);
    } else {
      console.error("Error:", error);
    }
  }

  return redirect("/");
}
