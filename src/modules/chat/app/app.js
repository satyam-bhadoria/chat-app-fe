import axios from 'axios';
import { LightningElement, track } from 'lwc';
import Helper from "chat/helper";
import SocketIO from 'chat/socket';

export default class App extends LightningElement {
  @track loggedInUser = {};
  @track isLoggedIn = false;
  @track showUserList = false;
  @track showChatUser = false;
  @track showChatWindow = false;
  @track recipientUser;
  @track newMsgCounter = 0;
  counter = 0;

  connectedCallback() {
    SocketIO.init();
    SocketIO.setAppInstance(this);
    this.counter = 0;
    if (Helper.getAccessToken()) {
      this.setLogin();
    } else if (Helper.getRefreshToken()){
      this.generateToken().then((res) => {
        this.setLogin();
      })
    }
    this.addEventListener('servermessage', (event) => {
      const chatObj = event.detail;
      if (!this.showChatUser) {
        this.newMsgCounter = this.newMsgCounter+1;
      }
    });
  }

  selectUserTab() {
    this.showUserList = true;
    this.showChatUser = false;
    this.showChatWindow = false;
    SocketIO.setChatInstance(null);
    this.template.querySelector('a.li-user').classList.add('active');
    this.template.querySelector('a.li-chat').classList.remove('active');
  }
  selectChatTab() {
    this.showUserList = false;
    this.showChatUser = true;
    this.showChatWindow = false;
    SocketIO.setChatInstance(null);
    this.newMsgCounter = 0;
    this.template.querySelector('a.li-user').classList.remove('active');
    this.template.querySelector('a.li-chat').classList.add('active');
  }

  startChat(event) {
    const userRec = event.detail.userRec;
    SocketIO.startChat(userRec.id, (roomId) => {
      console.log('start chat with user--->', userRec);
      if (this.template.querySelector('li>a.active')) {
        this.template.querySelector('li>a.active').classList.remove('active');
      }
      this.showChatWindow = true;
      this.showUserList = false;
      this.showChatUser = false;
      this.recipientUser = { ...userRec, chatRoomId: roomId };
    }, () => {
      alert('chat initialization fails');
    });
  }

  async setUser() {
    try{
      const response = await axios({
        method: 'get',
        url: `${API_HOST}/v1/users/me`,
        headers: {
          Authorization: `Bearer ${Helper.getAccessToken()}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      this.loggedInUser = response.data.result;
      Helper.setUserId(response.data.result.userId);
      this.showUserList = true;
      SocketIO.connect();
    } catch (err) {
      if (this.counter < 1 && err.response?.status === 401 && Helper.getRefreshToken()) {
        this.counter++;
        await this.generateToken();
        await this.setUser();
      } else {
        this.setLogout();
        console.log(err.response?.data || err.message);
      }
    }
  }

  async setLogin() {
    this.isLoggedIn = true;
    this.counter = 0;
    await this.setUser();
  }
  setLogout() {
    Helper.setAccessToken('');
    Helper.setRefreshToken('');
    Helper.setUserId('');
    this.isLoggedIn = false;
    this.showUserList = false;
    this.showChatUser = false;
    this.showChatWindow = false;
    SocketIO.disconnect();
  }

  async generateToken() {
    try{
      const response = await axios({
        method: 'post',
        url: `${API_HOST}/v1/auth/token/generate`,
        headers: {
          Authorization: `Bearer ${Helper.getRefreshToken()}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      Helper.setAccessToken(response.data.result.access_token);
    } catch (err) {
      this.setLogout();
      console.log(err.response?.data || err.message);
    }
  }
  
  async logout() {
    try{
      const response = await axios({
        method: 'post',
        url: `${API_HOST}/v1/account/signout`,
        headers: {
          Authorization: `Bearer ${Helper.getAccessToken()}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      this.setLogout();
    } catch (err) {
      this.setLogout();
      console.log(err.response?.data || err.message);
    }
  }
}
