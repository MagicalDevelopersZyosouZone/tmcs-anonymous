// package: tmcs_msg
// file: proto/tmcs_msg.proto

import * as jspb from "google-protobuf";

export class NewSession extends jspb.Message {
  getPubkey(): string;
  setPubkey(value: string): void;

  getLifetime(): number;
  setLifetime(value: number): void;

  getGroup(): boolean;
  setGroup(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewSession.AsObject;
  static toObject(includeInstance: boolean, msg: NewSession): NewSession.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NewSession, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NewSession;
  static deserializeBinaryFromReader(message: NewSession, reader: jspb.BinaryReader): NewSession;
}

export namespace NewSession {
  export type AsObject = {
    pubkey: string,
    lifetime: number,
    group: boolean,
  }
}

export class SignedMsg extends jspb.Message {
  getMessage(): Uint8Array | string;
  getMessage_asU8(): Uint8Array;
  getMessage_asB64(): string;
  setMessage(value: Uint8Array | string): void;

  getFingerprint(): string;
  setFingerprint(value: string): void;

  getSender(): string;
  setSender(value: string): void;

  getSign(): string;
  setSign(value: string): void;

  getType(): SignedMsg.MsgType;
  setType(value: SignedMsg.MsgType): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignedMsg.AsObject;
  static toObject(includeInstance: boolean, msg: SignedMsg): SignedMsg.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SignedMsg, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignedMsg;
  static deserializeBinaryFromReader(message: SignedMsg, reader: jspb.BinaryReader): SignedMsg;
}

export namespace SignedMsg {
  export type AsObject = {
    message: Uint8Array | string,
    fingerprint: string,
    sender: string,
    sign: string,
    type: SignedMsg.MsgType,
  }

  export enum MsgType {
    MESSAGE = 0,
    RECEIPT = 1,
  }
}

export class MsgPackage extends jspb.Message {
  clearReceiptsList(): void;
  getReceiptsList(): Array<MsgReceipt>;
  setReceiptsList(value: Array<MsgReceipt>): void;
  addReceipts(value?: MsgReceipt, index?: number): MsgReceipt;

  clearMessagesList(): void;
  getMessagesList(): Array<Message>;
  setMessagesList(value: Array<Message>): void;
  addMessages(value?: Message, index?: number): Message;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MsgPackage.AsObject;
  static toObject(includeInstance: boolean, msg: MsgPackage): MsgPackage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MsgPackage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MsgPackage;
  static deserializeBinaryFromReader(message: MsgPackage, reader: jspb.BinaryReader): MsgPackage;
}

export namespace MsgPackage {
  export type AsObject = {
    receiptsList: Array<MsgReceipt.AsObject>,
    messagesList: Array<Message.AsObject>,
  }
}

export class Message extends jspb.Message {
  getMsgid(): string;
  setMsgid(value: string): void;

  getReceiver(): string;
  setReceiver(value: string): void;

  getEncryptedmsg(): Uint8Array | string;
  getEncryptedmsg_asU8(): Uint8Array;
  getEncryptedmsg_asB64(): string;
  setEncryptedmsg(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Message.AsObject;
  static toObject(includeInstance: boolean, msg: Message): Message.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Message, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Message;
  static deserializeBinaryFromReader(message: Message, reader: jspb.BinaryReader): Message;
}

export namespace Message {
  export type AsObject = {
    msgid: string,
    receiver: string,
    encryptedmsg: Uint8Array | string,
  }
}

export class Connect extends jspb.Message {
  getFingerprint(): string;
  setFingerprint(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Connect.AsObject;
  static toObject(includeInstance: boolean, msg: Connect): Connect.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Connect, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Connect;
  static deserializeBinaryFromReader(message: Connect, reader: jspb.BinaryReader): Connect;
}

export namespace Connect {
  export type AsObject = {
    fingerprint: string,
  }
}

export class JoinSession extends jspb.Message {
  getPubkey(): string;
  setPubkey(value: string): void;

  getToken(): string;
  setToken(value: string): void;

  getTargetfingerprint(): string;
  setTargetfingerprint(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): JoinSession.AsObject;
  static toObject(includeInstance: boolean, msg: JoinSession): JoinSession.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: JoinSession, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): JoinSession;
  static deserializeBinaryFromReader(message: JoinSession, reader: jspb.BinaryReader): JoinSession;
}

export namespace JoinSession {
  export type AsObject = {
    pubkey: string,
    token: string,
    targetfingerprint: string,
  }
}

export class MsgReceipt extends jspb.Message {
  getMsgid(): string;
  setMsgid(value: string): void;

  getState(): MsgReceipt.MsgState;
  setState(value: MsgReceipt.MsgState): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MsgReceipt.AsObject;
  static toObject(includeInstance: boolean, msg: MsgReceipt): MsgReceipt.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MsgReceipt, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MsgReceipt;
  static deserializeBinaryFromReader(message: MsgReceipt, reader: jspb.BinaryReader): MsgReceipt;
}

export namespace MsgReceipt {
  export type AsObject = {
    msgid: string,
    state: MsgReceipt.MsgState,
  }

  export enum MsgState {
    LOST = 0,
    RECEIVED = 1,
    TIMEOUT = 2,
  }
}

