import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioService } from './usuario.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let supabaseService: SupabaseService;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  const mockSupabaseService = {
    getClient: jest.fn().mockReturnValue(mockSupabaseClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<UsuarioService>(UsuarioService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUsuarioDto: CreateUsuarioDto = {
      nome: 'João Silva',
      telefone: '11999998888',
      cargo: 'Gerente',
    };

    const authId = 'test-auth-id';

    it('should create a new user successfully', async () => {
      const expectedUser = { id_usuario: 1, ...createUsuarioDto, auth_id: authId };
      
      // Mock para verificação de perfil existente (não encontrado)
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      // Mock para criação do usuário
      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedUser, error: null });

      const result = await service.create(createUsuarioDto, authId);

      expect(result).toEqual(expectedUser);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('Usuario');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([{ ...createUsuarioDto, auth_id: authId }]);
    });

    it('should throw ConflictException if user already has a profile', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: { id_usuario: 1 }, 
        error: null 
      });

      await expect(service.create(createUsuarioDto, authId))
        .rejects
        .toThrow(ConflictException);
    });

    it('should throw error if Supabase returns an error', async () => {
      const supabaseError = { message: 'Database error' };
      
      // Mock para verificação de perfil existente (não encontrado)
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      // Mock para criação com erro
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.create(createUsuarioDto, authId))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const expectedUsers = [
        { id_usuario: 1, nome: 'João' },
        { id_usuario: 2, nome: 'Maria' },
      ];

      // Para findAll, não usar single() mas sim retornar direto
      mockSupabaseClient.select.mockResolvedValueOnce({ data: expectedUsers, error: null });

      const result = await service.findAll();

      expect(result).toEqual(expectedUsers);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('Usuario');
    });

    it('should throw error if Supabase returns an error', async () => {
      const supabaseError = { message: 'Database error' };
      
      mockSupabaseClient.select.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.findAll())
        .rejects
        .toThrow('Database error');
    });
  });

  describe('findOneById', () => {
    const authId = 'test-auth-id';

    it('should return user by auth ID', async () => {
      const expectedUser = { id_usuario: 1, nome: 'João', auth_id: authId };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedUser, error: null });

      const result = await service.findOneById(authId);

      expect(result).toEqual(expectedUser);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('auth_id', authId);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      await expect(service.findOneById(authId))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    const userId = 1;

    it('should return user by ID', async () => {
      const expectedUser = { id_usuario: userId, nome: 'João' };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedUser, error: null });

      const result = await service.findOne(userId);

      expect(result).toEqual(expectedUser);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id_usuario', userId);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      await expect(service.findOne(userId))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const userId = 1;
    const updateUsuarioDto: UpdateUsuarioDto = { nome: 'João Atualizado' };

    it('should update user successfully', async () => {
      const expectedUser = { id_usuario: userId, ...updateUsuarioDto };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedUser, error: null });

      const result = await service.update(userId, updateUsuarioDto);

      expect(result).toEqual(expectedUser);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id_usuario', userId);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      await expect(service.update(userId, updateUsuarioDto))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const userId = 1;

    it('should remove user successfully', async () => {
      // Mock para delete - simular a resolução da promessa diretamente
      mockSupabaseClient.eq.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.remove(userId);

      expect(result).toEqual({ message: `Usuário com ID ${userId} deletado com sucesso.` });
    });

    it('should throw error if Supabase returns an error', async () => {
      const supabaseError = { message: 'Database error' };
      
      mockSupabaseClient.eq.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.remove(userId))
        .rejects
        .toThrow('Database error');
    });
  });
});