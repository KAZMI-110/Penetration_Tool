import { QueryClient } from "@tanstack/react-query";

/** Single shared QueryClient — imported by both router.tsx and __root.tsx */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchInterval: 30_000,
    },
  },
});
