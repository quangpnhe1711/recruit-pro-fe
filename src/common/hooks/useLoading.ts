import { useState } from "react";
import { sleep } from "../utils/helpers";

export function useLoading() {
  const [loading, setLoading] = useState(false);

  async function withLoading<T>(callback: () => Promise<T>): Promise<T> {
    try {
      setLoading(true);

      await sleep(1500);
      return await callback();
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    withLoading,
  };
}
