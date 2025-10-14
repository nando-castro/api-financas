import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    private jwtService: JwtService,
  ) {}

  async register(nome: string, email: string, senha: string) {
    const usuarioExistente = await this.usuarioRepo.findOne({
      where: { email },
    });
    if (usuarioExistente) {
      throw new ConflictException('Email já cadastrado');
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const novo = this.usuarioRepo.create({ nome, email, senha: senhaHash });
    await this.usuarioRepo.save(novo);

    return {
      nome: novo.nome,
      email: novo.email,
      criadoEm: novo.criadoEm,
    };
  }

  async login(email: string, senha: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { email } });
    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Senha incorreta');
    }

    const payload = {
      nome: usuario.nome,
      email: usuario.email,
      criadoEm: usuario.criadoEm,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      tema: usuario.tema,
      moeda: usuario.moeda,
      idioma: usuario.idioma,
    };
  }
}
