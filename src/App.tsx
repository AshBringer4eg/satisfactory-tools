import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
const router = createBrowserRouter(
  [
    { path: "/", element: <Index /> },
    { path: "*", element: <NotFound /> },
  ],
  {
    basename: import.meta.env.BASE_URL,
    future: {
      v7_relativeSplatPath: true,
    },
  },
);

const App = () => (
  <TooltipProvider>
    <Sonner />
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </TooltipProvider>
);

export default App;
