import { WeightDistribution } from '../value-objects/WeightDistribution';

export interface SupplierWeightConfigProps {
  id?: number;
  weightPrice: number;
  weightOtif: number;
  weightQuality: number;
  weightLeadtime: number;
  updatedBy?: string | null;
  updatedAt?: Date;
}

export class SupplierWeightConfig {
  public readonly id?: number;
  public readonly weights: WeightDistribution;
  public readonly updatedBy?: string | null;
  public readonly updatedAt: Date;

  constructor(props: SupplierWeightConfigProps) {
    this.id = props.id;
    this.weights = new WeightDistribution(
      props.weightPrice,
      props.weightOtif,
      props.weightQuality,
      props.weightLeadtime
    );
    this.updatedBy = props.updatedBy;
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public get weightPrice(): number {
    return this.weights.weightPrice;
  }

  public get weightOtif(): number {
    return this.weights.weightOtif;
  }

  public get weightQuality(): number {
    return this.weights.weightQuality;
  }

  public get weightLeadtime(): number {
    return this.weights.weightLeadTime;
  }
}
