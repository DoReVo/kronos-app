import { PandemicDatasetSchema, type PandemicDataset } from "@kronos/common";
import { useQuery } from "@tanstack/react-query";
import { createKy } from "../api/ky";

const ky = createKy();

export function usePandemic() {
  return useQuery<PandemicDataset>({
    queryKey: ["pandemic", "all"],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    queryFn: async () => {
      const body: unknown = await ky.get("pandemic/all").json();
      return PandemicDatasetSchema.parse(body);
    },
  });
}
