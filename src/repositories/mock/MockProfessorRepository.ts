import { Professor } from '@prisma/client';
import { CreateProfessorDTO, IProfessorRepository } from '../interfaces/IProfessorRepository';

export class MockProfessorRepository implements IProfessorRepository {
  private professors: Professor[] = [
    {
      id: 'prof-catolica-01',
      nomeCompleto: 'Prof. Carlos Eduardo Mendes',
      email: 'carlos.mendes@catolicasc.edu.br',
      senhaHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'usr-prof-1',
      nomeCompleto: 'Prof. Dra. Maria Helena Diniz',
      email: 'prof.helena@catolica.edu.br',
      senhaHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    },
  ];

  async findById(id: string): Promise<Professor | null> {
    return this.professors.find((p) => p.id === id) || null;
  }

  async findByEmail(email: string): Promise<Professor | null> {
    return this.professors.find((p) => p.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async create(data: CreateProfessorDTO): Promise<Professor> {
    const newProf: Professor = {
      id: `prof-${Date.now()}`,
      nomeCompleto: data.nomeCompleto,
      email: data.email,
      senhaHash: data.senhaHash,
      createdAt: new Date(),
    };
    this.professors.push(newProf);
    return newProf;
  }
}
