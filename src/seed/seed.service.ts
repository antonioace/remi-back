import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async run() {
    const adminEmail = 'admin@remido.local';
    const userEmail = 'antonioacevedo@gmail.com';

    let admin = await this.usersService.findByEmail(adminEmail);
    if (!admin) {
      admin = await this.usersService.create({
        email: adminEmail,
        name: 'Admin',
        password: 'Admin123',
        role: 'admin',
        isActive: true,
      });
    }

    let user = await this.usersService.findByEmail(userEmail);
    if (!user) {
      user = await this.usersService.create({
        email: userEmail,
        name: 'Antonio Acevedo',
        password: '123123123',
        role: 'user',
        isActive: true,
      });
    }

    await this.notificationsService.create(user.id, {
      title: 'Bienvenido',
      message: 'Tu cuenta fue creada exitosamente.',
    });

    return { adminId: admin.id, userId: user.id };
  }
}
