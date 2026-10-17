import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersController } from '../../src/controllers/users.controller.js';

// Thanks to Dependency Injection we can give the controller a FAKE service.
// No repository, no hashing, no HTTP server — we only test what the controller does.

// A fake Express `res` whose methods record calls and return `res` so they can be chained.
function fakeRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.location = vi.fn(() => res);
  res.json = vi.fn(() => res);
  res.end = vi.fn(() => res);
  return res;
}

describe('UsersController', () => {
  let service;
  let controller;

  beforeEach(() => {
    service = {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    controller = new UsersController(service);
  });

  it('create → 201 + Location + the created user', async () => {
    service.create.mockResolvedValue({ id: 'u1', firstName: 'Sita' });
    const req = { body: { firstName: 'Sita' }, baseUrl: '/api/v1/users' };
    const res = fakeRes();

    await controller.create(req, res);

    expect(service.create).toHaveBeenCalledWith({ firstName: 'Sita' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.location).toHaveBeenCalledWith('/api/v1/users/u1');
    expect(res.json).toHaveBeenCalledWith({ data: { id: 'u1', firstName: 'Sita' } });
  });

  it('getById passes the route param to the service', async () => {
    service.getById.mockResolvedValue({ id: 'u1' });
    const res = fakeRes();

    await controller.getById({ params: { id: 'u1' } }, res);

    expect(service.getById).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith({ data: { id: 'u1' } });
  });

  it('remove → 204 with no body', async () => {
    const res = fakeRes();
    await controller.remove({ params: { id: 'u1' } }, res);
    expect(service.remove).toHaveBeenCalledWith('u1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('lets service errors propagate (Express 5 sends them to the error handler)', async () => {
    service.getById.mockRejectedValue(Object.assign(new Error('nope'), { status: 404 }));
    await expect(controller.getById({ params: { id: 'x' } }, fakeRes())).rejects.toMatchObject({ status: 404 });
  });

  it('works even when a method is passed around as a plain function (arrow fields keep `this`)', async () => {
    service.list.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });
    const { list } = controller; // detached, exactly like router.get('/', controller.list)
    const res = fakeRes();
    await list({ query: {}, originalUrl: '/api/v1/users' }, res);
    expect(res.json).toHaveBeenCalled();
  });
});