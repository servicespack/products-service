import type { ListProductsInputDto } from '../dtos/list-products-input.dto'
import type { ListProductsOutputDto } from '../dtos/list-products-output.dto'
import type { IProductRepository } from '../interfaces/product-repository.interface'
import type { IUseCase } from '../interfaces/use-case.interface'

export class ListProductsUseCase implements IUseCase<ListProductsInputDto, ListProductsOutputDto> {
  constructor(
    private readonly productRepository: IProductRepository,
  ) {}

  public async execute(input: ListProductsInputDto) {
    return this.productRepository.findAll({
      search: input.search,
    })
  };
}
