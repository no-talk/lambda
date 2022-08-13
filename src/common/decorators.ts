import { PropertyMetadata, push } from "@notalk/core";

type MessagesArgs = Record<string, never>;

export class MessagesMetadata extends PropertyMetadata<MessagesArgs> {}

export const Messages = () => (target: any, name: string) => push(target, new MessagesMetadata({}, name));
