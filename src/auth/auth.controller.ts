import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const { nome, email, senha } = body;
    return this.authService.register(nome, email, senha);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const { email, senha } = body;
    return this.authService.login(email, senha);
  }
}
