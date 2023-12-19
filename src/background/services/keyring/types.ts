import { ApiUTXO } from "@/shared/interfaces/api";
import * as encryptorUtils from "@metamask/browser-passworder";

export type Json = any;
export type Hex = string;

export interface KeyringControllerArgs {
  encryptor?: typeof encryptorUtils;
}

export type Eip1024EncryptedData = {
  version: string;
  nonce: string;
  ephemPublicKey: string;
  ciphertext: string;
};

export interface SendTDC {
  to: string;
  amount: number;
  utxos: ApiUTXO[];
  receiverToPayFee: boolean;
  feeRate: number;
}

interface BaseUserToSignInput {
  index: number;
  sighashTypes: number[] | undefined;
  disableTweakSigner?: boolean;
}

export interface AddressUserToSignInput extends BaseUserToSignInput {
  address: string;
}

export interface PublicKeyUserToSignInput extends BaseUserToSignInput {
  publicKey: string;
}

export type UserToSignInput = AddressUserToSignInput | PublicKeyUserToSignInput;


export interface SignPsbtOptions {
  autoFinalized: boolean;
  toSignInputs?: UserToSignInput[];
}

export interface ToSignInput {
  index: number;
  publicKey: string;
  sighashTypes?: number[];
}