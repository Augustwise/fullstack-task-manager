import type { RouteObject } from "react-router-dom";

import { PublicLayout } from "../layouts/PublicLayout";
import { LandingPage } from "../../pages/LandingPage";

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
    ],
  },
];
