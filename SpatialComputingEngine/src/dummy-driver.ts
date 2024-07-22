import {
  ENTER_SPACE_SCHEMA,
  EnterSpaceRequestMessage,
  isControlSpace,
  Path,
  PATH_SCHEMA,
  SEND_ENTITY_SCHEMA,
  SendEntityRequestMessage,
  Space,
  SPACE_SCHEMA,
} from "./frontend-objects.js";
import {
  connectAndGetRepo,
  fetchData,
  saveData,
} from "./spatial-computing-engine.js";

async function acceptSendEntityMessage() {
  const sendEntityMessage: SendEntityRequestMessage = (await (
    await connectAndGetRepo(SEND_ENTITY_SCHEMA)
  )
    .search()
    .where("status")
    .equals("POSTED")
    .return.first()) as SendEntityRequestMessage;
  if (sendEntityMessage === null) return;
  const spaceId = (
    (await fetchData(PATH_SCHEMA, sendEntityMessage.path)) as Path
  ).target;
  const enterSpaceMessage = new EnterSpaceRequestMessage(
    spaceId,
    sendEntityMessage.entity,
    sendEntityMessage.path,
  );
  const space = (await fetchData(
    SPACE_SCHEMA,
    sendEntityMessage.space,
  )) as Space;
  if (isControlSpace(space) && space._type === "MergeSpace") {
    if (space.controlSignal) space.entities[0] = "";
    else space.entities[1] = "";
  } else
    space.entities.splice(space.entities.indexOf(sendEntityMessage.entity), 1);
  await saveData(SPACE_SCHEMA, space);

  enterSpaceMessage.status = "QUEUED";
  const enterSpaceMessageId = await saveData(
    ENTER_SPACE_SCHEMA,
    enterSpaceMessage,
  );
  sendEntity(sendEntityMessage.path, enterSpaceMessageId);
  sendEntityMessage.status = "PROCESSED";
  await saveData(SEND_ENTITY_SCHEMA, sendEntityMessage);
}

async function sendEntity(
  pathId: string,
  enterSpaceMessageId: string,
): Promise<void> {
  let path = (await fetchData(PATH_SCHEMA, pathId)) as Path;
  while (path.isFull) {
    await new Promise((r) => setTimeout(r, 500));
    path = (await fetchData(PATH_SCHEMA, pathId)) as Path;
  }
  path.isFull = true;
  await saveData(PATH_SCHEMA, path);
  const enterSpaceMessage: EnterSpaceRequestMessage = (await fetchData(
    ENTER_SPACE_SCHEMA,
    enterSpaceMessageId,
  )) as EnterSpaceRequestMessage;
  console.log(
    "Sending entity: " +
      enterSpaceMessage.entity +
      " down path: " +
      enterSpaceMessage.path +
      " to space: " +
      enterSpaceMessage.space,
  );
  enterSpaceMessage.status = "ARRIVED";
  await saveData(ENTER_SPACE_SCHEMA, enterSpaceMessage);
}

export async function begin(): Promise<void> {
  while (true) {
    try {
      await acceptSendEntityMessage();
    } catch (err) {
      break;
    }
  }
}
