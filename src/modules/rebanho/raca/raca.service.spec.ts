import { Test, TestingModule } from '@nestjs/testing';
import { RacaService } from './raca.service';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateRacaDto } from './dto/create-raca.dto';
import { UpdateRacaDto } from './dto/update-raca.dto';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('RacaService', () => {
  let service: RacaService;
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
        RacaService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<RacaService>(RacaService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createRacaDto: CreateRacaDto = {
      nome: 'Murrah',
    };

    it('should create a new raça successfully', async () => {
      const expectedRaca = { id_raca: 1, ...createRacaDto };
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedRaca, error: null });

      const result = await service.create(createRacaDto);

      expect(result).toEqual(expectedRaca);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('Raca');
    });

    it('should throw InternalServerErrorException if Supabase returns an error', async () => {
      const supabaseError = { message: 'Database error' };
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.create(createRacaDto))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should return all raças ordered by name', async () => {
      const expectedRacas = [
        { id_raca: 1, nome: 'Jafarabadi' },
        { id_raca: 2, nome: 'Murrah' },
        { id_raca: 3, nome: 'Surti' },
      ];

      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedRacas, error: null });

      const result = await service.findAll();

      expect(result).toEqual(expectedRacas);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('Raca');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('nome', { ascending: true });
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
    const racaId = 1;

    it('should return raça by ID', async () => {
      const expectedRaca = { id_raca: racaId, nome: 'Murrah' };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedRaca, error: null });

      const result = await service.findOne(racaId);

      expect(result).toEqual(expectedRaca);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id_raca', racaId);
    });

    it('should throw NotFoundException if raça not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      await expect(service.findOne(racaId))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const supabaseError = { message: 'Database error' };
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.findOne(racaId))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    const racaId = 1;
    const updateRacaDto: UpdateRacaDto = { nome: 'Murrah Atualizada' };

    it('should update raça successfully', async () => {
      const expectedRaca = { id_raca: racaId, ...updateRacaDto };

      // Mock para findOne (verificação de existência)
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { id_raca: racaId, nome: 'Murrah' }, error: null });
      // Mock para update
      mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedRaca, error: null });

      const result = await service.update(racaId, updateRacaDto);

      expect(result).toEqual(expectedRaca);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id_raca', racaId);
    });

    it('should throw InternalServerErrorException if update fails', async () => {
      const supabaseError = { message: 'Database error' };
      
      // Mock para findOne (verificação de existência)
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { id_raca: racaId, nome: 'Murrah' }, error: null });
      // Mock para update com erro
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.update(racaId, updateRacaDto))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    const racaId = 1;

    it('should remove raça successfully', async () => {
      // Mock para findOne (verificação de existência)
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { id_raca: racaId, nome: 'Murrah' }, error: null });
      // Mock para delete
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.remove(racaId);

      expect(result).toEqual({ message: 'Raça deletada com sucesso.' });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id_raca', racaId);
    });

    it('should throw InternalServerErrorException if delete fails', async () => {
      const supabaseError = { message: 'Database error' };
      
      // Mock para findOne (verificação de existência)
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { id_raca: racaId, nome: 'Murrah' }, error: null });
      // Mock para delete com erro
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(service.remove(racaId))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });
});
