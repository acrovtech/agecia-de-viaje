import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { PublicRoute } from '../security/public-route.js';
import { CatalogService } from './catalog.service.js';
import {
  TourDetailDto,
  TourListDto,
  TransferListDto,
  TransferSummaryDto,
} from './catalog.dto.js';

const identifier = z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const pagination = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

function valid<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new BadRequestException();
  return parsed.data;
}

@Controller({ path: 'storefronts/:storefront', version: '1' })
@ApiTags('catalog')
@ApiParam({ name: 'storefront', description: 'Slug público de una agencia habilitada para esta API.' })
@PublicRoute()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('tours')
  @ApiOperation({ summary: 'Lista paginada del catálogo público de tours de una agencia.' })
  @ApiQuery({ name: 'page', required: false, type: Number, minimum: 1, maximum: 10000 })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiOkResponse({ type: TourListDto })
  list(@Param('storefront') storefront: string, @Query() query: Record<string, unknown>) {
    const { page, limit } = valid(pagination, query);
    return this.catalog.list(valid(identifier, storefront), page, limit);
  }

  @Get('tours/:slug')
  @ApiOperation({ summary: 'Detalle de un tour específico dentro de esta agencia.' })
  @ApiParam({ name: 'slug', description: 'Slug del tour dentro de esta agencia.' })
  @ApiOkResponse({ type: TourDetailDto })
  detail(@Param('storefront') storefront: string, @Param('slug') slug: string) {
    return this.catalog.detail(valid(identifier, storefront), valid(identifier, slug));
  }

  @Get('transfers')
  @ApiOperation({ summary: 'Lista paginada del catálogo público de traslados de una agencia.' })
  @ApiQuery({ name: 'page', required: false, type: Number, minimum: 1, maximum: 10000 })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiOkResponse({ type: TransferListDto })
  listTransfers(@Param('storefront') storefront: string, @Query() query: Record<string, unknown>) {
    const { page, limit } = valid(pagination, query);
    return this.catalog.listTransfers(valid(identifier, storefront), page, limit);
  }

  @Get('transfers/:slug')
  @ApiOperation({ summary: 'Detalle de un traslado específico dentro de esta agencia.' })
  @ApiParam({ name: 'slug', description: 'Slug del traslado dentro de esta agencia.' })
  @ApiOkResponse({ type: TransferSummaryDto })
  detailTransfer(@Param('storefront') storefront: string, @Param('slug') slug: string) {
    return this.catalog.detailTransfer(valid(identifier, storefront), valid(identifier, slug));
  }
}
