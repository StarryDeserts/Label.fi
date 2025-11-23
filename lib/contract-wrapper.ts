/**
 * Wrapper for contract.ts functions
 * This file provides a clean interface for UI components to interact with smart contracts
 */

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import {
    SuiObjectResponse,
    SuiParsedData,
    SuiObjectData,
} from "@mysten/sui/client";
import { DatasetBounty, CreateBountyEvent, DynamicField, State } from "../types/sui-contract"

const suiClient = new SuiClient({
  url: getFullnodeUrl("testnet"),
});

const packageID = "0xadbc5d28c55e160ceda92cc5911bc42fbf0f3e36a359d5c17ee174fd27d212cc";

// Constants
const DataPactModule = {
  MODULE_NAME: "datapact",
  FUNCTIONS: {
    CREATE_DATABASE_BOUNTY: "create_database_bounty",
    SUBMIT_LABEL: "submit_label",
  },
  EVENTS: {
    CREATE_BOUNTY_EVENET: "CreateBountyEvent"
  }
} as const;

const CoinType = {
  SUI: "0x2::sui::SUI",
} as const;

const queryBalance = async (address: string) => {
  const result = await suiClient.getBalance({
    coinType: CoinType.SUI,
    owner: address,
  });
  return result;
};

const queryAllCoin = async (address: string, type: string) => {
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

export const queryStakePoolInfo = async (bounty_id: string) => {
  const bountyInfoContent = await suiClient.getObject({
    id: bounty_id,
    options: {
      showContent: true,
    },
  });

  if (!bountyInfoContent.data?.content) {
    throw new Error("Bounty content not found");
  }

  const parsedBounty = bountyInfoContent.data.content as SuiParsedData;
  if (!("fields" in parsedBounty)) {
    throw new Error("Invalid bounty data structure");
  }

  const bounty = parsedBounty.fields as unknown as DatasetBounty;
  if (!bounty) {
    throw new Error("Invalid bounty data structure");
  }

  return bounty;
}
export const queryDynamicField = async (object_id: string) => {
    const dynamicFieldInfoContent = await suiClient.getObject({
    id: object_id,
    options: {
      showContent: true,
    },
  });

  if (!dynamicFieldInfoContent.data?.content) {
    throw new Error("Bounty content not found");
  }

  const parsedDynamicField= dynamicFieldInfoContent.data.content as SuiParsedData;
  if (!("fields" in parsedDynamicField)) {
    throw new Error("Invalid bounty data structure");
  }

  const dynamicField = parsedDynamicField.fields as unknown as DynamicField;
  if (!dynamicField) {
    throw new Error("Invalid bounty data structure");
  }

  return dynamicField;
}

export const queryDatabaseData = async (dataId: string) => {
  const data = await suiClient.getDynamicFields({
    parentId: dataId,
  });
  return data;
};

export const queryCreateBountyEvent: () => Promise<State> = async () => {
  const events = await suiClient.queryEvents({
    query: {
      MoveEventType: `${packageID}::${DataPactModule.MODULE_NAME}::${DataPactModule.EVENTS.CREATE_BOUNTY_EVENET}`,
    },
  });
  const state: State = {
    bountys: [],
  };
  events.data.forEach((event) => {
    if (event.parsedJson) {
      const bounty = event.parsedJson as CreateBountyEvent;
      if (bounty && typeof bounty === "object") {
        state.bountys.push({
          ...bounty,
        });
      }
    }
  });
  console.log(state);
  return state;
};



/**
 * Creates a bounty transaction
 */
export async function createBountyTransaction(
  userAddress: string,
  databaseName: string,
  fileNameList: string[],
  blobIds: string[],
  allowedLabels: string[],
  rewardAmount: number,
  totalImagesAmount: number
): Promise<Transaction> {
  const result = await queryBalance(userAddress);
  if (Number(result.totalBalance) < rewardAmount) {
    throw new Error("Sui is not enough");
  }
  
  const tx = new Transaction();
  
  // 使用 tx.gas 来分割 coin，这样会自动处理 gas 费用
  const [sui] = tx.splitCoins(tx.gas, [tx.pure.u64(rewardAmount)]);
  
  tx.moveCall({
    package: packageID,
    module: DataPactModule.MODULE_NAME,
    function: DataPactModule.FUNCTIONS.CREATE_DATABASE_BOUNTY,
    typeArguments: [CoinType.SUI],
    arguments: [
      tx.pure.string(databaseName),
      tx.pure.vector("string", fileNameList),
      tx.pure.vector("string", blobIds),
      tx.pure.vector("string", allowedLabels),
      sui,
      tx.pure.u64(totalImagesAmount),
    ],
  });
  
  return tx;
}

/**
 * Creates a submit label transaction
 */
export async function submitLabelTransaction(
  dbBountyAddress: string,
  fileName: string,
  label: string
): Promise<Transaction> {
  const tx = new Transaction();
  
  tx.moveCall({
    package: packageID,
    module: DataPactModule.MODULE_NAME,
    function: DataPactModule.FUNCTIONS.SUBMIT_LABEL,
    typeArguments: [CoinType.SUI],
    arguments: [
      tx.object(dbBountyAddress),
      tx.pure.string(fileName),
      tx.pure.string(label),
    ],
  });
  
  return tx;
}
