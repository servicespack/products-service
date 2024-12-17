import { Request, Response } from 'express';
import { ProductsService } from '../services/products.service';

export class ProductsControllers {
  constructor(
    private readonly service: ProductsService
  ) {}

  public async create(request: Request, response: Response): Promise<Response> {
    const result = await this.service.create(request.body)

    return result.match(
      product => response.status(201).json(product),
      err => response.status(400).json({ error: err })
    )
  }

  public async list(request: Request, response: Response): Promise<Response> {
    const result = await this.service.list()

    return result.match(
      products => response.json({ data: products }),
      err => response.status(400).json({ error: err })
    )
  }

  public async findById(request: Request, response: Response): Promise<Response> {
    const result = await this.service.findById(request.params.id)

    return result.match(
      product => response.json(product),
      err => response.status(400).json({ error: err })
    )
  }
}
