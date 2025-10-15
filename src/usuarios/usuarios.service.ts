import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Usuario } from './usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  // 🟢 Criar novo usuário
  async criar(dados: Partial<Usuario>) {
    const novo = this.usuarioRepo.create(dados);
    return await this.usuarioRepo.save(novo);
  }

  // 🟢 Listar todos (uso interno / debug)
  async listar() {
    return await this.usuarioRepo.find();
  }

  // 🟢 Buscar por e-mail (login, registro, recuperação)
  async buscarPorEmail(email: string) {
    return await this.usuarioRepo.findOne({ where: { email } });
  }

  // 🟣 Buscar por token de redefinição de senha válido
  async buscarPorTokenReset(token: string) {
    return await this.usuarioRepo.findOne({
      where: {
        resetToken: token,
        resetTokenExpiraEm: MoreThan(new Date()),
      },
    });
  }

  // 🟣 Salvar token de redefinição de senha
  async salvarTokenReset(id: number, token: string, expiraEm: Date) {
    await this.usuarioRepo.update(id, {
      resetToken: token,
      resetTokenExpiraEm: expiraEm,
    });
  }

  // 🟣 Limpar token de redefinição (após uso)
  async limparTokenReset(id: number) {
    await this.usuarioRepo.update(id, {
      resetToken: null,
      resetTokenExpiraEm: null,
    });
  }

  // 🟢 Atualizar senha
  async atualizarSenha(id: number, novaSenhaHash: string) {
    await this.usuarioRepo.update(id, { senha: novaSenhaHash });
  }

  // ⚙️ Atualizar preferências do usuário (tema, idioma, moeda)
  async atualizarPreferencias(
    id: number,
    preferencias: Partial<Pick<Usuario, 'tema' | 'idioma' | 'moeda'>>,
  ) {
    await this.usuarioRepo.update(id, preferencias);
    return this.usuarioRepo.findOne({ where: { id } });
  }
}
