import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(nome: string, email: string, senha: string) {
    const usuarioExistente = await this.usuarioRepo.findOne({ where: { email } });
    if (usuarioExistente) throw new ConflictException('Email já cadastrado');

    const senhaHash = await bcrypt.hash(senha, 10);
    const novo = this.usuarioRepo.create({ nome, email, senha: senhaHash });
    await this.usuarioRepo.save(novo);

    const payload = { nome: novo.nome, email: novo.email, criadoEm: novo.criadoEm };
    const token = this.jwtService.sign(payload);

    return {
      token,
      tema: novo.tema ?? 'light',
      moeda: novo.moeda ?? 'BRL',
      idioma: novo.idioma ?? 'pt-BR',
    };
  }

  async login(email: string, senha: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { email } });
    if (!usuario) throw new UnauthorizedException('Usuário não encontrado');

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) throw new UnauthorizedException('Senha incorreta');

    const payload = { nome: usuario.nome, email: usuario.email, criadoEm: usuario.criadoEm };
    const token = this.jwtService.sign(payload);

    return {
      token,
      tema: usuario.tema,
      moeda: usuario.moeda,
      idioma: usuario.idioma,
    };
  }

  // 🔹 1. Esqueci minha senha
  async forgotPassword(email: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { email } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const token = crypto.randomBytes(32).toString('hex');
    const expiraEm = new Date();
    expiraEm.setHours(expiraEm.getHours() + 1); // expira em 1 hora

    usuario.resetToken = token;
    usuario.resetTokenExpiraEm = expiraEm;

    await this.usuarioRepo.save(usuario);

    // Aqui você enviaria o e-mail (por enquanto, só retorna)
    await this.mailService.enviarEmailRecuperacao(usuario.email, usuario.nome, token);
    return { message: 'E-mail de recuperação enviado com sucesso' };
  }

  // 🔹 2. Redefinir senha
  async resetPassword(token: string, novaSenha: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { resetToken: token } });
    if (!usuario) throw new BadRequestException('Token inválido');

    if (!usuario.resetTokenExpiraEm || usuario.resetTokenExpiraEm < new Date()) {
      throw new BadRequestException('Token expirado');
    }

    usuario.senha = await bcrypt.hash(novaSenha, 10);
    usuario.resetToken = null;
    usuario.resetTokenExpiraEm = null;

    await this.usuarioRepo.save(usuario);

    return { message: 'Senha redefinida com sucesso' };
  }
}
