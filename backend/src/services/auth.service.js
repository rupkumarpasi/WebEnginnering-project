// Orchestrates login flows. Knows nothing about HTTP or cookies (that's the controller's job).
export class AuthService {
  constructor(usersService, tokenService) {
    this.users = usersService;
    this.tokens = tokenService;
  }

  async #session(user) {
    const refresh = await this.tokens.issueRefreshToken(user.id);
    return { user, accessToken: this.tokens.signAccessToken(user), refresh };
  }

  async register(data) {
    return this.#session(await this.users.create(data)); // always role "customer"
  }

  async login(email, password) {
    return this.#session(await this.users.verifyCredentials(email, password));
  }

  async loginWithGithub(profile) {
    return this.#session(await this.users.findOrCreateFromGithub(profile));
  }

  async refresh(refreshToken) {
    const { userId, refresh } = await this.tokens.rotateRefreshToken(refreshToken);
    const user = await this.users.getById(userId); // re-read: picks up role changes
    return { user, accessToken: this.tokens.signAccessToken(user), refresh };
  }

  logout(refreshToken) {
    return this.tokens.revokeRefreshToken(refreshToken);
  }

  async changePassword(userId, currentPassword, newPassword) {
    await this.users.changePassword(userId, currentPassword, newPassword);
    await this.tokens.revokeAllForUser(userId); // log out every device
  }
}
