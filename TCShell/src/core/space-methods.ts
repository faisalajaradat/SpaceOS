import { Entity, EntityId } from "redis-om";
import {
  connectAndGetRepo,
  ENTER_SPACE_SCHEMA,
  EnterSpaceRequestMessage,
  ENTITY_SCHEMA,
  fetchAll,
  fetchData,
  isControlSpace,
  Path,
  PATH_SCHEMA,
  saveData,
  SEND_ENTITY_SCHEMA,
  SendEntityRequestMessage,
  Space,
  SPACE_SCHEMA,
  SpatialEntity,
} from "../../../SpatialComputingEngine/src/index.js";

const enum SPACE_ERROR {
  DNE = "Space does not exist!",
}

export const addEntities = async (
  ...args: unknown[]
): Promise<string | void> => {
  const space: Space = (await fetchData(
    SPACE_SCHEMA,
    args[0] as string,
  )) as Space;
  if (space._type === undefined) return SPACE_ERROR.DNE;
  if (
    (await fetchAll(ENTITY_SCHEMA, args[1] as string[])).filter(
      (entity: SpatialEntity) => entity._type === undefined,
    ).length > 0
  )
    return "Not all input entities exist!";
  space.entities.push(...(args[1] as string[]));
  await saveData(SPACE_SCHEMA, space);
};

export const getEntities = async (
  ...args: unknown[]
): Promise<string | string[]> => {
  const space: Space = (await fetchData(
    SPACE_SCHEMA,
    args[0] as string,
  )) as Space;
  if (space._type === undefined) return SPACE_ERROR.DNE;
  return space.entities;
};

export const sendEntity = async (
  ...args: unknown[]
): Promise<string | void> => {
  const space: Space = (await fetchData(
    SPACE_SCHEMA,
    args[0] as string,
  )) as Space;
  if (
    space.entities === undefined ||
    !space.entities.includes(args[1] as string)
  )
    return "Space does not contain inputted entity!";
  const entityIndex = space.entities.indexOf(args[1] as string);
  if (isControlSpace(space)) {
    if (
      space._type === "MergeSpace" &&
      ((entityIndex === 0 && !space.controlSignal) ||
        (entityIndex === 1 && space.controlSignal))
    )
      return "Entity blocked by control signal!";
    if (
      space._type === "SelectionSpace" &&
      (((args[2] as string) === space.truePath && !space.controlSignal) ||
        ((args[2] as string) === space.falsePath && space.controlSignal))
    )
      return "Path blocked by control signal!";
  }
  let message: SendEntityRequestMessage = new SendEntityRequestMessage(
    args[0] as string,
    args[1] as string,
    args[2] as string,
  );
  const msgId = await saveData(SEND_ENTITY_SCHEMA, message);
  while (message.status !== "PROCESSED") {
    await new Promise((r) => setTimeout(r, args[3] as number));
    message = (await fetchData(
      SEND_ENTITY_SCHEMA,
      msgId,
    )) as SendEntityRequestMessage;
    if (message.status === "ERROR") return message.errorMsg as string;
  }
};

export const receiveEntity = async (
  ...args: unknown[]
): Promise<string | void> => {
  let space: Space = (await fetchData(
    SPACE_SCHEMA,
    args[0] as string,
  )) as Space;
  if (space.entities === undefined) return SPACE_ERROR.DNE;
  if (space.entities.includes(args[1] as string))
    return "Space already contains entity!";
  let message: EnterSpaceRequestMessage = (await (
    await connectAndGetRepo(ENTER_SPACE_SCHEMA)
  )
    .search()
    .where("space")
    .equals(args[0] as string)
    .and("entity")
    .equals(args[1] as string)
    .and((search) =>
      search
        .where("status")
        .not.equals("ACCEPTED")
        .and("status")
        .not.equals("DENIED"),
    )
    .sortAscending("timestamp")
    .return.first()) as EnterSpaceRequestMessage;
  if (message === null) return "Entity is not attempting to enter space!";
  while (message.status !== "ARRIVED") {
    if (message.status === "ERROR") {
      message.status = "DECLINED";
      message.timestamp = new Date(Date.now());
      await saveData(ENTER_SPACE_SCHEMA, message);
      return message.errorMsg;
    }
    await new Promise((r) => setTimeout(r, args[2] as number));
    message = (await fetchData(
      ENTER_SPACE_SCHEMA,
      (message as Entity)[EntityId],
    )) as EnterSpaceRequestMessage;
  }
  space = (await fetchData(SPACE_SCHEMA, args[0] as string)) as Space;
  if (isControlSpace(space) && space._type === "MergeSpace") {
    if (message.path === space.truePath) {
      if (space.entities[0] === "") space.entities[0] = message.entity;
      else return "Merge space true input is already full!";
    }
    if (message.path === space.falsePath) {
      if (space.entities[1] === "") space.entities[1] = message.entity;
      else return "Merge space false input is already full!";
    }
  } else space.entities.push(message.entity);
  await saveData(SPACE_SCHEMA, space);
  message.status = "ACCEPTED";
  message.timestamp = new Date(Date.now());
  await saveData(ENTER_SPACE_SCHEMA, message);
  const path: Path = (await fetchData(PATH_SCHEMA, message.path)) as Path;
  path.isFull = false;
  await saveData(PATH_SCHEMA, path);
};
