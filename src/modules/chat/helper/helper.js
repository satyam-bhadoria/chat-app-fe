export default class Helper {
  static isUserLoggedIn() {
    if (this.getAccessToken()) {
      return true;
    }
    return false;
  }

  static getAccessToken() {
    return localStorage.getItem("auth:accessToken");
  }

  static setAccessToken(token) {
    localStorage.setItem("auth:accessToken", token);
  }
  
  static getRefreshToken() {
    return localStorage.getItem("auth:refreshToken");
  }

  static setRefreshToken(token) {
    localStorage.setItem("auth:refreshToken", token);
  }

  static getUserId() {
    try {
      return parseInt(localStorage.getItem("app:userId"));
    } catch (err) {}
    return null;
  }

  static setUserId(userId) {
    localStorage.setItem("app:userId", userId);
  }
}
