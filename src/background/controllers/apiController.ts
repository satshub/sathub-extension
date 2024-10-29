import type {
    ApiUTXO,
    IAccountStats,
    ITransaction,
} from "@/shared/interfaces/api";
import {
    ContentDetailedInscription,
    ContentInscriptionResopnse,
    FindInscriptionsByOutpointResponseItem,
} from "@/shared/interfaces/inscriptions";
import { IToken } from "@/shared/interfaces/token";
import { customFetch, fetchProps } from "@/shared/utils";
import { storageService } from "../services";
import { DEFAULT_FEES } from "@/shared/constant";
import { isValidTXID } from "@/ui/utils";

interface IChainStats {
    funded_txo_sum: number;
    tx_count: number;
}

interface IData {
    chain_stats: IChainStats;
}


export interface UtxoQueryParams {
    hex?: boolean;
    amount?: number;
}

export interface IApiController {
    getUtxos(
        address: string,
        params?: UtxoQueryParams
    ): Promise<ApiUTXO[] | undefined>;
    pushTx(rawTx: string): Promise<{ txid?: string; error?: string }>;
    getTransactions(address: string): Promise<ITransaction[] | undefined>;
    getPaginatedTransactions(
        address: string,
        txid: string
    ): Promise<ITransaction[] | undefined>;
    getBELPrice(): Promise<{ bellscoin?: { usd: number } } | undefined>;
    getLastBlockBEL(): Promise<number | undefined>;
    getFees(): Promise<{ fast: number; slow: number } | undefined>;
    getAccountStats(address: string): Promise<IAccountStats | undefined>;
    getTokens(address: string): Promise<IToken[] | undefined>;
    getTransactionHex(txid: string): Promise<string | undefined>;
    getTransaction(txid: string): Promise<ITransaction | undefined>;
    getUtxoValues(outpoints: string[]): Promise<number[] | undefined>;
    getContentPaginatedInscriptions(
        address: string,
        page: number
    ): Promise<ContentInscriptionResopnse | undefined>;
    searchContentInscriptionByInscriptionId(
        inscriptionId: string
    ): Promise<ContentDetailedInscription | undefined>;
    searchContentInscriptionByInscriptionNumber(
        address: string,
        number: number
    ): Promise<ContentInscriptionResopnse | undefined>;
    getLocationByInscriptionId(
        inscriptionId: string
    ): Promise<{ location: string; owner: string } | undefined>;
    findInscriptionsByOutpoint(data: {
        outpoint: string;
        address: string;
    }): Promise<FindInscriptionsByOutpointResponseItem[] | undefined>;
}

type FetchType = <T>(
    props: Omit<fetchProps, "network">
) => Promise<T | undefined>;

class ApiController implements IApiController {
    private fetch: FetchType = async (p: Omit<fetchProps, "network">) => {
        try {
            return await customFetch({
                ...p,
                network: storageService.appState.network,
            });
        } catch {
            return;
        }
    };

    async getUtxos(address: string, params?: UtxoQueryParams) {
        const data = await this.fetch<ApiUTXO[]>({
            path: `/address/${address}/utxo`,
            params: params as Record<string, string>,
            service: "electrum",
        });
        if (Array.isArray(data)) {
            return data;
        }
    }

    async getFees() {
        const data = await this.fetch<Record<string, number>>({
            path: "/v1/fees/recommended",
            service: "electrs",
        });
        if (data) {
            return {
                slow: "economyFee" in data ? Number(data["economyFee"].toFixed(0)) : DEFAULT_FEES.slow,
                fast:
                    "fastestFee" in data ? Number(data["fastestFee"].toFixed(0)) + 1 : DEFAULT_FEES.fast,
            };
        }
    }

    async pushTx(rawTx: string) {
        const data = await this.fetch<string>({
            path: "/tx",
            method: "POST",
            headers: {
                "content-type": "text/plain",
            },
            json: false,
            body: rawTx,
            service: "electrs",
        });
        if (isValidTXID(data) && data) {
            return {
                txid: data,
            };
        } else {
            return {
                error: data,
            };
        }
    }

    async getTransactions(address: string): Promise<ITransaction[] | undefined> {
        return await this.fetch<ITransaction[]>({
            path: `/address/${address}/txs`,
            service: "electrs",
        });
    }

