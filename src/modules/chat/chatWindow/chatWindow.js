import { LightningElement, api } from 'lwc';
import axios from 'axios';
import Helper from "chat/helper";
import SocketIO from 'chat/socket';

export default class ChatWindow extends LightningElement {
  _recipientUser;
  @api get recipientUser() {
    return this._recipientUser;
  }
  set recipientUser(val) {
    this._recipientUser = val;
    this.getChatHistory(val.chatRoomId);
  }

  connectedCallback() {
    SocketIO.setChatInstance(this);
    this.addEventListener('servermessage', (event) => {
      const chatObj = event.detail;
      console.log('chatObj--->', chatObj);
      chatObj.messageAt = new Date().toISOString();
      const msgHtml = this.formatMessageToAppend(chatObj.message, chatObj.msgFrom === Helper.getUserId() ? 'right': 'left', chatObj.messageAt);
      this.appendMessage(msgHtml);
      SocketIO.markMessageAsRead(chatObj.msgFrom, chatObj.messageId);
    });
  }

  submitMessage(event) {
    const myId = Helper.getUserId();
    event.preventDefault();
    const msgerInput = this.template.querySelector(".msger-input");
    console.log(`sending msg "${msgerInput.value}" from user "${myId}" to "${this.recipientUser.id}"`);
    SocketIO.sendMessage(this.recipientUser.id, msgerInput.value);
    const msgHtml = this.formatMessageToAppend(msgerInput.value, 'right');
    this.appendMessage(msgHtml, true);
    msgerInput.value = '';
  }

  formatMessageToAppend(msgText, side, date = new Date()) {
    const msgHTML = `
    <div class="msg ${side}-msg">
    <div class="msg-img"></div>
    <div class="msg-bubble">
    <div class="msg-text">${msgText} <sub style="font-size: 10px">${this.formatDate(date)}</sub></div>
    </div>
    </div>`;
    return msgHTML;
  }

  getStickyMsgHtml(msg) {
    return `<div class="msg-sticky">
      <span class="msg-sticky-content">${msg}</span>
    </div>`
  }

  appendMessage(msgHtml, isSendingMsg = false, fullScroll = false, unreadCase = false) {
    const msgerChat = this.template.querySelector(".msger-chat");
    console.log('scroll height', msgerChat.scrollTop, msgerChat.scrollHeight - msgerChat.clientHeight - 5);
    let scrollVal = msgerChat.scrollTop;
    if (isSendingMsg){
      scrollVal = msgerChat.scrollHeight;
    } else if (!isSendingMsg && (msgerChat.scrollTop > 0 && msgerChat.scrollTop >= msgerChat.scrollHeight - msgerChat.clientHeight - 5)) {
      scrollVal = msgerChat.scrollTop + (msgerChat.clientHeight / 2);
    } else if (unreadCase) {
      if (msgerChat.scrollTop > (msgerChat.clientHeight / 2)) {
        scrollVal = msgerChat.scrollTop + (msgerChat.clientHeight / 2);
      }
    }
    msgerChat.insertAdjacentHTML("beforeend", msgHtml);
    if (fullScroll){
      scrollVal = msgerChat.scrollHeight;
    }
    msgerChat.scrollTop = scrollVal;
    console.log('method completed');
  }

  formatDate(date) {
    console.log('date--->', date);
    if (typeof date === 'string') {
      date = new Date(date);
    }
    const h = "0" + date.getHours();
    const m = "0" + date.getMinutes();
    return `${h.slice(-2)}:${m.slice(-2)}`;
  }

  async getChatHistory(roomId) {
    try{
      const response = await axios({
        method: 'get',
        url: `${Helper.apiHost}/v1/chats/${roomId}`,
        headers: {
          Authorization: `Bearer ${Helper.getAccessToken()}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const chatList = response.data.result.listOfItems;
      console.log(chatList);
      let msgHtml = '';
      let unreadMsgHtml = '';
      let lastSickyDate = '';
      let showUnReadSticky = chatList[0] ? !chatList[0].isMsgRead : false;
      chatList.forEach((chatRec) => {
        if (showUnReadSticky && chatRec.isMsgRead) {
          showUnReadSticky = false;
          unreadMsgHtml = this.getStickyMsgHtml('unread') + msgHtml;
          msgHtml = '';
        }
        const dd = new Date(chatRec.createdAt);
        if (lastSickyDate != dd.toLocaleDateString()) {
          msgHtml = (lastSickyDate ? this.getStickyMsgHtml(lastSickyDate) : '') + msgHtml;
          lastSickyDate = dd.toLocaleDateString();
        }
        msgHtml = this.formatMessageToAppend(chatRec.message, (chatRec.isSendByMe ? 'right' : 'left'), dd) + msgHtml;
      });
      msgHtml = (lastSickyDate ? this.getStickyMsgHtml(lastSickyDate) : '') + msgHtml;
      if (showUnReadSticky) {
        unreadMsgHtml = this.getStickyMsgHtml('unread') + msgHtml;
        msgHtml = '';
      }
      this.appendMessage(msgHtml, false, true);
      this.appendMessage(unreadMsgHtml, false);
      console.log('history latest record', chatList[0]);
      if (chatList[0]?.messageId && chatList[0].isMsgRead === false){
        console.log('marking messages as read');
        SocketIO.markMessageAsRead(this.recipientUser.id, chatList[0].messageId);
      }
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }
}