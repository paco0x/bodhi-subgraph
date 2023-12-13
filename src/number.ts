import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export const BI_ZERO = BigInt.fromI32(0);
export const BI_ONE = BigInt.fromI32(1);
export const DEFAULT_DECIMALS = BigInt.fromI32(18);
export const BD_ONE = exponentToBigDecimal(DEFAULT_DECIMALS);
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = BI_ZERO; i.lt(decimals as BigInt); i = i.plus(BI_ONE)) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

export function fromWei(
  value: BigInt,
  decimals: BigInt = DEFAULT_DECIMALS
): BigDecimal {
  return value.toBigDecimal().div(exponentToBigDecimal(decimals));
}
