import { JsonRpcProvider, type Provider } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { deployment } from "../config/deployment";
import { readPoolSnapshot, type PoolSnapshot } from "../lib/pool";

export function usePoolSnapshot(walletProvider?: Provider, account?: string) {
  const fallbackProvider = useMemo(() => {
    const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL?.trim();
    return rpcUrl ? new JsonRpcProvider(rpcUrl, deployment.chainId) : undefined;
  }, []);
  const provider = walletProvider ?? fallbackProvider;
  const [snapshot, setSnapshot] = useState<PoolSnapshot>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    if (!provider) return;
    setLoading(true);
    try {
      setSnapshot(await readPoolSnapshot(provider, deployment.pool, account));
      setError(undefined);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to read the recurring pool.");
    } finally {
      setLoading(false);
    }
  }, [account, provider]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return { snapshot, loading, error, refresh, hasProvider: Boolean(provider) };
}
