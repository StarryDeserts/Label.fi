import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import {
    SuiObjectResponse,
    SuiParsedData,
    SuiObjectData,
} from "@mysten/sui/client";
import { DataPactModule, CoinType, Clock } from "./constant"

const suiClient = new SuiClient({
    url: getFullnodeUrl("testnet"),
});

const packageID = "0xadbc5d28c55e160ceda92cc5911bc42fbf0f3e36a359d5c17ee174fd27d212cc";


export const queryBalance = async (address: string) => {
    console.log(address);
    const result = await suiClient.getBalance({
        coinType: CoinType.SUI,
        owner: address,
    });
    console.log(result.totalBalance);
    return result;
};

export const queryUsdcBalance = async (address: string) => {
    console.log(address);
    const result = await suiClient.getBalance({
        coinType: CoinType.USDC.TESTNET,
        owner: address,
    });
    console.log("usdc_balance", result.totalBalance);
    return result;
};


// export const queryDataBaseBounty = async () => {
//     const dataBaseBounty = await suiClient.getObject({
//         id: networkConfig.testnet.StakePool,
//         options: {
//             showContent: true,
//         },
//     });

//     if (!stakePoolInfoContent.data?.content) {
//         throw new Error("StakePool content not found");
//     }

//     const parsedStakePool = stakePoolInfoContent.data.content as SuiParsedData;
//     if (!("fields" in parsedStakePool)) {
//         throw new Error("Invalid stake_pool data structure");
//     }

//     const stake_pool = parsedStakePool.fields as unknown as StakePool;
//     if (!stake_pool) {
//         throw new Error("Invalid stake_pool data structure");
//     }

//     return stake_pool;
// }

export const queryAllCoin = async (address: string, type: string) => {
    let cursor: string | null | undefined = null;
    let hasNextPage = true;
    const coinArr = [];

    while (hasNextPage) {
        const coinObjects = await suiClient.getCoins({
            owner: address,
            coinType: type,
            cursor,
            limit: 50,
        });
        if (!coinObjects?.data) {
            break;
        }
        hasNextPage = coinObjects.hasNextPage;
        cursor = coinObjects.nextCursor;
        coinArr.push(...coinObjects.data);
    }
    return coinArr;
};


export const create_bounty = async (
    user_address: string,
    database_name: string,
    file_name_list: string[],
    bolb_ids: string[],
    allowed_labels: string[],
    reward_amount: number,
    total_images_amount: number
) => {
    const result = await queryBalance(user_address);
    if (Number(result.totalBalance) < reward_amount) {
        throw new Error("Sui is not enough");
    }
    const tx = new Transaction();
    const sui_coins = await queryAllCoin(user_address, CoinType.SUI);
    // 初始化为第一个Coin，然后逐步merge剩余的
    sui_coins.forEach((item) => {
        if (item.coinObjectId !== sui_coins[0].coinObjectId) {
            tx.mergeCoins(tx.object(sui_coins[0].coinObjectId), [
                tx.object(item.coinObjectId),
            ]);
        }
    });
    const [sui] = tx.splitCoins(tx.object(sui_coins[0].coinObjectId), [tx.pure.u64(reward_amount)]);
    tx.moveCall({
        package: packageID,
        module: DataPactModule.MODULE_NAME,
        function: DataPactModule.FUNCTIONS.CREATE_DATABASE_BOUNTY,
        typeArguments: [CoinType.SUI],
        arguments: [
            tx.pure.string(database_name),
            tx.pure.vector('string', file_name_list),
            tx.pure.vector('string', bolb_ids),
            tx.pure.vector('string', allowed_labels),
            sui,
            tx.pure.u64(total_images_amount),
        ],
    });
    return tx;
}

export const submit_label = async (
    db_bounty_address: string,
    file_name: string,
    label: string,
) => {
    const tx = new Transaction();
    tx.moveCall({
        package: packageID,
        module: DataPactModule.MODULE_NAME,
        function: DataPactModule.FUNCTIONS.SUBMIT_LABEL,
        typeArguments: [CoinType.SUI],
        arguments: [
            tx.object(db_bounty_address),
            tx.pure.string(file_name),
            tx.pure.string(label),
        ],
    });
    return tx;
}