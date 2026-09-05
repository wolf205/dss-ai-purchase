import { DomainException } from '../exceptions/DomainException';
export type SupplierStatusTag = 'NEW_SUPPLIER' | 'ACTIVE';

export interface SupplierProps {
  id?: string;
  code: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  statusTag?: SupplierStatusTag;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Supplier {
  public readonly id?: string;
  public readonly code: string;
  private _name: string;
  private _phone: string;
  private _email?: string | null;
  private _address?: string | null;
  private _statusTag: SupplierStatusTag;
  private _isActive: boolean;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: SupplierProps) {
    if (!props.code || !props.code.trim()) {
      throw new DomainException('Mã nhà cung cấp không được để trống', 'BUSINESS_RULE_VIOLATION');
    }
    if (!props.name || !props.name.trim()) {
      throw new DomainException('Tên nhà cung cấp không được để trống', 'BUSINESS_RULE_VIOLATION');
    }
    if (!props.phone || !props.phone.trim()) {
      throw new DomainException('Số điện thoại nhà cung cấp không được để trống', 'BUSINESS_RULE_VIOLATION');
    }

    this.id = props.id;
    this.code = props.code.trim().toUpperCase();
    this._name = props.name.trim();
    this._phone = props.phone.trim();
    this._email = props.email ? props.email.trim() : null;
    this._address = props.address ? props.address.trim() : null;
    this._statusTag = props.statusTag ?? 'NEW_SUPPLIER';
    this._isActive = props.isActive ?? true;
    this.createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public get name(): string {
    return this._name;
  }

  public get phone(): string {
    return this._phone;
  }

  public get email(): string | null | undefined {
    return this._email;
  }

  public get address(): string | null | undefined {
    return this._address;
  }

  public get statusTag(): SupplierStatusTag {
    return this._statusTag;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateInfo(params: {
    name?: string;
    phone?: string;
    email?: string | null;
    address?: string | null;
    statusTag?: SupplierStatusTag;
  }): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new DomainException('Tên nhà cung cấp không được để trống', 'BUSINESS_RULE_VIOLATION');
      this._name = params.name.trim();
    }
    if (params.phone !== undefined) {
      if (!params.phone.trim()) throw new DomainException('Số điện thoại không được để trống', 'BUSINESS_RULE_VIOLATION');
      this._phone = params.phone.trim();
    }
    if (params.email !== undefined) {
      this._email = params.email ? params.email.trim() : null;
    }
    if (params.address !== undefined) {
      this._address = params.address ? params.address.trim() : null;
    }
    if (params.statusTag !== undefined) {
      this._statusTag = params.statusTag;
    }
    this._updatedAt = new Date();
  }

  public setActiveStatus(isActive: boolean): void {
    this._isActive = isActive;
    this._updatedAt = new Date();
  }
}
