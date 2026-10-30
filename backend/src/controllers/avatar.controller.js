export class AvatarController {
  constructor(avatarService) {
    this.avatars = avatarService;
  }

  // POST /users/:id/avatar   (multipart/form-data, field "avatar")
  upload = async (req, res) => {
    res.json({ data: await this.avatars.setAvatar(req.params.id, req.file.buffer) });
  };

  // DELETE /users/:id/avatar
  remove = async (req, res) => {
    res.json({ data: await this.avatars.removeAvatar(req.params.id) });
  };

  // POST /users/:id/avatar/presign   { contentType, size }
  presign = async (req, res) => {
    res.status(201).json({ data: await this.avatars.createDirectUpload(req.params.id, req.body) });
  };

  // POST /users/:id/avatar/complete  { key }
  complete = async (req, res) => {
    res.json({ data: await this.avatars.completeDirectUpload(req.params.id, req.body.key) });
  };
}
