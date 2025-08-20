import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: ExpressRequest & { user: any }) {
    return this.authService.login(req.user);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 attempts per 5 minutes
  @Post('register')
  async register(@Body() createUserDto: { email: string; password: string; firstName: string; lastName: string; roleId?: string }) {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 600000 } }) // 3 attempts per 10 minutes
  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  async sendMagicLink(@Body() body: { email: string }) {
    return this.authService.sendMagicLink(body.email);
  }

  @Public()
  @Get('magic-link/verify')
  async verifyMagicLink(@Query('token') token: string) {
    return this.authService.verifyMagicLink(token);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 600000 } }) // 3 attempts per 10 minutes
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.sendPasswordReset(body.email);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 attempts per 5 minutes
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  // Validate current access token and return basic user info
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@Request() req: ExpressRequest & { user: any }) {
    return { user: req.user };
  }
}
