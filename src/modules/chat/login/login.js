import axios from 'axios';
import { LightningElement } from 'lwc';
import Helper from "chat/helper";

export default class Login extends LightningElement {
  async login(event) {
    event.preventDefault();
    const form = this.template.querySelector('form.login-form');
    const email = form.querySelector('input[name="email"]').value;
    const password = form.querySelector('input[name="password"]').value;
    
    try{
      const response = await axios({
        method: 'post',
        url: `${API_HOST}/v1/account/login/email`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        data: {
          email,
          password
        },
      });
      Helper.setAccessToken(response.data.result.access_token);
      Helper.setRefreshToken(response.data.result.refresh_token);
      this.fireLoggedInEvent();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  fireLoggedInEvent() {
    this.dispatchEvent(new CustomEvent("loggedin"));
  }
}
