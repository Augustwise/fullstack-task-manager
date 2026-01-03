import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { routes } from "../routes/routes";

const router = createBrowserRouter(routes);

export function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
