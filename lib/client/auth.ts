import { jwtDecode } from "jwt-decode";

type TokenPayload = {
  exp?: number;
  data?: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

class AuthService {
  getProfile() {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    return jwtDecode<TokenPayload>(token);
  }

  loggedIn() {
    const token = this.getToken();
    return Boolean(token) && !this.isTokenExpired(token);
  }

  isTokenExpired(token: string | null) {
    if (!token) {
      return true;
    }
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      if (!decoded.exp) {
        return false;
      }
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  getToken() {
    if (typeof window === "undefined") {
      return null;
    }
    const token = localStorage.getItem("id_token");
    if (this.isTokenExpired(token)) {
      this.logout(false);
      return null;
    }
    return token;
  }

  login(idToken: string) {
    localStorage.setItem("id_token", idToken);
    window.location.assign("/dashboard");
  }

  logout(redirect = true) {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.removeItem("id_token");
    if (redirect) {
      window.location.assign("/");
    }
  }
}

const Auth = new AuthService();
export default Auth;
