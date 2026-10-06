

import {InMemoryRepository} from "./in-memory.repository.js";

export class UsersRepository extends InMemoryRepository
{
 findByEmail(Email)
{
return this.findOne((user)=> user.email === Email.toLowerCase());
}
}