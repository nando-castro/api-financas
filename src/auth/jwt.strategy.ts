import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'chave_super_secreta',
    });
  }

  async validate(payload: any) {
    const usuario = await this.usuarioRepo.findOne({
      where: { email: payload.email },
    });

    if (!usuario) return null;

    return { id: usuario.id, nome: usuario.nome, email: usuario.email };
  }
}
