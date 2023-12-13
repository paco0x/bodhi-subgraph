import {
  Create,
  Remove,
  Trade,
  TransferBatch,
  TransferSingle,
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

export function newTransferBatch(event: TransferBatchEvent): void {
  let entity = new TransferBatch(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.operator = event.params.operator;
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.ids = event.params.ids;
  entity.amounts = event.params.amounts;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function newTransferSingle(event: TransferSingleEvent): void {
  let entity = new TransferSingle(
    event.transaction.hash.concatI32(event.logIndex.toI32())
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

export function getOrCreateAsset(id: string): Asset {
  let asset = Asset.load(id) as Asset;
  if (id == null) {
    asset = new Asset(id);
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
