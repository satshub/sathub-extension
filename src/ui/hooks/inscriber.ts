import { ITransferToken } from "@/shared/interfaces/token";
import { inscribe } from "bells-inscriber";
import { useCallback } from "react";
import { useGetCurrentAccount } from "../states/walletState";
import { useControllersState } from "../states/controllerState";
import toast from "react-hot-toast";
import { t } from "i18next";
import { useGetUtxosForTransfer } from "./transactions";
import { gptFeeCalculate } from "../utils";

export const useInscribeTransferToken = () => {
  const currentAccount = useGetCurrentAccount();
  const { apiController, keyringController } = useControllersState((v) => ({
    apiController: v.apiController,
    keyringController: v.keyringController,
  }));
  const getUtxos = useGetUtxosForTransfer();

  return useCallback(
    async (data: ITransferToken, feeRate: number) => {
      const cost =
        1000 * 2 +
        1000000 +
        gptFeeCalculate(2, 3, feeRate) +
        gptFeeCalculate(1, 2, feeRate);

      const utxos = getUtxos(cost);
      if (!utxos) return;

      const txs = await inscribe({
        toAddress: currentAccount.address,
        fromAddress: currentAccount.address,
        data: Buffer.from(JSON.stringify(data)),
        feeRate,
        utxos: utxos as unknown as any,
        contentType: "application/json; charset=utf-8",
        publicKey: Buffer.from(
          await keyringController.exportPublicKey(currentAccount.address),
          "hex"
        ),
        signPsbtHex: keyringController.signAllInputs,
      });
      const txIds: string[] = [];
      for (const i of txs) {
        txIds.push((await apiController.pushTx(i)).txid ?? "");
      }
      if (!txIds.filter((f) => f.length !== 64).length)
        toast.success(t("inscriptions.transfer_inscribed"));
      else toast.error(t("inscriptions.failed_inscribe_transfer"));
    },
    [apiController, currentAccount, keyringController, getUtxos]
  );
};
