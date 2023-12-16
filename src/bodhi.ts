import { Address, BigInt, store } from "@graphprotocol/graph-ts";
import {
  Create as CreateEvent,
  Remove as RemoveEvent,
  Trade as TradeEvent,
  TransferBatch as TransferBatchEvent,
  TransferSingle as TransferSingleEvent,
} from "../generated/Bodhi/Bodhi";
import {
  ADDRESS_ZERO,
  BD_WAD,
  BD_ZERO,
  BI_ONE,
  BI_WAD,
  BI_ZERO,
  fromWei,
} from "./number";
import {
  newCreate,
  newRemove,
  newTrade,
  newTransferFromSingle,
  newTransferFromBatch,
  getOrCreateAsset,
  getOrCreateUser,
  getOrCreateUserAsset,
} from "./store";

export function handleCreate(event: CreateEvent): void {
  newCreate(event);
  getOrCreateUser(event.params.sender);
  const asset = getOrCreateAsset(event.params.assetId);
  asset.assetId = event.params.assetId;
  asset.arTxId = event.params.arTxId;
  asset.creator = event.params.sender.toHexString();
  asset.totalSupply = BD_WAD;
  asset.save();
}

export function handleRemove(event: RemoveEvent): void {
  newRemove(event);
}

export function handleTrade(event: TradeEvent): void {
  const trader = getOrCreateUser(event.params.sender);
  newTrade(event, trader);

  const deltaAmount = fromWei(event.params.tokenAmount);

  const asset = getOrCreateAsset(event.params.assetId);
  if (event.params.tradeType == 0) {
    asset.totalSupply = deltaAmount;
    asset.save();
    return;
  }

  const creator = getOrCreateUser(Address.fromString(asset.creator!));

  const traderAsset = getOrCreateUserAsset(trader, asset);

  const creatorFee = fromWei(event.params.creatorFee);
  const ethAmount = fromWei(event.params.ethAmount);

  asset.totalFees = asset.totalFees.plus(creatorFee);
  asset.totalVolume = asset.totalVolume.plus(ethAmount);
  asset.totalTrades = asset.totalTrades.plus(BI_ONE);

  creator.creatorProfit = creator.creatorProfit.plus(creatorFee);
  creator.save();

  if (event.params.tradeType == 1) {
    // buy
    asset.totalSupply = asset.totalSupply.plus(deltaAmount);
    const cost = creatorFee.plus(ethAmount);
    // traderAsset.amount is updated before this handle function (in handleTransfer)
    // newCost = ((updatedAmount - deltaAmount) * avgPriceBefore + cost)
    // newAvgPrice = newCost / updatedAmount
    traderAsset.avgPrice = traderAsset.amount
      .minus(deltaAmount)
      .times(traderAsset.avgPrice)
      .plus(cost)
      .div(traderAsset.amount);
    traderAsset.save();
  } else {
    // sell
    asset.totalSupply = asset.totalSupply.minus(deltaAmount);
    const cost = deltaAmount.times(traderAsset.avgPrice);
    trader.tradingPnl = trader.tradingPnl.plus(
      ethAmount.minus(creatorFee).minus(cost)
    );
    trader.save();
  }

  asset.save();
}

export function handleTransferBatch(event: TransferBatchEvent): void {
  for (let i = 0; i < event.params.ids.length; i++) {
    const id = event.params.ids[i];
    const amount = event.params.amounts[i];
    handleTransfer(id, event.params.from, event.params.to, amount);
    newTransferFromBatch(event, i);
  }
}

export function handleTransferSingle(event: TransferSingleEvent): void {
  handleTransfer(
    event.params.id,
    event.params.from,
    event.params.to,
    event.params.amount
  );
  newTransferFromSingle(event);
}

function handleTransfer(
  id: BigInt,
  from: Address,
  to: Address,
  amount: BigInt
): void {
  const asset = getOrCreateAsset(id);
  const amountBd = fromWei(amount);

  if (from.toHexString() != ADDRESS_ZERO) {
    const fromUser = getOrCreateUser(from);
    const userAsset = getOrCreateUserAsset(fromUser, asset);
    userAsset.amount = userAsset.amount.minus(amountBd);
    userAsset.save();
  }

  if (to.toHexString() != ADDRESS_ZERO) {
    const toUser = getOrCreateUser(to);
    const userAsset = getOrCreateUserAsset(toUser, asset);
    userAsset.amount = userAsset.amount.plus(amountBd);
    userAsset.save();
  }
}
