// src/services/wallet.ts
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";

const CRONOS_CHAIN_ID = "0x19"; // 25 in hex

export const walletService = {
  async connect() {
    const provider: any = await detectEthereumProvider();
    if (!provider) throw new Error("Please install MetaMask or Crypto.com DeFi Wallet");

    await provider.request({ method: "eth_requestAccounts" });
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    const addr = await signer.getAddress();
    return addr;
  },

  async switchToCronos() {
    if (!(window as any).ethereum) return;

    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CRONOS_CHAIN_ID }],
      });
    } catch (e: any) {
      if (e.code === 4902) {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: CRONOS_CHAIN_ID,
              chainName: "Cronos Mainnet",
              nativeCurrency: { name: "CRO", symbol: "CRO", decimals: 18 },
              rpcUrls: ["https://evm.cronos.org"],
              blockExplorerUrls: ["https://cronoscan.com"],
            },
          ],
        });
      }
    }
  },
};