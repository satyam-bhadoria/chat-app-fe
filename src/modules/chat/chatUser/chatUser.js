import axios from 'axios';
import { LightningElement, track } from 'lwc';
import Helper from "chat/helper";

export default class ChatUser extends LightningElement {
  @track userList = [];

  connectedCallback() {
    if (Helper.isUserLoggedIn()) {
      this.fetchUsers();
    }
  }

  async fetchUsers() {
    try{
      const response = await axios({
        method: 'get',
        url: `${API_HOST}/v1/chats/users`,
        headers: {
          Authorization: `Bearer ${Helper.getAccessToken()}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const userList = response.data.result.listOfItems;
      const myId = Helper.getUserId();
      const finalList = [];
      userList.forEach((userRec) => {
        if (userRec.id !== myId){
          finalList.push(userRec);
        }
      });
      this.userList = finalList;
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  selectUser(event) {
    const selectedUserId = parseInt(event.currentTarget.getAttribute("data-user-id"));
    let selectedUser = {};
    this.userList.forEach(rec => {
      if (rec.id === selectedUserId) {
        selectedUser = {
          id: rec.id,
          name: `${rec.first_name} ${rec.last_name}`,
          profilePic: rec.profile_pic,
        }
      }
    });
    console.log('user selected is ->>>', selectedUser);
    if (selectedUser.id) {
      this.fireStartChatEvent(selectedUser);
    }
  }

  fireStartChatEvent(userRec) {
    this.dispatchEvent(new CustomEvent("startchat", {
      detail: {
        userRec,
      },
    }));
  }
}
