import { Address, BigInt, store } from "@graphprotocol/graph-ts";
import {
  Create as CreateEvent,
  Remove as RemoveEvent,
  Trade as TradeEvent,
  TransferBatch as TransferBatchEvent,
  TransferSingle as TransferSingleEvent,
} from "../generated/Bodhi/Bodhi";
import { ADDRESS_ZERO, BI_ONE, BI_WAD, BI_ZERO, fromWei } from "./number";
import {
  newCreate,
  newRemove,
  newTrade,
  // newTransfer,
  getOrCreateAsset,
  getOrCreateUser,
  getOrCreateUserAsset,
  newTransferFromSingle,
  newTransferFromBatch,
} from "./store";

export function handleCreate(event: CreateEvent): void {
  newCreate(event);
  getOrCreateUser(event.params.sender);
  const asset = getOrCreateAsset(event.params.assetId.toString());
  asset.creator = event.params.sender.toHexString();
  asset.arTxId = event.params.arTxId;
  asset.totalSupply = BI_WAD;
  asset.save();
}

export function handleRemove(event: RemoveEvent): void {
  newRemove(event);
}

export function handleTrade(event: TradeEvent): void {
  newTrade(event);
  const asset = getOrCreateAsset(event.params.assetId.toString());
  if (event.params.tradeType == 0) {
    asset.totalSupply = event.params.tokenAmount;
  } else if (event.params.tradeType == 1) {
    asset.totalSupply = asset.totalSupply.plus(event.params.tokenAmount);
    asset.totalTrades = asset.totalTrades.plus(BI_ONE);
    asset.totalFees = asset.totalFees.plus(fromWei(event.params.creatorFee));
    asset.totalVolume = asset.totalVolume.plus(fromWei(event.params.ethAmount));
  } else {
    asset.totalSupply = asset.totalSupply.minus(event.params.tokenAmount);
    asset.totalTrades = asset.totalTrades.plus(BI_ONE);
    asset.totalFees = asset.totalFees.plus(fromWei(event.params.creatorFee));
    asset.totalVolume = asset.totalVolume.plus(fromWei(event.params.ethAmount));
  }
  asset.save();
}

export function handleTransferBatch(event: TransferBatchEvent): void {
  for (let i = 0; i < event.params.ids.length; i++) {
    const id = event.params.ids[i].toString();
    const amount = event.params.amounts[i];
    handleTransfer(id, event.params.from, event.params.to, amount);
    newTransferFromBatch(event, i);
  }
}

export function handleTransferSingle(event: TransferSingleEvent): void {
  handleTransfer(
    event.params.id.toString(),
    event.params.from,
    event.params.to,
    event.params.amount
  );
  newTransferFromSingle(event);
}

function handleTransfer(
  id: string,
  from: Address,
  to: Address,
  amount: BigInt
): void {
  const asset = getOrCreateAsset(id);

  if (from.toHexString() !== ADDRESS_ZERO) {
    const fromUser = getOrCreateUser(from);
    const userAsset = getOrCreateUserAsset(fromUser, asset);
    userAsset.amount = userAsset.amount.minus(amount);
    if (userAsset.amount.equals(BI_ZERO)) {
      store.remove("UserAsset", userAsset.id);
    } else {
      userAsset.save();
    }
  }

  if (to.toHexString() !== ADDRESS_ZERO) {
    const toUser = getOrCreateUser(to);
    const userAsset = getOrCreateUserAsset(toUser, asset);
    userAsset.amount = userAsset.amount.plus(amount);
    userAsset.save();
  }
}
