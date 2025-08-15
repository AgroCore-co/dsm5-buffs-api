import { Test, TestingModule } from '@nestjs/testing';
import { AlimentacaoDefService } from './alimentacao-def.service';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateAlimentacaoDefDto } from './dto/create-alimentacao-def.dto';
import { UpdateAlimentacaoDefDto } from './dto/update-alimentacao-def.dto';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('AlimentacaoDefService', () => {
  let service: AlimentacaoDefService;
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
        AlimentacaoDefService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<AlimentacaoDefService>(AlimentacaoDefService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createAlimentacaoDefDto: CreateAlimentacaoDefDto = {
      nome_alimentacao: 'Ração de Recria',
      descricao: 'Ração balanceada para búfalos em fase de recria',
      tipo_alimentacao: 'C',
    };

    it('should create a new alimentação definida successfully', async () => {
      const expectedAlimentacaoDef = { id_alimentacao_def: 1, ...createAlimentacaoDefDto };
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedAlimentacaoDef, error: null });

      const result = await service.create(createAlimentacaoDefDto);

      expect(result).toEqual(expectedAlimentacaoDef);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('AlimentacaoDef');
    });

    it('should throw InternalServerErrorException if Supabase returns an error', async () => {
      const supabaseError = { message: 'Database error' };
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.create(createAlimentacaoDefDto))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should return all alimentações definidas ordered by name', async () => {
      const expectedAlimentacoesDef = [
        { id_alimentacao_def: 1, nome_alimentacao: 'Pasto Verde', tipo_alimentacao: 'P' },
        { id_alimentacao_def: 2, nome_alimentacao: 'Ração de Recria', tipo_alimentacao: 'C' },
        { id_alimentacao_def: 3, nome_alimentacao: 'Suplemento Mineral', tipo_alimentacao: 'S' },
      ];

      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedAlimentacoesDef, error: null });

      const result = await service.findAll();

      expect(result).toEqual(expectedAlimentacoesDef);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('AlimentacaoDef');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('nome_alimentacao', { ascending: true });
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
    const alimentacaoDefId = 1;

    it('should return alimentação definida by ID', async () => {
      const expectedAlimentacaoDef = { 
        id_alimentacao_def: alimentacaoDefId, 
        nome_alimentacao: 'Ração de Recria',
        tipo_alimentacao: 'C'
      };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedAlimentacaoDef, error: null });

      const result = await service.findOne(alimentacaoDefId);

      expect(result).toEqual(expectedAlimentacaoDef);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id_alimentacao_def', alimentacaoDefId);
    });

    it('should throw NotFoundException if alimentação definida not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      await expect(service.findOne(alimentacaoDefId))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const supabaseError = { message: 'Database error' };
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.findOne(alimentacaoDefId))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    const alimentacaoDefId = 1;
    const updateAlimentacaoDefDto: UpdateAlimentacaoDefDto = { nome_alimentacao: 'Ração de Recria Atualizada' };

    it('should update alimentação definida successfully', async () => {
      const expectedAlimentacaoDef = { id_alimentacao_def: alimentacaoDefId, ...updateAlimentacaoDefDto };

      // Mock para findOne (verificação de existência)
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: { id_alimentacao_def: alimentacaoDefId, nome_alimentacao: 'Ração de Recria' }, 
        error: null 
      });
      // Mock para update
      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedAlimentacaoDef, error: null });

      const result = await service.update(alimentacaoDefId, updateAlimentacaoDefDto);

      expect(result).toEqual(expectedAlimentacaoDef);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id_alimentacao_def', alimentacaoDefId);
    });

    it('should throw InternalServerErrorException if update fails', async () => {
      const supabaseError = { message: 'Database error' };
      
      // Mock para findOne (verificação de existência)
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: { id_alimentacao_def: alimentacaoDefId, nome_alimentacao: 'Ração de Recria' }, 
        error: null 
      });
      // Mock para update com erro
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.update(alimentacaoDefId, updateAlimentacaoDefDto))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    const alimentacaoDefId = 1;

    it('should remove alimentação definida successfully', async () => {
      // Mock para findOne (verificação de existência)
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: { id_alimentacao_def: alimentacaoDefId, nome_alimentacao: 'Ração de Recria' }, 
        error: null 
      });
      // Mock para delete
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.remove(alimentacaoDefId);

      expect(result).toEqual({ message: 'Alimentação definida deletada com sucesso.' });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id_alimentacao_def', alimentacaoDefId);
    });

    it('should throw InternalServerErrorException if delete fails', async () => {
      const supabaseError = { message: 'Database error' };
      
      // Mock para findOne (verificação de existência)
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: { id_alimentacao_def: alimentacaoDefId, nome_alimentacao: 'Ração de Recria' }, 
        error: null 
      });
      // Mock para delete com erro
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.remove(alimentacaoDefId))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });
});
