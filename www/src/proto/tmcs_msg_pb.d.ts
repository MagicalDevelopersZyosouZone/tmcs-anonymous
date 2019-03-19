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
  getId(): number;
  setId(value: number): void;

  getType(): SignedMsg.Type;
  setType(value: SignedMsg.Type): void;

  getReceiver(): string;
  setReceiver(value: string): void;

  getSender(): string;
  setSender(value: string): void;

  getBody(): Uint8Array | string;
  getBody_asU8(): Uint8Array;
  getBody_asB64(): string;
  setBody(value: Uint8Array | string): void;

  getSign(): Uint8Array | string;
  getSign_asU8(): Uint8Array;
  getSign_asB64(): string;
  setSign(value: Uint8Array | string): void;

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
    id: number,
    type: SignedMsg.Type,
    receiver: string,
    sender: string,
    body: Uint8Array | string,
    sign: Uint8Array | string,
  }

  export enum Type {
    MESSAGE = 0,
    RECEIPT = 1,
    ERROR = 2,
  }
}

export class MessagePack extends jspb.Message {
  clearMsgList(): void;
  getMsgList(): Array<Message>;
  setMsgList(value: Array<Message>): void;
  addMsg(value?: Message, index?: number): Message;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessagePack.AsObject;
  static toObject(includeInstance: boolean, msg: MessagePack): MessagePack.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MessagePack, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessagePack;
  static deserializeBinaryFromReader(message: MessagePack, reader: jspb.BinaryReader): MessagePack;
}

export namespace MessagePack {
  export type AsObject = {
    msgList: Array<Message.AsObject>,
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

  getTimestamp(): number;
  setTimestamp(value: number): void;

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
    timestamp: number,
    encryptedmsg: Uint8Array | string,
  }
}

export class ReceiptPack extends jspb.Message {
  clearReceiptsList(): void;
  getReceiptsList(): Array<MsgReceipt>;
  setReceiptsList(value: Array<MsgReceipt>): void;
  addReceipts(value?: MsgReceipt, index?: number): MsgReceipt;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReceiptPack.AsObject;
  static toObject(includeInstance: boolean, msg: ReceiptPack): ReceiptPack.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ReceiptPack, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReceiptPack;
  static deserializeBinaryFromReader(message: ReceiptPack, reader: jspb.BinaryReader): ReceiptPack;
}

export namespace ReceiptPack {
  export type AsObject = {
    receiptsList: Array<MsgReceipt.AsObject>,
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
    VERIFYFAILED = 4,
  }
}

export class Error extends jspb.Message {
  getCode(): ErrorCode;
  setCode(value: ErrorCode): void;

  getMessage(): string;
  setMessage(value: string): void;

  getData(): string;
  setData(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Error.AsObject;
  static toObject(includeInstance: boolean, msg: Error): Error.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Error, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Error;
  static deserializeBinaryFromReader(message: Error, reader: jspb.BinaryReader): Error;
}

export namespace Error {
  export type AsObject = {
    code: ErrorCode,
    message: string,
    data: string,
  }
}

export class ClientHandShake extends jspb.Message {
  getClientversion(): number;
  setClientversion(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClientHandShake.AsObject;
  static toObject(includeInstance: boolean, msg: ClientHandShake): ClientHandShake.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ClientHandShake, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClientHandShake;
  static deserializeBinaryFromReader(message: ClientHandShake, reader: jspb.BinaryReader): ClientHandShake;
}

export namespace ClientHandShake {
  export type AsObject = {
    clientversion: number,
  }
}

export class ServerHandShake extends jspb.Message {
  getServerversion(): number;
  setServerversion(value: number): void;

  getToken(): string;
  setToken(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerHandShake.AsObject;
  static toObject(includeInstance: boolean, msg: ServerHandShake): ServerHandShake.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerHandShake, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerHandShake;
  static deserializeBinaryFromReader(message: ServerHandShake, reader: jspb.BinaryReader): ServerHandShake;
}

export namespace ServerHandShake {
  export type AsObject = {
    serverversion: number,
    token: string,
  }
}

export class SignIn extends jspb.Message {
  getFingerprint(): string;
  setFingerprint(value: string): void;

  getToken(): string;
  setToken(value: string): void;

  getSign(): string;
  setSign(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignIn.AsObject;
  static toObject(includeInstance: boolean, msg: SignIn): SignIn.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SignIn, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignIn;
  static deserializeBinaryFromReader(message: SignIn, reader: jspb.BinaryReader): SignIn;
}

export namespace SignIn {
  export type AsObject = {
    fingerprint: string,
    token: string,
    sign: string,
  }
}

export enum ErrorCode {
  NONE = 0,
  VERIFYERROR = 1001,
  INVALIDMESSAGE = 1000,
}

