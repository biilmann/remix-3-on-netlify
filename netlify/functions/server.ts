import type { Context } from "@netlify/functions";

import { router } from "../../app/router.ts";

export default async (req: Request, _context: Context) => {
  try {
    return await router.fetch(req);
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export const config = {
  path: "/*",
  preferStatic: true,
};
