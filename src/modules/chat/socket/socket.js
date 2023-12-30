import { LightningElement } from 'lwc';
import { io } from "socket.io-client";
import { v4 as uuidV4 } from "uuid";
import Helper from "chat/helper";

const socket = io("ws://localhost:5005", {
  autoConnect: false,
  transports: ["websocket"]
});

export default class SocketIO extends LightningElement {
  chatInstance;
  appInstance;
  static setAppInstance(appInstance) {
    this.appInstance = appInstance;
  }
  static setChatInstance(chatInstance) {
    this.chatInstance = chatInstance;
  }
  static init() {
    socket.onAny((event, ...args) => {
      console.log(event, args);
    });
    
    socket.on("server_message", ({ msgFrom, msgTo, messageId, message, messageAt }) => {
      console.log('message-->', message, '---from-->', msgFrom, '---to-->', msgTo);

      let instanceElem;
      if ((msgTo === Helper.getUserId() && msgFrom === this.chatInstance?.recipientUser?.id)
        || (msgFrom === Helper.getUserId() && msgTo === this.chatInstance?.recipientUser?.id)) {

        instanceElem = this.chatInstance;
      }
      if (msgTo === Helper.getUserId() && this.chatInstance?.recipientUser?.id !== msgFrom) {
        instanceElem = this.appInstance;
      }
      instanceElem?.dispatchEvent(new CustomEvent("servermessage", {
        detail: {
          messageId,
          message,
          msgFrom,
          msgTo
        }
      }));
    });
  }

  static startChat(userId, callback, errCallback) {
    socket.emit('chat_initialize', { userId }, (response) => {
      if (response.status === 'success') {
        callback(response.chatRoomId);
      } else {
        errCallback();
      }
    });
  }

  static connect() {
    socket.auth = {
      token: Helper.getAccessToken()
    };
    socket.connect();
  }

  static disconnect() {
    SocketIO.setChatInstance(null);
    socket.disconnect();
  }

  static sendMessage(msgTo, message) {
    socket.emit("client_message", {
      msgTo,
      message
    });
  }

  static markMessageAsRead(msgById, messageId, readAt) {
    socket.emit("client_message_read", {
      msgById,
      messageId
    });
  }
}
