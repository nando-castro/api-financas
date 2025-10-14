import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'chave_super_secreta',
    });
  }

  async validate(payload: { email: string; nome: string }) {
    // payload é o conteúdo que definirmos dentro do token (nome, email, etc.)
    return { nome: payload.nome, email: payload.email };
  }
}
