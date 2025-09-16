import { decodeErrorResult, type Abi, type Hex } from 'viem';

function getErrData(err: any): Hex | undefined { return err?.data ?? err?.cause?.data ?? err?.cause?.cause?.data }
function getErrMessage(err: any): string { return err?.shortMessage ?? err?.message ?? 'Execution reverted' }
function getErrCode(err: any): number | undefined { return err?.code ?? err?.cause?.code ?? err?.cause?.cause?.code }
function isInternalRpcError(err: any) {
  const code = getErrCode(err);
  const msg  = (getErrMessage(err) || '').toLowerCase();
  const details = (err?.details || '').toLowerCase();
  return code === -32603 || msg.includes('internal json-rpc error') || details.includes('internal json-rpc error');
}

export function explainError(e: unknown, abi?: Abi, _bytecode?: Hex) {
  const err = e as any;
  const data = getErrData(err);
  const msg  = getErrMessage(err);
  console.error('Full error object:', { message: err?.message, shortMessage: err?.shortMessage, data, cause: err?.cause, details: err?.details, code: getErrCode(err), stack: err?.stack });
  if (data && typeof data === 'string' && abi) {
    try { const decoded = decodeErrorResult({ abi, data }); const args = decoded.args?.map(String).join(', '); return `${msg} — ${decoded.errorName}${args ? `(${args})` : ''}` } catch {}
  }
  if (isInternalRpcError(err)) {
    return `${msg} — Node returned -32603 (Internal JSON-RPC). Common causes: block gas limit exceeded for lane, RPC estimation bug, or chain config mismatch.`;
  }
  return msg;
}

export const FALLBACK_CREATE_GAS = 1_400_000n;
export const FALLBACK_CALL_GAS   = 300_000n;
export const ALTERNATIVE_GAS_LIMITS = [1_500_000n,1_300_000n,1_800_000n,2_000_000n,1_200_000n];
export function getBytecodeSize(bytecode: string): number { return Math.max(0, (bytecode.length - 2) / 2) }
export function isBytecodeTooLarge(bytecode: string): boolean { const sizeInBytes = getBytecodeSize(bytecode); return sizeInBytes > 24_576 }

