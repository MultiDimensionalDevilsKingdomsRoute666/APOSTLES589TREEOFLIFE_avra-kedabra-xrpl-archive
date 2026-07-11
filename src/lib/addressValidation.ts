import { isValidClassicAddress, isValidXAddress } from "xrpl";

export function isValidXrplAddress(address: string): boolean {
  return isValidClassicAddress(address) || isValidXAddress(address);
}
