import { Test, TestingModule } from '@nestjs/testing';
import { GrupoService } from './grupo.service';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('GrupoService', () => {
  let service: GrupoService;
  let supabaseService: SupabaseService;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
  };

  const mockSupabaseService = {
    getClient: jest.fn().mockReturnValue(mockSupabaseClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrupoService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<GrupoService>(GrupoService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createGrupoDto: CreateGrupoDto = {
      nome_grupo: 'Grupo de Recria',
      nivel_maturidade: 'N',
    };

    it('should create a new grupo successfully', async () => {
      const expectedGrupo = { id_grupo: 1, ...createGrupoDto };
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedGrupo, error: null });

      const result = await service.create(createGrupoDto);

      expect(result).toEqual(expectedGrupo);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('Grupo');
    });

    it('should throw InternalServerErrorException if Supabase returns an error', async () => {
      const supabaseError = { message: 'Database error' };
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.create(createGrupoDto))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should return all grupos ordered by name', async () => {
      const expectedGrupos = [
        { id_grupo: 1, nome_grupo: 'Grupo de Cria', nivel_maturidade: 'B' },
        { id_grupo: 2, nome_grupo: 'Grupo de Recria', nivel_maturidade: 'N' },
        { id_grupo: 3, nome_grupo: 'Grupo de Produção', nivel_maturidade: 'V' },
      ];

      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedGrupos, error: null });

      const result = await service.findAll();

      expect(result).toEqual(expectedGrupos);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('Grupo');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('nome_grupo', { ascending: true });
    });

    it('should throw InternalServerErrorException if Supabase returns an error', async () => {
      const supabaseError = { message: 'Database error' };
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.findAll())
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('findOne', () => {
    const grupoId = 1;

    it('should return grupo by ID', async () => {
      const expectedGrupo = { id_grupo: grupoId, nome_grupo: 'Grupo de Recria', nivel_maturidade: 'N' };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedGrupo, error: null });

      const result = await service.findOne(grupoId);

      expect(result).toEqual(expectedGrupo);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id_grupo', grupoId);
    });

    it('should throw NotFoundException if grupo not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      await expect(service.findOne(grupoId))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const supabaseError = { message: 'Database error' };
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.findOne(grupoId))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    const grupoId = 1;
    const updateGrupoDto: UpdateGrupoDto = { nome_grupo: 'Grupo de Recria Atualizado' };

    it('should update grupo successfully', async () => {
      const expectedGrupo = { id_grupo: grupoId, ...updateGrupoDto };

      // Mock para findOne (verificação de existência)
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { id_grupo: grupoId, nome_grupo: 'Grupo de Recria' }, error: null });
      // Mock para update
      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedGrupo, error: null });

      const result = await service.update(grupoId, updateGrupoDto);

      expect(result).toEqual(expectedGrupo);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id_grupo', grupoId);
    });

    it('should throw InternalServerErrorException if update fails', async () => {
      const supabaseError = { message: 'Database error' };
      
      // Mock para findOne (verificação de existência)
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { id_grupo: grupoId, nome_grupo: 'Grupo de Recria' }, error: null });
      // Mock para update com erro
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.update(grupoId, updateGrupoDto))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    const grupoId = 1;

    it('should remove grupo successfully', async () => {
      // Mock para findOne (verificação de existência)
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { id_grupo: grupoId, nome_grupo: 'Grupo de Recria' }, error: null });
      // Mock para delete
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.remove(grupoId);

      expect(result).toEqual({ message: 'Grupo deletado com sucesso.' });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id_grupo', grupoId);
    });

    it('should throw InternalServerErrorException if delete fails', async () => {
      const supabaseError = { message: 'Database error' };
      
      // Mock para findOne (verificação de existência)
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { id_grupo: grupoId, nome_grupo: 'Grupo de Recria' }, error: null });
      // Mock para delete com erro
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.remove(grupoId))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });
});
