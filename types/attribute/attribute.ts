import { AttributeValue } from "../attributeValue/attributeValue";

export interface Attribute {
    attributeId: string,
    attributeName: string,
    attributeSlug: string,
    valueId: string,
    value: string,
    valueSlug: string
}

export interface AttributeGroupedValues {
  id: string;
  name: string;
  slug: string;
  values: AttributeValue[];
}