import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
    sub?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    [key: string]: unknown;
}

export default class AuthStorage {
    private static accessTokenKey = 'accessToken';
    private static idTokenKey = 'idToken';
    private static refreshTokenKey = 'refreshToken';

    static saveTokens(accessToken: string, idToken: string, refreshToken: string): void {
        localStorage.setItem(this.accessTokenKey, accessToken);
        localStorage.setItem(this.idTokenKey, idToken);
        localStorage.setItem(this.refreshTokenKey, refreshToken);
    }

    static getAccessToken(): string | null {
        return localStorage.getItem(this.accessTokenKey);
    }

    static getIdToken(): string | null {
        return localStorage.getItem(this.idTokenKey);
    }

    static getRefreshToken(): string | null {
        return localStorage.getItem(this.refreshTokenKey);
    }

    public static decodeJwt(token: string): JwtPayload | null {
        try {
            return jwtDecode<JwtPayload>(token);
        } catch {
            return null;
        }
    }

    static getSub(): string | null {
        const idToken = this.getIdToken();
        if (!idToken) return null;
        const decoded = this.decodeJwt(idToken);
        return decoded?.sub || null;
    }

    static clearTokens(): void {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.idTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
    }
}
