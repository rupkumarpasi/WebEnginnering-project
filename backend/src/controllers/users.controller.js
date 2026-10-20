import { pageLinks } from '../utils/query.js';

// Dependency Injection: the controller RECEIVES its service instead of creating it.
// It no longer imports UsersService or UsersRepository at all.
export class UsersController {
  constructor(usersService) {
    this.usersService = usersService;
  }

  list = async (req, res) => {
    const { data, meta } = await this.usersService.list(req.query);
    res.json({ data, meta, links: pageLinks(req, meta) });
  };

  getById = async (req, res) => {
    res.json({ data: await this.usersService.getById(req.params.id) });
  };

  create = async (req, res) => {
    const user = await this.usersService.create(req.body);
    res.status(201).location(`${req.baseUrl}/${user.id}`).json({ data: user });
  };

  update = async (req, res) => {
    res.json({ data: await this.usersService.update(req.params.id, req.body) });
  };

  // Admin only (RBAC): PATCH /users/:id/role  { "role": "admin" }
  changeRole = async (req, res) => {
    res.json({ data: await this.usersService.changeRole(req.params.id, req.body.role) });
  };

  remove = async (req, res) => {
    await this.usersService.remove(req.params.id);
    res.status(204).end();
  };
}