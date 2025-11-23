export const DataPactModule = {
    MODULE_NAME: "datapact",
    FUNCTIONS: {
      CREATE_DATABASE_BOUNTY: "create_database_bounty",
      SUBMIT_LABEL: "submit_label",
    },
    EVENTS: {
      CREATE: "CreateBountyEvent",
      FINALIZE: "LabelFinalizedEvent",
    }
  } as const;

export const CoinType = {
    SUI: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
    USDC: {
      TESTNET:
        "0x6c6522852b4a8a36497eec262a0ee46872fcf69718f15e4a99050794d7ff7117::usdc::USDC"
    },
  } as const;

// 时钟对象
export const Clock = "0x6";