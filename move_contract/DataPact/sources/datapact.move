module datapact::datapact;

use sui::event;
use sui::balance::Balance;
use std::string::{Self, String};
use sui::coin::{Self, Coin};
use sui::table::{Self, Table};

use datapact::error;

const CONSENSUS_NUMBER: u64 = 3;

public struct DatasetBounty<phantom T> has key, store {
    id: UID,
    name: String,
    allowed_labels: vector<String>, // 所有可选的标签
    walrus_bolb_ids: Table<String, String>, // file name -> bolb id
    reward_pool: Balance<T>,
    counters: Table<String, LabelCounter>, // file name -> 计数器 object
    final_labels: Table<String, String>, // file name -> 最终确定的标签
    participants: Table<String, vector<address>>,// 新增: 文件名 -> 已参与用户地址列表,
    total_images: u64,
    completed_counts: u64
}


public struct LabelCounter has store {
    votes_map: Table<String, LabelVotes> // 标签 -> 选中的相应数量
}

public struct LabelVotes has store {
    count: u64,
    voters: vector<address>
}


public struct CreateBountyEvent has copy, drop {
    id: address,
    name: String,
    allowed_labels: vector<String>,
    total_images: u64
}

public struct LabelFinalizedEvent has copy, drop {
    file: String,
    label: String,
    winners: vector<address>,
    reward_each: u64
}

#[allow(lint(public_entry))]
public entry fun create_database_bounty<T>(
    name: String,
    file_name_list: vector<String>,
    bolb_ids: vector<String>,
    allowed_labels: vector<String>,
    reward: Coin<T>,
    total_images: u64,
    ctx: &mut TxContext
) {
    // 创建 database_bounty 共享对象
    let mut db_bounty = DatasetBounty {
        id: object::new(ctx),
        name,
        allowed_labels, // 所有可选的标签
        walrus_bolb_ids: table::new<String, String>(ctx), // file name -> bolb id
        reward_pool: coin::into_balance(reward),
        counters: table::new<String, LabelCounter>(ctx), // file name -> 计数器 object
        final_labels: table::new<String, String>(ctx), // file name -> 最终确定的标签
        participants: table::new<String, vector<address>>(ctx),
        total_images,
        completed_counts: 0
    };

    // 这两个向量的长度理应一样长
    if(vector::length(&file_name_list) != vector::length(&bolb_ids)) {
        error::vecctor_length_is_wrong();
    };

    // 初始化 walrus_bolb_ids 、 counters 、 final_labels 这三个字段
    let mut i = 0;
    while(i < vector::length(&file_name_list)) {
        let file_name = file_name_list[i];
        let blob_id = bolb_ids[i];
        let empty_string = string::utf8(b"");

        // 初始化这三个字段的所有 key、value 值
        table::add(&mut db_bounty.walrus_bolb_ids, file_name, blob_id);
        table::add(&mut db_bounty.counters, file_name, create_label_counter(allowed_labels, ctx));
        table::add(&mut db_bounty.final_labels, file_name, empty_string);
        // 初始化 participants 表
        table::add(&mut db_bounty.participants, file_name, vector::empty<address>());

        i = i + 1;
    };
    // 发布创建事件
    event::emit(CreateBountyEvent {
        id: object::uid_to_address(&db_bounty.id),
        name,
        allowed_labels,
        total_images
    });

    transfer::public_share_object(db_bounty);
}

fun create_label_counter (allowed_labels: vector<String>, ctx: &mut TxContext) : LabelCounter {
    let mut i = 0;
    let mut label_counter =  LabelCounter {
        votes_map: table::new<String, LabelVotes>(ctx)
    };

    while(i < vector::length(&allowed_labels)) {
        let label = allowed_labels[i];
        let lv = LabelVotes { count: 0, voters: vector::empty<address>() };
        table::add(&mut label_counter.votes_map, label, lv);
        i = i + 1;
    };

    label_counter
}

#[allow(lint(public_entry))]
public entry fun submit_label<T>(
    db_bounty: &mut DatasetBounty<T>,
    file_name: String,
    label: String,
    ctx: &mut TxContext
) {
    // 1. 检查是否已完成标注 && 提交的标签是否有效
    let final_label = table::borrow(&db_bounty.final_labels, file_name);
    if(string::length(final_label) != 0) {
        error::already_finalized();
    };

    if (!vector::contains(&db_bounty.allowed_labels, &label)) {
        error::invalid_label();
    };


    // 2. 检查用户是否已标注过该图片
    let participants_vec = table::borrow_mut(&mut db_bounty.participants, file_name);
    if(vector::contains(participants_vec ,&ctx.sender())) {
        error::already_labeled();
    };

    // 当前用户尚未标注过该图片，加入参与列表
    vector::push_back(participants_vec, ctx.sender());

     // 3. 增加标注记录（计数和用户）
    let label_counter = table::borrow_mut(&mut db_bounty.counters, file_name);
    let label_votes = table::borrow_mut(&mut label_counter.votes_map, label);

    // 确保同一用户未在同一标签下重复投票
    if(vector::contains(&label_votes.voters ,&ctx.sender())) {
        error::already_labeled();
    };

    vector::push_back(&mut label_votes.voters, ctx.sender());
    label_votes.count = label_votes.count + 1;

     // 4. 判断是否达成三人共识
    if (label_votes.count == CONSENSUS_NUMBER) {
        let empty_label = table::borrow_mut(&mut db_bounty.final_labels, file_name);
        string::append(empty_label, label);
        db_bounty.completed_counts = db_bounty.completed_counts + 1;

        // 计算每人奖励份额： (总奖励 / 总图片数) / 3
        let total_reward_value: u64 = // 从 db_bounty.reward_pool 提取总余额数值
            // 假设可以通过balance的value()方法获取余额数值
            db_bounty.reward_pool.value();
        let image_reward = total_reward_value / db_bounty.total_images;
        let individual_reward = image_reward / CONSENSUS_NUMBER;

        let mut i = 0;
        let voters = label_votes.voters;
        while (i < CONSENSUS_NUMBER) {
            let reward_coin = coin::take(&mut db_bounty.reward_pool, individual_reward, ctx);
            transfer::public_transfer(reward_coin, voters[i]);

            i = i + 1;
        };

        event::emit(LabelFinalizedEvent {
            file: file_name,
            label,
            winners: label_votes.voters, 
            reward_each: individual_reward
        });
    }
}


