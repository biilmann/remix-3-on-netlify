import type { InferRouteHandler } from "@remix-run/fetch-router";

import { routes } from "../routes.ts";
import { getUploadsStorage } from "./utils/uploads.ts";

export let uploadsHandler: InferRouteHandler<typeof routes.uploads> = async ({
  params,
}) => {
  let file = await getUploadsStorage().get(params.key);

  if (!file) {
    return new Response("File not found", { status: 404 });
  }

  return new Response(file, {
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Content-Length": file.size.toString(),
      "Cache-Control": "public, max-age=31536000",
    },
  });
};
