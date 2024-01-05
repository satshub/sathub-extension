import { AddressType } from "bellhdw";
import { IAccount } from "./accounts";

export interface IWallet {
  id: number;
  accounts: IAccount[];
  name: string;
  addressType: AddressType;
  type: "simple" | "root";
  hideRoot?: boolean;
}

export interface IPrivateWallet extends IWallet {
  data: any;
  phrase?: string;
}

export interface IWalletStateBase {
  wallets: IWallet[];
  vaultIsEmpty: boolean;
  selectedWallet?: number;
  selectedAccount?: number;
}

export interface IWalletState extends IWalletStateBase {
  updateWalletState: (state: Partial<IWalletState>) => Promise<void>;
}

export interface INewWalletProps {
  phrase: string;
  walletType: "simple" | "root";
  addressType?: AddressType;
  name?: string;
  hideRoot?: boolean;
}
