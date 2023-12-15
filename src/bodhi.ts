import { Address, BigInt, store } from "@graphprotocol/graph-ts";
import {
  Create as CreateEvent,
  Remove as RemoveEvent,
  Trade as TradeEvent,
  TransferBatch as TransferBatchEvent,
  TransferSingle as TransferSingleEvent,
} from "../generated/Bodhi/Bodhi";
import { ADDRESS_ZERO, BI_ZERO } from "./number";
import {
  newCreate,
  newRemove,
  newTrade,
  newTransferBatch,
  newTransferSingle,
  getOrCreateAsset,
  getOrCreateUser,
  getOrCreateUserAsset,
} from "./store";

export function handleCreate(event: CreateEvent): void {
  newCreate(event);
  getOrCreateUser(event.params.sender);
  const asset = getOrCreateAsset(event.params.assetId.toString());
  asset.creator = event.params.sender.toHexString();
  asset.arTxId = event.params.arTxId;
  asset.save();
}

export function handleRemove(event: RemoveEvent): void {
  newRemove(event);
}

export function handleTrade(event: TradeEvent): void {
  newTrade(event);
}

export function handleTransferBatch(event: TransferBatchEvent): void {
  newTransferBatch(event);

  for (let i = 0; i < event.params.ids.length; i++) {
    const id = event.params.ids[i].toString();
    const amount = event.params.amounts[i];
    handleTransfer(id, event.params.from, event.params.to, amount);
  }
}

export function handleTransferSingle(event: TransferSingleEvent): void {
  newTransferSingle(event);
  handleTransfer(
    event.params.id.toString(),
    event.params.from,
    event.params.to,
    event.params.amount
  );
}

function handleTransfer(
  id: string,
  from: Address,
  to: Address,
  amount: BigInt
): void {
  const asset = getOrCreateAsset(id);

  if (from.toHexString() == ADDRESS_ZERO) {
    asset.totalSupply = asset.totalSupply.plus(amount);
    asset.save();
  } else {
    const fromUser = getOrCreateUser(from);
    const userAsset = getOrCreateUserAsset(fromUser, asset);
    userAsset.amount = userAsset.amount.minus(amount);
    if (userAsset.amount.equals(BI_ZERO)) {
      store.remove("UserAsset", userAsset.id);
    } else {
      userAsset.save();
    }
  }

  if (to.toHexString() === ADDRESS_ZERO) {
    asset.totalSupply = asset.totalSupply.minus(amount);
    asset.save();
  } else {
    const toUser = getOrCreateUser(to);
    const userAsset = getOrCreateUserAsset(toUser, asset);
    userAsset.amount = userAsset.amount.plus(amount);
    userAsset.save();
  }
}
