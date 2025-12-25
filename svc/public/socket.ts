import { registerNamespace } from "#lib/socket/namespace";


type ServerEvents = {
    "user:created": { id: string, name: string };
};

export default registerNamespace<ServerEvents>();