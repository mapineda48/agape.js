import AgapeLanding from "./AgapeLanding";
import sayhello from "@agape";

export const onInit = async () => {
    const message = await sayhello("Miguel Pineda");
    return ({ message });
}

export default AgapeLanding;