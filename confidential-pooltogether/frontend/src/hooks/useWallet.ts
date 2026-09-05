import { BrowserProvider } from "ethers";
import type { EIP1193Provider } from "@zama-fhe/sdk/ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const connectionRequested = useRef(false);

  useEffect(() => {
    if (!window.ethereum) {
      setState({ status: "unsupported" });
      return;
    }

    const accountsChanged = (accounts: unknown) => {
      if (!connectionRequested.current) return;
      const account = Array.isArray(accounts) && typeof accounts[0] === "string"
        ? accounts[0]
        : undefined;
      if (!account) {
        connectionRequested.current = false;
      }
      setState((current) => ({
        ...current,
        account,
        status: account ? "connected" : "disconnected",
        error: undefined,
      }));
    };
    const chainChanged = (chainHex: unknown) => {
      if (!connectionRequested.current || typeof chainHex !== "string") return;
      setState((current) => ({
        ...current,
        chainId: Number.parseInt(chainHex, 16),
        error: undefined,
      }));
    };

    window.ethereum.on("accountsChanged", accountsChanged);
    window.ethereum.on("chainChanged", chainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", accountsChanged);
      window.ethereum?.removeListener("chainChanged", chainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState({
        status: "unsupported",
        error: "Install a browser wallet to continue.",
      });
      return;
    }
    connectionRequested.current = true;
    setState({ status: "connecting" });
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];
      const chainHex = await window.ethereum.request({
        method: "eth_chainId",
      }) as string;
      const account = accounts[0];
      connectionRequested.current = Boolean(account);
      setState({
        account,
        chainId: Number.parseInt(chainHex, 16),
        status: account ? "connected" : "disconnected",
      });
    } catch (error) {
      connectionRequested.current = false;
      setState({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Wallet connection was rejected.",
      });
    }
  }, []);

  const disconnect = useCallback(async () => {
    connectionRequested.current = false;

    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch {
        // Some injected wallets do not implement permission revocation. Clearing
        // the local session still disconnects this application until the user
        // explicitly connects again.
      }
    }

    setState({ status: "disconnected" });
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum || !state.account) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: deployment.chainIdHex }],
      });
      setState((current) => ({
        ...current,
        chainId: deployment.chainId,
        status: current.account ? "connected" : "disconnected",
        error: undefined,
      }));
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
  }, [state.account]);

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
    disconnect,
    switchToSepolia,
  };
}
