import { AttributeValue } from "../attributeValue/attributeValue";

export interface Attribute {
    attributeId: string,
    attributeName: string,
    attributeNameUz: string,
    attributeSlug: string,
    valueId: string,
    value: string,
    valueUz: string,
    valueSlug: string
}

export interface AttributeGroupedValues {
  id: string;
  name: string;
  nameUz: string;
  slug: string;
  values: AttributeValue[];
}