    async getPaginatedTransactions(
        address: string,
        txid: string
    ): Promise<ITransaction[] | undefined> {
        try {
            return await this.fetch<ITransaction[]>({
                path: `/address/${address}/txs/chain/${txid}`,
                service: "electrs",
            });
        } catch (e) {
            return undefined;
        }
    }

    async getLastBlockBEL() {
        const data = await this.fetch<string>({
            path: "/blocks/tip/height",
            service: "electrs",
        });
        if (data) {
            return Number(data);
        }
    }

    async getBELPrice() {
        const data = await this.fetch<{ price_usd: number }>({
            path: "/last-price",
            service: "electrs",
        });
        if (!data) {
            return undefined;
        }
        return {
            bellscoin: {
                usd: data.price_usd,
            },
        };
    }
    async _getAccountStats(address: string): Promise<IAccountStats | undefined> {
        try {
            return await this.fetch({
                path: `/address/${address}/stats`,
                service: "electrs",
            });
        } catch {
            return { amount: 0, count: 0, balance: 0 };
        }
    }

    // 类型守卫函数
    private isValidData(data: any): data is IData {
        return (
            data &&
            typeof data === "object" &&
            "chain_stats" in data &&
            typeof data.chain_stats.funded_txo_sum === "number" &&
            typeof data.chain_stats.tx_count === "number"
        );
    }

    /*
      await updateSelectedAccount({
        balance: balance,
        inscriptionCounter: count,
        inscriptionBalance: amount / 10 ** 8,
      });
    */
    async getAccountStats(address: string): Promise<IAccountStats | undefined> {
        try {
            const data = await this.fetch({
                path: `/address/${address}`,
                service: "electrs",
            });
            if (this.isValidData(data)) {
                return {
                    amount: 0, //参考上面的注释， amount是inscriptions的BTC总额, 临时标注为0
                    count: data["chain_stats"]["tx_count"], //参考上面的注释， count是inscriptions的数量
                    balance: data["chain_stats"]["funded_txo_sum"]
                };
            }
        } catch {
            return { amount: 0, count: 0, balance: 0 };
        }
    }

    async getTokens(address: string): Promise<IToken[] | undefined> {
        return await this.fetch<IToken[]>({
            path: `/address/${address}/tokens`,
            service: "electrs",
        });
    }

    async getTransaction(txid: string) {
        return await this.fetch<ITransaction>({
            path: "/tx/" + txid,
            service: "electrs",
        });
    }

    async getTransactionHex(txid: string) {
        return await this.fetch<string>({
            path: "/tx/" + txid + "/hex",
            json: false,
            service: "electrs",
        });
    }

    async getUtxoValues(outpoints: string[]) {
        const result = await this.fetch<{ values: number[] }>({
            path: "/prev",
            body: JSON.stringify({ locations: outpoints }),
            method: "POST",
            service: "electrs",
        });
        return result?.values;
    }

    async getContentPaginatedInscriptions(address: string, page: number) {
        return await this.fetch<ContentInscriptionResopnse>({
            path: `/search?account=${address}&page_size=6&page=${page}`,
            service: "content",
        });
    }

    async searchContentInscriptionByInscriptionId(inscriptionId: string) {
        return await this.fetch<ContentDetailedInscription>({
            path: `/${inscriptionId}/info`,
            service: "content",
        });
    }

    async searchContentInscriptionByInscriptionNumber(
        address: string,
        number: number
    ) {
        return await this.fetch<ContentInscriptionResopnse>({
            path: `/search?account=${address}&page_size=6&page=1&from=${number}&to=${number}`,
            service: "content",
        });
    }

    async getLocationByInscriptionId(inscriptionId: string) {
        return await this.fetch<{ location: string; owner: string }>({
            path: `/location/${inscriptionId}`,
            service: "electrs",
        });
    }

    async findInscriptionsByOutpoint(data: {
        outpoint: string;
        address: string;
    }) {
        return await this.fetch<FindInscriptionsByOutpointResponseItem[]>({
            path: `/find_meta/${data.outpoint}?address=${data.address}`,
            service: "electrs",
        });
    }
}

export default new ApiController();
