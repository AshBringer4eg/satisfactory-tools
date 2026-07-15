import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter
        basename={import.meta.env.BASE_URL}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/" element={<Index initialTab="duo" />} />
          <Route path="/solo/" element={<Index initialTab="solo" />} />
          <Route path="/duo/" element={<Index initialTab="duo" />} />
          <Route path="/own/" element={<Index initialTab="own" />} />
          <Route path="/uk/" element={<Index initialTab="duo" initialLocale="uk" />} />
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
