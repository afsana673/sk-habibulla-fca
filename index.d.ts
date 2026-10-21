import { EventEmitter } from 'node:events';
import { IncomingMessage, ServerResponse, Server } from 'node:http';

type Callback = (err: Error | null, result?: { recipient_id?: string; message_id?: string }) => void;
export interface FCAOptions {
  pageId: string;
  pageAccessToken: string;
  verifyToken: string;
  appSecret: string;
  apiVersion?: string;
  webhookPath?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}
export interface MessengerEvent {
  type: 'message' | 'postback' | 'read' | 'delivery' | 'reaction';
  senderID: string;
  threadID: string;
  recipientID: string;
  timestamp: number;
  body?: string;
  messageID?: string;
  attachments?: unknown[];
  isEcho?: boolean;
  quickReply?: string | null;
  payload?: string;
  raw: unknown;
}
export declare class MessengerFCA extends EventEmitter {
  constructor(options: FCAOptions);
  readonly pageId: string;
  readonly pageAccessToken: string;
  readonly verifyToken: string;
  readonly appSecret: string;
  readonly apiVersion: string;
  readonly webhookPath: string;
  getCurrentUserID(): string;
  sendMessage(message: string | Record<string, unknown>, threadID: string, callback?: Callback): Promise<any> | undefined;
  sendAttachment(type: 'image' | 'audio' | 'video' | 'file', url: string, threadID: string, callback?: Callback): Promise<any> | undefined;
  sendQuickReplies(text: string, replies: Record<string, unknown>[], threadID: string, callback?: Callback): Promise<any> | undefined;
  senderAction(action: 'typing_on' | 'typing_off' | 'mark_seen', threadID: string, callback?: Callback): Promise<any> | undefined;
  sendTemplate(payload: Record<string, unknown>, threadID: string, callback?: Callback): Promise<any> | undefined;
  listen(handler: (event: MessengerEvent) => void | Promise<void>): () => void;
  on(event: 'message' | 'postback' | 'read' | 'delivery' | 'reaction', handler: (event: MessengerEvent) => void | Promise<void>): this;
  on(event: 'handlerError', handler: (error: Error) => void): this;
  webhookHandler(): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
  startWebhook(options?: { port?: number; host?: string }): Promise<Server>;
  stopWebhook(): Promise<void>;
}
export declare function createClient(options: FCAOptions): MessengerFCA;

// Personal-account API is powered by an unofficial third-party backend.
export type PersonalAppState = Array<Record<string, unknown>>;
export interface PersonalEvent {
  type: string;
  threadID?: string;
  senderID?: string;
  body?: string;
  messageID?: string;
  [key: string]: unknown;
}
export interface PersonalFCAApi {
  getCurrentUserID(): string;
  getAppState(): PersonalAppState;
  setOptions(options: Record<string, unknown>): void;
  listenMqtt(handler: (error: Error | null, event?: PersonalEvent) => void): unknown;
  sendMessage(message: string | Record<string, unknown>, threadID: string, callback?: (error: Error | null, info?: unknown) => void, messageID?: string): unknown;
  [method: string]: any;
}
export interface PersonalLoginCredentials {
  appState: PersonalAppState;
}
export declare function login(credentials: PersonalLoginCredentials, callback: (error: Error | null, api?: PersonalFCAApi) => void): unknown;
export declare function login(credentials: PersonalLoginCredentials, options: Record<string, unknown>, callback: (error: Error | null, api?: PersonalFCAApi) => void): unknown;
export default login;
