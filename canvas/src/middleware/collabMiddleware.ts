import { globalUuidTable } from "../types/utils";
import type { State as LWWMapState } from "../types/index";

/**
 * 序列化状态：将pixelData.state中完整的UUID进行替换，使用更加小并且短的索引
 * @param originalState 原始状态
 * @param uuid  当前PixelData的UUID
 * @returns 
 */
export function serializeState(originalState: LWWMapState<any>, uuid: string) {
  const peerKey = globalUuidTable.add(uuid);
  const optimilizedState: LWWMapState<any> = {};
  Object.entries(originalState).forEach(([key, register]) => {
    optimilizedState[key] = [String(peerKey), register[1], register[2]];
  });
  return {
    optimilizedState,
    uuidTable: globalUuidTable.serialize(),
  };
}

/**
 * 反序列化，找到原有的UUID
 * @param optimilizedState 
 * @param uuidTable 
 * @returns 
 */
export function deserializeState(
  optimilizedState: LWWMapState<any>,
  uuidTable: Record<number, string>
) {
  globalUuidTable.deserialize(uuidTable);
  const originalState: LWWMapState<any> = {};
  Object.entries(optimilizedState).forEach(([key, registerState]) => {
    const peerKey = registerState[0];
    const peerUuid = globalUuidTable.getUuidByKey(Number(peerKey)) || "";
    originalState[key] = [peerUuid, registerState[1], registerState[2]];
  });
  return originalState;
}
