import {
  ENTER_SPACE_SCHEMA,
  EnterSpaceRequestMessage,
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
    sendEntityMessage.entity,
    spaceId,
  );
  const space = (await fetchData(
    SPACE_SCHEMA,
    sendEntityMessage.space,
  )) as Space;
  console.log(
    "Sending entity: " +
      sendEntityMessage.entity +
      " from space: " +
      sendEntityMessage.space +
      " down path: " +
      sendEntityMessage.path +
      " to space: " +
      spaceId,
  );
  space.entities.splice(space.entities.indexOf(sendEntityMessage.entity), 1);
  await saveData(SPACE_SCHEMA, space);
  enterSpaceMessage.status = "ARRIVED";
  await saveData(ENTER_SPACE_SCHEMA, enterSpaceMessage);
  sendEntityMessage.status = "PROCESSED";
  await saveData(SEND_ENTITY_SCHEMA, sendEntityMessage);
}

export async function begin(): Promise<void> {
  while (true) {
    await acceptSendEntityMessage();
  }
}
