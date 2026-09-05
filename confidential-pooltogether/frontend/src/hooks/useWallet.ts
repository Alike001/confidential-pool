import { BrowserProvider } from "ethers";
import type { EIP1193Provider } from "@zama-fhe/sdk/ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { deployment } from "../config/deployment";

type WalletState = {
  account?: string;
  chainId?: number;
  status: "disconnected" | "connecting" | "connected" | "unsupported" | "error";
  error?: string;
};

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({ status: "disconnected" });

  const sync = useCallback(async () => {
    if (!window.ethereum) {
      setState({ status: "unsupported" });
      return;
    }
    const [accounts, chainHex] = await Promise.all([
      window.ethereum.request({ method: "eth_accounts" }) as Promise<string[]>,
      window.ethereum.request({ method: "eth_chainId" }) as Promise<string>,
    ]);
    const account = accounts[0];
    setState({
      account,
      chainId: Number.parseInt(chainHex, 16),
      status: account ? "connected" : "disconnected",
    });
  }, []);

  useEffect(() => {
    void sync();
    const changed = () => void sync();
    window.ethereum?.on("accountsChanged", changed);
    window.ethereum?.on("chainChanged", changed);
    return () => {
      window.ethereum?.removeListener("accountsChanged", changed);
      window.ethereum?.removeListener("chainChanged", changed);
    };
  }, [sync]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState({
        status: "unsupported",
        error: "Install a browser wallet to continue.",
      });
      return;
    }
    setState({ status: "connecting" });
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await sync();
    } catch (error) {
      setState({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Wallet connection was rejected.",
      });
    }
  }, [sync]);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: deployment.chainIdHex }],
      });
      await sync();
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Unable to switch to Sepolia.",
      }));
    }
  }, [sync]);

  const provider = useMemo(() => {
    if (!window.ethereum || !state.account) return undefined;
    return new BrowserProvider(window.ethereum);
  }, [state.account, state.chainId]);

  return {
    ...state,
    provider,
    ethereum: window.ethereum,
    isSepolia: state.chainId === deployment.chainId,
    connect,
    switchToSepolia,
  };
}
