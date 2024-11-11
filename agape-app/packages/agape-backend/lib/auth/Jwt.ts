import * as jwt from "jsonwebtoken";
import ms from "ms";

export default class Jwt {
  public readonly maxAge: number;
  private readonly opt: jwt.SignOptions;

  constructor(private secret: string, expiresIn = "24h") {
    this.maxAge = ms(expiresIn);

    this.opt = { expiresIn: this.maxAge };
  }

  public generateToken(userData: any) {
    return new Promise<string>((res, rej) => {
      jwt.sign(userData, this.secret, this.opt, (error, token) => {
        if (error) return rej(error);

        if (token) return res(token);

        throw new Error("unknown error");
      });
    });
  }

  public verifyToken(token: string) {
    return new Promise<jwt.JwtPayload>((res, rej) => {
      jwt.verify(token, this.secret, (error, payload) => {
        if (error) return rej(error);

        if (payload) return res(payload as jwt.JwtPayload);

        throw new Error("unknown error");
      });
    });
  }
}
