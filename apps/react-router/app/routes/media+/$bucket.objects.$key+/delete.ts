import { redirect } from "react-router";
import type { Route } from "./+types/delete";
import { ls3 } from "~/utils/storage.server";
export async function action({ request, params }: Route.ActionArgs) {
  const { bucket, key } = params;

  try {
    const result = await ls3.deleteObject(bucket, key);

    return redirect("/");
  } catch (error) {
    console.log(`Error deleting object: `, error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
