import { ApiProperty } from '@nestjs/swagger';

export class TourSummaryDto {
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() duration!: string;
  @ApiProperty() cardImage!: string;
  @ApiProperty({ type: String, nullable: true }) region!: string | null;
  @ApiProperty() hasSharedService!: boolean;
  @ApiProperty() hasPrivateService!: boolean;
  @ApiProperty({ type: Number, nullable: true, description: 'Precio compartido de referencia por persona. No es una cotización de checkout.' })
  sharedPrice!: number | null;
  @ApiProperty({ enum: ['USD'] }) currency!: 'USD';
}

export class TourCategoryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
}

export class TourImageDto {
  @ApiProperty() id!: string;
  @ApiProperty() url!: string;
  @ApiProperty({ type: String, nullable: true }) alt!: string | null;
  @ApiProperty() order!: number;
}

export class TourItineraryDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() content!: string;
  @ApiProperty() order!: number;
}

export class TourItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() content!: string;
  @ApiProperty() order!: number;
}

export class TourFaqDto {
  @ApiProperty() id!: string;
  @ApiProperty() question!: string;
  @ApiProperty() answer!: string;
  @ApiProperty() order!: number;
}

export class TourPrivatePriceDto {
  @ApiProperty() id!: string;
  @ApiProperty() pax!: number;
  @ApiProperty() price!: number;
}

export class TourDetailDto extends TourSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty({ type: String, nullable: true }) bannerImage!: string | null;
  @ApiProperty({ type: String, nullable: true }) altitude!: string | null;
  @ApiProperty({ type: String, nullable: true }) transport!: string | null;
  @ApiProperty({ type: String, nullable: true }) groupSize!: string | null;
  @ApiProperty({ type: String, nullable: true }) difficulty!: string | null;
  @ApiProperty({ type: String, nullable: true }) mapImage!: string | null;
  @ApiProperty({ type: String, nullable: true }) metaTitle!: string | null;
  @ApiProperty({ type: String, nullable: true }) metaDescription!: string | null;

  @ApiProperty({ type: [TourCategoryDto] }) categories!: TourCategoryDto[];
  @ApiProperty({ type: [TourImageDto] }) images!: TourImageDto[];
  @ApiProperty({ type: [TourItineraryDto] }) itineraries!: TourItineraryDto[];
  @ApiProperty({ type: [TourItemDto] }) inclusions!: TourItemDto[];
  @ApiProperty({ type: [TourItemDto] }) exclusions!: TourItemDto[];
  @ApiProperty({ type: [TourItemDto] }) recommendations!: TourItemDto[];
  @ApiProperty({ type: [TourFaqDto] }) faqs!: TourFaqDto[];
  @ApiProperty({ type: [TourPrivatePriceDto] }) privatePricing!: TourPrivatePriceDto[];
}

export class PaginationDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() hasMore!: boolean;
}

export class TourListDto {
  @ApiProperty({ type: [TourSummaryDto] }) data!: TourSummaryDto[];
  @ApiProperty({ type: PaginationDto }) pagination!: PaginationDto;
}

export class TransferVehicleOptionDto {
  @ApiProperty() id!: string;
  @ApiProperty() vehicleCode!: string;
  @ApiProperty() vehicleName!: string;
  @ApiProperty({ type: String, nullable: true }) subtitle!: string | null;
  @ApiProperty() maxPax!: number;
  @ApiProperty() maxLuggage!: number;
  @ApiProperty() image!: string;
  @ApiProperty() price!: number;
  @ApiProperty({ type: [String] }) features!: string[];
}

export class TransferSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty() origin!: string;
  @ApiProperty() destination!: string;
  @ApiProperty() duration!: string;
  @ApiProperty() tripType!: string;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty({ type: String, nullable: true }) bannerImage!: string | null;
  @ApiProperty() hasSharedService!: boolean;
  @ApiProperty({ type: Number, nullable: true }) sharedPrice!: number | null;
  @ApiProperty() hasPrivateService!: boolean;
  @ApiProperty({ type: [TransferVehicleOptionDto] }) vehicleOptions!: TransferVehicleOptionDto[];
  @ApiProperty({ enum: ['USD'] }) currency!: 'USD';
}

export class TransferListDto {
  @ApiProperty({ type: [TransferSummaryDto] }) data!: TransferSummaryDto[];
  @ApiProperty({ type: PaginationDto }) pagination!: PaginationDto;
}
