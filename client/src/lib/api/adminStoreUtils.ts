type LoadingSlice = {
  isLoading: boolean;
  error: string | null;
};

/**
 * Shared try/catch wrapper for super-admin Zustand actions.
 */
export async function runAdminAction<T>(
  set: (partial: Partial<LoadingSlice>) => void,
  errorMessage: string,
  action: () => Promise<T>,
): Promise<T | null> {
  set({ isLoading: true, error: null });
  try {
    const result = await action();
    set({ isLoading: false });
    return result;
  } catch {
    set({ error: errorMessage, isLoading: false });
    return null;
  }
}
