import { useLayoutEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const RouteScrollReset = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.querySelectorAll<HTMLElement>("[data-route-scroll-container]").forEach((container) => {
      container.scrollTop = 0;
      container.scrollLeft = 0;
    });
  }, [pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter
        basename={import.meta.env.BASE_URL}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <RouteScrollReset />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/solo/" element={<Index initialTab="solo" />} />
          <Route path="/duo/" element={<Index initialTab="duo" />} />
          <Route path="/own/" element={<Index initialTab="own" />} />
          <Route path="/uk/" element={<Landing initialLocale="uk" />} />
          <Route path="/uk/solo/" element={<Index initialTab="solo" initialLocale="uk" />} />
          <Route path="/uk/duo/" element={<Index initialTab="duo" initialLocale="uk" />} />
          <Route path="/uk/own/" element={<Index initialTab="own" initialLocale="uk" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
