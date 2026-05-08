declare const _exports: TokenService;
export = _exports;
declare class TokenService {
    generateTokens(user: any): {
        accessToken: never;
        refreshToken: never;
        expiresIn: number;
    };
    verifyAccessToken(token: any): string | jwt.JwtPayload;
    verifyRefreshToken(token: any): string | jwt.JwtPayload;
    generateOTP(): string;
}
import jwt = require("jsonwebtoken");
