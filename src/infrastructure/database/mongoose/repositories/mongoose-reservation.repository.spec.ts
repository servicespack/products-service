import type { Model } from 'mongoose'
import type { IReservationDoc } from '../models/reservation.model'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Reservation } from '../../../../domain/entities/reservation.entity'
import { transactionStorage } from '../transaction.context'
import { MongooseReservationRepository } from './mongoose-reservation.repository'

describe(MongooseReservationRepository.name, () => {
  let model: Model<IReservationDoc>
  let repository: MongooseReservationRepository

  beforeEach(() => {
    model = {
      create: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    } as unknown as Model<IReservationDoc>
    repository = new MongooseReservationRepository(model)
  })

  it('should create and return a reservation', async () => {
    const reservation = new Reservation({
      id: 'res-123',
      productId: 'prod-123',
      quantity: 2,
      reason: 'Hold',
    })

    const mockDoc = {
      _id: 'res-123',
      productId: 'prod-123',
      quantity: 2,
      status: 'ACTIVE',
      reason: 'Hold',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(model.create).mockResolvedValueOnce([mockDoc] as any)

    const result = await repository.create(reservation)

    expect(model.create).toHaveBeenCalledOnce()
    expect(result.id).toBe('res-123')
    expect(result.productId).toBe('prod-123')
    expect(result.quantity).toBe(2)
  })

  it('should pass session when transaction is active during create and findById', async () => {
    const reservation = new Reservation({
      id: 'res-tx',
      productId: 'prod-tx',
      quantity: 1,
    })
    const mockDoc = {
      _id: 'res-tx',
      productId: 'prod-tx',
      quantity: 1,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const mockSession = { id: 'session-123' } as any

    vi.mocked(model.create).mockResolvedValueOnce([mockDoc] as any)
    vi.mocked(model.findById).mockResolvedValueOnce(mockDoc as any)

    await transactionStorage.run(mockSession, async () => {
      await repository.create(reservation)
      await repository.findById('res-tx')
    })

    expect(model.create).toHaveBeenCalledWith([expect.any(Object)], { session: mockSession })
    expect(model.findById).toHaveBeenCalledWith('res-tx', null, { session: mockSession })
  })

  it('should find reservation by id', async () => {
    const mockDoc = {
      _id: 'res-123',
      productId: 'prod-123',
      quantity: 2,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(model.findById).mockResolvedValueOnce(mockDoc as any)

    const result = await repository.findById('res-123')

    expect(model.findById).toHaveBeenCalledWith('res-123', null, undefined)
    expect(result?.id).toBe('res-123')
  })

  it('should return null when reservation not found', async () => {
    vi.mocked(model.findById).mockResolvedValueOnce(null)

    const result = await repository.findById('non-existent')

    expect(result).toBeNull()
  })

  it('should update reservation', async () => {
    const reservation = new Reservation({
      id: 'res-123',
      productId: 'prod-123',
      quantity: 2,
      status: 'CANCELLED',
    })

    const mockDoc = {
      _id: 'res-123',
      productId: 'prod-123',
      quantity: 2,
      status: 'CANCELLED',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(model.findByIdAndUpdate).mockResolvedValueOnce(mockDoc as any)

    const result = await repository.update(reservation)

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      'res-123',
      expect.objectContaining({ status: 'CANCELLED' }),
      { new: true, session: undefined },
    )
    expect(result.status).toBe('CANCELLED')
  })

  it('should update reservation with reason', async () => {
    const reservation = new Reservation({
      id: 'res-123',
      productId: 'prod-123',
      quantity: 2,
      status: 'CANCELLED',
      reason: 'Cancelled by customer',
    })

    const mockDoc = {
      _id: 'res-123',
      productId: 'prod-123',
      quantity: 2,
      status: 'CANCELLED',
      reason: 'Cancelled by customer',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(model.findByIdAndUpdate).mockResolvedValueOnce(mockDoc as any)

    const result = await repository.update(reservation)

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      'res-123',
      expect.objectContaining({ status: 'CANCELLED', reason: 'Cancelled by customer' }),
      { new: true, session: undefined },
    )
    expect(result.status).toBe('CANCELLED')
    expect(result.reason).toBe('Cancelled by customer')
  })

  it('should throw when updating non-existent reservation', async () => {
    const reservation = new Reservation({
      id: 'res-123',
      productId: 'prod-123',
      quantity: 2,
    })

    vi.mocked(model.findByIdAndUpdate).mockResolvedValueOnce(null)

    await expect(repository.update(reservation)).rejects.toThrow('Reservation not found')
  })
})
