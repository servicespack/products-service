import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface'
import type { IncreaseStockUseCase } from './increase-stock.use-case'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../../domain/entities/product.entity'
import { Reservation } from '../../../domain/entities/reservation.entity'
import { ReservationAlreadyCancelledError, ReservationNotFoundError } from '../../../domain/errors'
import { CancelReservationUseCase } from './cancel-reservation.use-case'

describe(CancelReservationUseCase.name, () => {
  let increaseStockUseCase: IncreaseStockUseCase
  let reservationRepository: IReservationRepository
  let cancelReservationUseCase: CancelReservationUseCase

  beforeEach(() => {
    increaseStockUseCase = {
      execute: vi.fn(),
    } as unknown as IncreaseStockUseCase

    reservationRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(async (r: Reservation) => r),
    }

    cancelReservationUseCase = new CancelReservationUseCase(increaseStockUseCase, reservationRepository)
  })

  it('should cancel active reservation and restore exact reserved stock', async () => {
    const reservationId = faker.string.uuid()
    const productId = faker.string.uuid()

    const reservation = new Reservation({
      id: reservationId,
      productId,
      quantity: 3,
      status: 'ACTIVE',
      reason: 'Hold',
    })

    const product = new Product({
      id: productId,
      name: 'Test Product',
      price: 100,
      stock: 13,
    })

    vi.mocked(reservationRepository.findById).mockResolvedValueOnce(reservation)
    vi.mocked(increaseStockUseCase.execute).mockResolvedValueOnce(product)

    const result = await cancelReservationUseCase.execute({
      reservationId,
      reason: 'Customer cancelled',
    })

    expect(reservationRepository.findById).toHaveBeenCalledWith(reservationId)
    expect(reservationRepository.update).toHaveBeenCalledWith(expect.objectContaining({
      id: reservationId,
      status: 'CANCELLED',
    }))
    expect(increaseStockUseCase.execute).toHaveBeenCalledWith(productId, {
      quantity: 3,
      reason: 'Customer cancelled',
    })
    expect(result.product).toBe(product)
    expect(result.reservation.status).toBe('CANCELLED')
  })

  it('should use default reason when reason is not provided', async () => {
    const reservationId = faker.string.uuid()
    const productId = faker.string.uuid()

    const reservation = new Reservation({
      id: reservationId,
      productId,
      quantity: 2,
      status: 'ACTIVE',
    })

    const product = new Product({
      id: productId,
      name: 'Test Product',
      price: 100,
      stock: 5,
    })

    vi.mocked(reservationRepository.findById).mockResolvedValueOnce(reservation)
    vi.mocked(increaseStockUseCase.execute).mockResolvedValueOnce(product)

    const result = await cancelReservationUseCase.execute({ reservationId })

    expect(increaseStockUseCase.execute).toHaveBeenCalledWith(productId, {
      quantity: 2,
      reason: 'Reservation Cancellation',
    })
    expect(result.reservation.status).toBe('CANCELLED')
  })

  it('should throw ReservationNotFoundError if reservationId is empty', async () => {
    await expect(cancelReservationUseCase.execute({ reservationId: '' }))
      .rejects
      .toThrowError('Reservation ID is required')

    await expect(cancelReservationUseCase.execute({ reservationId: '   ' }))
      .rejects
      .toThrowError('Reservation ID is required')

    expect(reservationRepository.findById).not.toHaveBeenCalled()
  })

  it('should throw ReservationNotFoundError if reservation does not exist', async () => {
    vi.mocked(reservationRepository.findById).mockResolvedValueOnce(null)

    await expect(cancelReservationUseCase.execute({ reservationId: 'non-existent' }))
      .rejects
      .toThrow(ReservationNotFoundError)

    expect(increaseStockUseCase.execute).not.toHaveBeenCalled()
  })

  it('should throw ReservationAlreadyCancelledError and NOT increase stock on repeated cancellation', async () => {
    const reservationId = faker.string.uuid()
    const productId = faker.string.uuid()

    const reservation = new Reservation({
      id: reservationId,
      productId,
      quantity: 3,
      status: 'CANCELLED',
    })

    vi.mocked(reservationRepository.findById).mockResolvedValueOnce(reservation)

    await expect(cancelReservationUseCase.execute({ reservationId }))
      .rejects
      .toThrow(ReservationAlreadyCancelledError)

    expect(reservationRepository.update).not.toHaveBeenCalled()
    expect(increaseStockUseCase.execute).not.toHaveBeenCalled()
  })
})
