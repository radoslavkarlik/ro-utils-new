import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

import { RouterProvider, createRouter } from "@tanstack/react-router";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { enableMapSet } from "immer";

enableMapSet();

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
