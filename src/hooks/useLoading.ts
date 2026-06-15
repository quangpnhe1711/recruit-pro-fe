import { useState } from "react";

export function useLoading() {
  const [loading, setLoading] = useState(false);

  async function withLoading<T>(callback: () => Promise<T>): Promise<T> {
    try {
      setLoading(true);
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
