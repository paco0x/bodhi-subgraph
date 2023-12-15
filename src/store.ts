import {
  Create,
  Remove,
  Trade,
  Transfer,
  User,
  Asset,
  UserAsset,
} from "../generated/schema";
import {
  Create as CreateEvent,
  Remove as RemoveEvent,
  Trade as TradeEvent,
  TransferBatch as TransferBatchEvent,
  TransferSingle as TransferSingleEvent,
} from "../generated/Bodhi/Bodhi";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { ADDRESS_ZERO, BD_ZERO, BI_ZERO } from "./number";

export function newCreate(event: CreateEvent): void {
  let create = new Create(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  create.assetId = event.params.assetId;
  create.sender = event.params.sender;
  create.arTxId = event.params.arTxId;

  create.blockNumber = event.block.number;
  create.blockTimestamp = event.block.timestamp;
  create.transactionHash = event.transaction.hash;

  create.save();
}

export function newRemove(event: RemoveEvent): void {
  let entity = new Remove(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.assetId = event.params.assetId;
  entity.sender = event.params.sender;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function newTrade(event: TradeEvent): void {
  let entity = new Trade(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.tradeType = event.params.tradeType;
  entity.assetId = event.params.assetId;
  entity.sender = event.params.sender;
  entity.tokenAmount = event.params.tokenAmount;
  entity.ethAmount = event.params.ethAmount;
  entity.creatorFee = event.params.creatorFee;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function newTransferFromSingle(event: TransferSingleEvent): void {
  // skip mint & burn
  if (
    event.params.from.toHexString() !== ADDRESS_ZERO &&
    event.params.to.toHexString() !== ADDRESS_ZERO
  ) {
    return;
  }

  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32()).concatI32(0)
  );
  entity.operator = event.params.operator;
  entity.from = event.params.from;
  entity.to = event.params.to;

  entity.Bodhi_id = event.params.id;
  entity.amount = event.params.amount;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function newTransferFromBatch(
  event: TransferBatchEvent,
  index: i32
): void {
  // skip mint & burn
  if (
    event.params.from.toHexString() !== ADDRESS_ZERO &&
    event.params.to.toHexString() !== ADDRESS_ZERO
  ) {
    return;
  }

  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32()).concatI32(0)
  );
  entity.operator = event.params.operator;
  entity.from = event.params.from;
  entity.to = event.params.to;

  entity.Bodhi_id = event.params.ids[index];
  entity.amount = event.params.amounts[index];
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function getOrCreateAsset(id: string): Asset {
  let asset = Asset.load(id);
  if (asset == null) {
    asset = new Asset(id);
    asset.creator = null;
    asset.arTxId = null;
    asset.totalSupply = BI_ZERO;
    asset.totalTrades = BI_ZERO;
    asset.totalFees = BD_ZERO;
    asset.totalVolume = BD_ZERO;
    asset.save();
  }
  return asset;
}

export function getOrCreateUser(addr: Address): User {
  const id = addr.toHexString();
  let user = User.load(id);
  if (user == null) {
    user = new User(id);
    user.address = addr;
    user.save();
  }
  return user;
}

export function getOrCreateUserAsset(user: User, asset: Asset): UserAsset {
  const id = user.id.concat(asset.id);
  let userAsset = UserAsset.load(id);
  if (userAsset == null) {
    userAsset = new UserAsset(id);
    userAsset.user = user.id;
    userAsset.asset = asset.id;
    userAsset.amount = BigInt.fromI32(0);
    userAsset.save();
  }
  return userAsset;
}
